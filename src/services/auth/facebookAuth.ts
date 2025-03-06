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


const useFacebookAuth = () => {
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: process.env.FACEBOOK_APP_ID!,
            responseType: 'token',
            redirectUri: AuthSession.makeRedirectUri({
                scheme: 'newsapp'
            }),
        },
        { authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth' }
    );

    const loginWithFacebook = async (): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            const result = await promptAsync();

            if (result.type === 'success') {
                const { access_token } = result.params;

                // Fetch user info from Facebook
                const userInfoResponse = await fetch(
                    `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${access_token}`
                );

                const fbUserInfo = await userInfoResponse.json();

                // Check if user already exists
                let user = await getUserByEmail(fbUserInfo.email, 'facebook');

                if (user) {
                    // Update existing user
                    user.lastLoginAt = new Date();
                    await updateUser(user);
                } else {
                    // Create new user
                    user = await createUser({
                        id: `facebook_${fbUserInfo.id}`,
                        firstName: fbUserInfo.first_name,
                        lastName: fbUserInfo.last_name,
                        email: fbUserInfo.email,
                        profilePicture: fbUserInfo.picture?.data?.url,
                        authProvider: 'facebook',
                        createdAt: new Date(),
                        lastLoginAt: new Date()
                    });
                }

                // Set as current user
                await setCurrentUser(user);

                return { success: true, user };
            } else {
                return { success: false, message: 'Facebook authentication was cancelled or failed' };
            }
        } catch (error) {
            console.error('Facebook login error:', error);
            return { success: false, message: 'Facebook login failed. Please try again.' };
        }
    };

    return {
        request,
        response,
        loginWithFacebook
    };
};

export default useFacebookAuth;