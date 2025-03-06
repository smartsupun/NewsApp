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

// Ensure WebBrowser can complete auth session
WebBrowser.maybeCompleteAuthSession();

// Your Google client ID from Google Cloud Console
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId;

const useGoogleAuth = () => {
    // CRITICAL CHANGE: Use the Google provider with useProxy: true
    const [request, response, promptAsync] = Google.useAuthRequest(
        {
            clientId: WEB_CLIENT_ID,
            scopes: ['profile', 'email'],
        },
        { useProxy: true } as any // This forces auth.expo.io to be used as the redirect
    );

    const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            console.log("Starting Google login...");

            // Prompt with no additional options - let the provider handle it
            const result = await promptAsync();
            console.log("Auth result type:", result.type);

            if (result.type === 'success') {
                // Get the authentication object which contains the accessToken
                const { authentication } = result;

                if (!authentication) {
                    console.log("No authentication token received");
                    return {
                        success: false,
                        message: 'Failed to get authentication token from Google'
                    };
                }

                console.log("Token received successfully");

                // Fetch user info using the access token
                const userInfoResponse = await fetch(
                    'https://www.googleapis.com/userinfo/v2/me',
                    {
                        headers: { Authorization: `Bearer ${authentication.accessToken}` }
                    }
                );

                if (!userInfoResponse.ok) {
                    console.log("Failed to fetch user info, status:", userInfoResponse.status);
                    throw new Error('Failed to fetch user info from Google');
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
            } else if (result.type === 'cancel') {
                console.log("Authentication cancelled by user");
                return {
                    success: false,
                    message: 'Authentication cancelled by user'
                };
            } else {
                console.log("Authentication failed with result type:", result.type);
                return {
                    success: false,
                    message: `Google authentication failed: ${result.type}`
                };
            }
        } catch (error) {
            console.error('Google login error:', error);
            return {
                success: false,
                message: `Google login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    };

    return {
        loginWithGoogle
    };
};

export default useGoogleAuth;