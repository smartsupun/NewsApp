import { User, UserData } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    verifyPassword,
    updateUser,
    setCurrentUser,
    changePassword as changePasswordInDb
} from '../database/userRepository';


export interface AuthResult {
    success: boolean;
    user?: User;
    message?: string;
}

export const registerUser = async (userData: UserData, password: string): Promise<AuthResult> => {
    try {

        if (!userData.email) {
            return { success: false, message: 'Email is required' };
        }

        const existingUser = await getUserByEmail(userData.email);

        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        const user = await createUser({
            ...userData,
            authProvider: 'email',
            createdAt: new Date(),
            lastLoginAt: new Date()
        }, password);

        await setCurrentUser(user);

        return { success: true, user };
    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
};


export const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {

        const user = await getUserByEmail(email);

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        const isPasswordValid = await verifyPassword(user.id, password);

        if (!isPasswordValid) {
            return { success: false, message: 'Invalid email or password' };
        }

        user.lastLoginAt = new Date();
        await updateUser(user);

        await setCurrentUser(user);

        return { success: true, user };
    } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
};


export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {

        const isPasswordValid = await verifyPassword(userId, currentPassword);

        if (!isPasswordValid) {
            return { success: false, message: 'Current password is incorrect' };
        }

        const success = await changePasswordInDb(userId, newPassword);

        if (!success) {
            return { success: false, message: 'Failed to change password' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Change password error:', error);
        return { success: false, message: 'Failed to change password. Please try again.' };
    }
};