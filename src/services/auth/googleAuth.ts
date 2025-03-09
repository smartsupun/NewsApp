import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUser,
    getUserByEmail,
    updateUser,
    setCurrentUser
} from '../database/userRepository';

WebBrowser.maybeCompleteAuthSession();


const COGNITO_CONFIG = {
    userPoolWebClientId: "7opkttdhbtba8qufk8oh43eir8",
    domain: "ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com",
};

const useGoogleAuth = () => {

    const fullLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                'newsapp_current_user',
                'newsapp_active_accounts',
                'newsapp_auth_tokens'
            ]);

            const keys = await AsyncStorage.getAllKeys();
            const authSessionKeys = keys.filter(key =>
                key.includes('expo-auth-session') ||
                key.includes('expo.modules.auth')
            );
            await AsyncStorage.multiRemove(authSessionKeys);

        } catch (error) {
            console.error('Full logout error:', error);
        }
    };

    const redirectUri = AuthSession.makeRedirectUri({
        scheme: Platform.select({
            native: 'newsapp',
            web: 'https://ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com/'
        }),
    });

    const discovery = {
        authorizationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/authorize`,
        tokenEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/token`,
        revocationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/revoke`,
        userInfoEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/userInfo`
    };


    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: COGNITO_CONFIG.userPoolWebClientId,
            redirectUri: redirectUri,
            responseType: AuthSession.ResponseType.Code,
            usePKCE: true,
            scopes: ['openid', 'profile', 'email'],
            extraParams: {
                response_mode: 'query',
                prompt: 'login select_account max_age=0'
            }
        },
        discovery
    );

    const loginWithGoogle = async (options: { prompt?: string } = {}) => {
        try {
            console.log("Starting Google authentication process");

            const authRequestOptions = {
                ...request,
                extraParams: {
                    ...request?.extraParams,
                    prompt: options.prompt || 'auto'
                }
            };

            const result = await promptAsync({
                useProxy: Platform.OS === 'web',
                ...(Platform.OS === 'web' ? {
                    windowFeatures: {
                        width: 500,
                        height: 600
                    }
                } : {}),
                authRequestOptions
            } as any);

            console.log("Authentication Result:", JSON.stringify(result, null, 2));

            if (result.type !== 'success') {
                console.log(`Authentication failed: ${result.type}`);
                return {
                    success: false,
                    message: result.type === 'dismiss'
                        ? 'Login was cancelled'
                        : 'Authentication failed'
                };
            }
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

            if (!tokenResult.accessToken) {
                throw new Error('No access token received');
            }

            const userInfoResponse = await fetch(
                `https://${COGNITO_CONFIG.domain}/oauth2/userInfo`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenResult.accessToken}`
                    }
                }
            );

            if (!userInfoResponse.ok) {
                throw new Error(`User info fetch failed: ${userInfoResponse.status}`);
            }

            const userData = await userInfoResponse.json();

            if (!userData.email) {
                throw new Error('No email received from Cognito');
            }

            let existingUser = await getUserByEmail(userData.email, 'google');

            if (existingUser) {
                existingUser.firstName = userData.given_name || existingUser.firstName;
                existingUser.lastName = userData.family_name || existingUser.lastName;
                existingUser.profilePicture = userData.picture || existingUser.profilePicture;
                existingUser.lastLoginAt = new Date();

                await updateUser(existingUser);
            } else {
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

            await setCurrentUser(existingUser);

            return { success: true, user: existingUser };

        } catch (error) {

            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    return {
                        success: false,
                        message: 'This account is already registered. Please sign in with the original method.'
                    };
                }

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
        request,
        response
    };
};

export default useGoogleAuth;