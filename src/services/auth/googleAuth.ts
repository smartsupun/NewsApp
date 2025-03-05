import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { User } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    updateUser,
    setCurrentUser
} from '../database/userRepository';

// Register for redirect URI handling
WebBrowser.maybeCompleteAuthSession();

// Get your Google client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual client ID
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: 'newsapp'
});

const useGoogleAuth = () => {
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: GOOGLE_CLIENT_ID,
            redirectUri: GOOGLE_REDIRECT_URI,
            scopes: ['profile', 'email'],
            responseType: 'token',
        },
        { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
    );

    const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            const result = await promptAsync();

            if (result.type === 'success') {
                const { access_token } = result.params;

                // Fetch user info from Google
                const userInfoResponse = await fetch(
                    'https://www.googleapis.com/userinfo/v2/me',
                    {
                        headers: { Authorization: `Bearer ${access_token}` }
                    }
                );

                const googleUserInfo = await userInfoResponse.json();

                // Check if user already exists
                let user = await getUserByEmail(googleUserInfo.email, 'google');

                if (user) {
                    // Update existing user
                    user.lastLoginAt = new Date();
                    await updateUser(user);
                } else {
                    // Create new user
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

                // Set as current user
                await setCurrentUser(user);

                return { success: true, user };
            } else {
                return { success: false, message: 'Google authentication was cancelled or failed' };
            }
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, message: 'Google login failed. Please try again.' };
        }
    };

    return {
        request,
        response,
        loginWithGoogle
    };
};

export default useGoogleAuth;