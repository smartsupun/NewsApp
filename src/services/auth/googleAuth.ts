import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { User } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    updateUser,
} from '../database/userRepository';

// Ensure web browser session is completed
WebBrowser.maybeCompleteAuthSession();

// Cognito configuration
const COGNITO_CONFIG = {
    userPoolWebClientId: '7opkttdhbtba8qufk8oh43eir8',
    domain: 'ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com'
};

const useGoogleAuth = () => {
    // Generate redirect URI with explicit configuration
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: Platform.select({
            native: 'newsapp', // for both iOS and Android
            web: 'https://ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com/'
        }),
        // Removed useProxy as it is not a valid property
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
            scopes: ['openid', 'profile', 'email'],
            // Add custom parameters to handle potential redirect mismatches
            extraParams: {
                response_mode: 'query'
            }
        },
        discovery
    );

    const loginWithGoogle = async () => {
        try {
            // Extensive logging for debugging
            console.log("Redirect URI Configuration:", {
                redirectUri,
                platform: Platform.OS,
                proxyEnabled: Platform.select({
                    web: true,
                    default: false
                })
            });
            console.log("Request Object:", JSON.stringify(request, null, 2));

            // Verify authentication request is ready
            if (!request) {
                throw new Error('Authentication request is not initialized');
            }

            // Prompt for authentication
            const result = await promptAsync({
                useProxy: Platform.OS === 'web',
                ...(Platform.OS === 'web' ? {
                    windowFeatures: {
                        width: 500,
                        height: 600
                    }
                } : {})
            } as any);

            // Log authentication result
            console.log("Authentication Result:", JSON.stringify(result, null, 2));

            // Handle authentication failure
            if (result.type !== 'success') {
                throw new Error(`Authentication failed: ${result.type}`);
            }

            // Exchange authorization code for tokens
            const tokenResult = await AuthSession.exchangeCodeAsync(
                {
                    clientId: COGNITO_CONFIG.userPoolWebClientId,
                    code: result.params.code,
                    redirectUri: redirectUri,
                    extraParams: {
                        code_verifier: request.codeVerifier || '',
                    },
                },
                {
                    tokenEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/token`,
                }
            );

            // Log token result
            console.log("Token Exchange Result:", JSON.stringify(tokenResult, null, 2));

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
            console.log("User Data:", JSON.stringify(userData, null, 2));

            // Validate email
            if (!userData.email) {
                throw new Error('No email received from Cognito');
            }

            // User management logic
            let user = await getUserByEmail(userData.email, 'cognito');

            if (user) {
                // Update existing user
                user.lastLoginAt = new Date();
                await updateUser(user);
            } else {
                // Create new user
                user = await createUser({
                    id: `cognito_${userData.sub}`,
                    firstName: userData.given_name || '',
                    lastName: userData.family_name || '',
                    email: userData.email,
                    profilePicture: userData.picture || null,
                    createdAt: new Date(),
                    lastLoginAt: new Date()
                });
            }

            return { success: true, user };

        } catch (error) {
            // Comprehensive error handling
            console.error('Complete Authentication Error:', error);
            return {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : 'Unknown authentication error'
            };
        }
    };

    const signOut = async () => {
        try {
            // Implement Cognito logout logic if needed
            return { success: true };
        } catch (error) {
            console.error('Logout Error:', error);
            return {
                success: false,
                message: 'Logout failed'
            };
        }
    };

    return { loginWithGoogle, signOut };
};

export default useGoogleAuth;