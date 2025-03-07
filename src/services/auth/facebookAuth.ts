import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { User } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    updateUser,
    setCurrentUser,
    clearCurrentUser
} from '../database/userRepository';

// Ensure web browser session is completed
WebBrowser.maybeCompleteAuthSession();

// Cognito configuration
const COGNITO_CONFIG = {
    userPoolWebClientId: '2upvhjq2cerrgui5etfehd2nfh',
    domain: 'ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com',
    facebookAppId: Constants.expoConfig?.extra?.facebookAppId
};

const useFacebookAuth = () => {
    // Generate redirect URI with explicit configuration
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: Platform.select({
            native: 'newsapp',
            web: 'https://ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com/'
        }),
    });

    // Cognito discovery endpoints
    const discovery = {
        authorizationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/authorize`,
        tokenEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/token`,
        revocationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/revoke`,
        userInfoEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/userInfo`
    };

    // Authentication request configuration
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: COGNITO_CONFIG.userPoolWebClientId,
            redirectUri: redirectUri,
            responseType: AuthSession.ResponseType.Code,
            usePKCE: true,
            scopes: ['email', 'openid', 'profile'],

            extraParams: {
                response_mode: 'query',
                // Ensure account selection and re-authentication
                prompt: 'login select_account max_age=0',
                // Specify Facebook as the identity provider
                identity_provider: 'Facebook'
            }
        },
        discovery
    );

    const loginWithFacebook = async () => {
        try {
            // Clear any existing authentication state
            await clearCurrentUser();

            console.log('Facebook Login Attempt');
            console.log('Client ID:', COGNITO_CONFIG.userPoolWebClientId);
            console.log('Redirect URI:', redirectUri);
            console.log('Facebook App ID:', COGNITO_CONFIG.facebookAppId);

            // Trigger authentication with explicit parameters
            const result = await promptAsync({
                useProxy: Platform.OS === 'web',
                showInRecents: true,
                ...(Platform.OS === 'web' ? {
                    windowFeatures: {
                        width: 500,
                        height: 600
                    }
                } : {})
            } as any);

            console.log('Authentication Result:', JSON.stringify(result, null, 2));

            // Handle authentication failure
            if (result.type !== 'success') {
                return {
                    success: false,
                    message: result.type === 'cancel'
                        ? 'Authentication cancelled'
                        : 'Authentication failed'
                };
            }

            // Exchange authorization code for tokens
            const tokenResult = await AuthSession.exchangeCodeAsync(
                {
                    clientId: COGNITO_CONFIG.userPoolWebClientId,
                    code: result.params.code,
                    redirectUri: redirectUri,
                    extraParams: {
                        code_verifier: request?.codeVerifier || '',
                    },
                },
                {
                    tokenEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/token`,
                }
            );

            console.log('Token Exchange Result:', JSON.stringify(tokenResult, null, 2));

            // Validate access token
            if (!tokenResult.accessToken) {
                throw new Error('No access token received');
            }

            // Fetch user information
            const userInfoResponse = await fetch(
                `https://${COGNITO_CONFIG.domain}/oauth2/userInfo`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenResult.accessToken}`
                    }
                }
            );

            // Validate user info response
            if (!userInfoResponse.ok) {
                throw new Error(`User info fetch failed: ${userInfoResponse.status}`);
            }

            const userData = await userInfoResponse.json();

            console.log('User Data:', JSON.stringify(userData, null, 2));

            // Validate email
            if (!userData.email) {
                throw new Error('No email received from Facebook');
            }

            // Find existing user
            let existingUser = await getUserByEmail(userData.email, 'facebook');

            // Handle user management with more robust logic
            if (existingUser) {
                // Update existing user's details
                existingUser.firstName = userData.given_name || existingUser.firstName;
                existingUser.lastName = userData.family_name || existingUser.lastName;
                existingUser.profilePicture = userData.picture || existingUser.profilePicture;
                existingUser.lastLoginAt = new Date();

                // Update user in database
                await updateUser(existingUser);
            } else {
                // Create new user
                existingUser = await createUser({
                    id: `facebook_${userData.sub}`,
                    firstName: userData.given_name || '',
                    lastName: userData.family_name || '',
                    email: userData.email,
                    profilePicture: userData.picture || null,
                    authProvider: 'facebook',
                    createdAt: new Date(),
                    lastLoginAt: new Date()
                });
            }

            // Set as current user
            await setCurrentUser(existingUser);

            return { success: true, user: existingUser };

        } catch (error) {
            // Comprehensive error logging
            console.error('Complete Facebook Authentication Error:', error);

            // More detailed error handling
            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    return {
                        success: false,
                        message: 'This account is already registered. Please sign in with the original method.'
                    };
                }

                // Check for common authentication errors
                if (error.message.includes('invalid_grant')) {
                    return {
                        success: false,
                        message: 'Authentication expired. Please try again.'
                    };
                }
            }

            return {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : 'Unknown authentication error'
            };
        }
    };

    return {
        loginWithFacebook,
        request,  // Expose request for potential advanced use cases
        response  // Expose response for potential advanced use cases
    };
};

export default useFacebookAuth;