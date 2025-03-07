import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    updateUser,
    setCurrentUser,
    removeActiveAccount,
    getCurrentUser,
    clearCurrentUser
} from '../database/userRepository';

// Ensure web browser session is completed
WebBrowser.maybeCompleteAuthSession();

// Cognito configuration
const COGNITO_CONFIG = {
    userPoolWebClientId: '7opkttdhbtba8qufk8oh43eir8',
    domain: 'ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com'
};

const useGoogleAuth = () => {
    // Comprehensive logout method to clear all authentication states
    const fullLogout = async () => {
        try {
            // Clear various storage mechanisms
            await AsyncStorage.multiRemove([
                'newsapp_current_user',
                'newsapp_active_accounts',
                'newsapp_auth_tokens'
            ]);

            // Clear Expo AuthSession state
            const keys = await AsyncStorage.getAllKeys();
            const authSessionKeys = keys.filter(key =>
                key.includes('expo-auth-session') ||
                key.includes('expo.modules.auth')
            );
            await AsyncStorage.multiRemove(authSessionKeys);

            // Attempt to revoke any existing tokens (if possible)
            // Note: This would typically involve a server-side call to Cognito
            console.log('Comprehensive logout completed');
        } catch (error) {
            console.error('Full logout error:', error);
        }
    };

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
            scopes: ['openid', 'profile', 'email'],
            extraParams: {
                response_mode: 'query',
                // Force new authentication every time
                prompt: 'login select_account max_age=0'
            }
        },
        discovery
    );

    const loginWithGoogle = async () => {
        try {
            // Perform a comprehensive logout before authentication
            await fullLogout();

            // Additional explicit cleanup
            await clearCurrentUser();

            console.log('Starting Google Authentication Process');
            console.log('Redirect URI:', redirectUri);
            console.log('Platform:', Platform.OS);

            // Extensive logging of authentication request
            console.log('Authentication Request Details:', {
                clientId: COGNITO_CONFIG.userPoolWebClientId,
                redirectUri,
                responseType: AuthSession.ResponseType.Code,
                scopes: ['openid', 'profile', 'email'],
                extraParams: {
                    response_mode: 'query',
                    prompt: 'login select_account max_age=0'
                }
            });

            // Prompt for authentication with forced account selection
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

            // Detailed logging of authentication result
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

            // Log token result for debugging
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

            // Log user data for debugging
            console.log('User Data:', JSON.stringify(userData, null, 2));

            // Validate email
            if (!userData.email) {
                throw new Error('No email received from Cognito');
            }

            // Find existing user
            let existingUser = await getUserByEmail(userData.email, 'google');

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
                    id: `google_${userData.sub}`,
                    firstName: userData.given_name || '',
                    lastName: userData.family_name || '',
                    email: userData.email,
                    profilePicture: userData.picture || null,
                    authProvider: 'google',
                    createdAt: new Date(),
                    lastLoginAt: new Date()
                });
            }

            // Set as current user
            await setCurrentUser(existingUser);

            return { success: true, user: existingUser };

        } catch (error) {
            // Comprehensive error logging
            console.error('Complete Google Authentication Error:', error);

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

    const signOut = async () => {
        try {
            // Perform a comprehensive logout
            await fullLogout();

            return { success: true };
        } catch (error) {
            console.error('Logout Error:', error);
            return {
                success: false,
                message: 'Logout failed'
            };
        }
    };

    return {
        loginWithGoogle,
        signOut,
        request,  // Expose request for potential advanced use cases
        response  // Expose response for potential advanced use cases
    };
};

export default useGoogleAuth;