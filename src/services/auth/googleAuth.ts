import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { User } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    updateUser,
    setCurrentUser
} from '../database/userRepository';
import Constants from 'expo-constants';
import { useEffect } from 'react';

// Ensure WebBrowser can complete auth session
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId;
console.log("Web Client ID:", WEB_CLIENT_ID);

const useGoogleAuth = () => {
    const [request, response, promptAsync] = Google.useAuthRequest(
        {
            androidClientId: '101566213848-hfd7pcsii86iggbdmp9g3ifpnjrd7d7s.apps.googleusercontent.com', // Replace with your Android Client ID
            webClientId: WEB_CLIENT_ID,
            scopes: ['profile', 'email', 'openid'] // Add any scopes you need
        },
        { useProxy: true } as any // This forces auth.expo.io to be used as the redirect
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                loginWithGoogle(authentication.accessToken);
            } else {
                console.log("No access token received in response");
            }
        } else if (response?.type === 'error') {
            console.error("Google authentication error:", response.error);
        }
    }, [response]);


    const loginWithGoogle = async (accessToken: string): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            console.log("Starting Google login with accessToken...");

            if (!accessToken) {
                console.log("No access token provided");
                return {
                    success: false,
                    message: 'No access token provided from Google'
                };
            }

            // Fetch user info using the access token
            const userInfoResponse = await fetch(
                'https://www.googleapis.com/userinfo/v2/me',
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            if (!userInfoResponse.ok) {
                console.log("Failed to fetch user info, status:", userInfoResponse.status);
                console.log("Response text:", await userInfoResponse.text()); // Log the response body
                throw new Error(`Failed to fetch user info from Google: ${userInfoResponse.status}`);
            }

            const googleUserInfo = await userInfoResponse.json();
            console.log("Received user info:", googleUserInfo.email);

            // Check if user already exists in your database
            let user = await getUserByEmail(googleUserInfo.email, 'google');

            if (user) {
                // Update existing user's last login time
                console.log("Updating existing user");
                user.lastLoginAt = new Date();
                await updateUser(user);
            } else {
                // Create new user in your database
                console.log("Creating new user");
                user = await createUser({
                    id: `google_${googleUserInfo.id}`,
                    firstName: googleUserInfo.given_name,
                    lastName: googleUserInfo.family_name,
                    email: googleUserInfo.email,
                    profilePicture: googleUserInfo.picture,
                    authProvider: 'google',
                    createdAt: new Date(),
                    lastLoginAt: new Date()
                });
            }

            // Set as current user in your app
            await setCurrentUser(user);
            console.log("Authentication successful");

            return { success: true, user };

        } catch (error) {
            console.error('Google login error:', error);
            return {
                success: false,
                message: `Google login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    };

    const promptGoogleLogin = async () => {
        const result = await promptAsync();
        console.log("Auth result type:", result.type);
        if (result.type !== 'success') {
            return {
                success: false,
                message: `Google authentication failed: ${result.type}`
            };
        }
    }

    return {
        loginWithGoogle: promptGoogleLogin
    };
};

export default useGoogleAuth;
