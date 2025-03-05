import { User, UserData } from '../../models/User';
import {
    createUser,
    getUserByEmail,
    verifyPassword,
    updateUser,
    setCurrentUser,
    changePassword as changePasswordInDb
} from '../database/userRepository';

// Define proper return type for auth operations
export interface AuthResult {
    success: boolean;
    user?: User;
    message?: string;
}

// Register a new user
export const registerUser = async (userData: UserData, password: string): Promise<AuthResult> => {
    try {
        // Check if email already exists
        if (!userData.email) {
            return { success: false, message: 'Email is required' };
        }

        const existingUser = await getUserByEmail(userData.email);

        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        // Create new user with email auth provider
        const user = await createUser({
            ...userData,
            authProvider: 'email',
            createdAt: new Date(),
            lastLoginAt: new Date()
        }, password);

        // Set as current user
        await setCurrentUser(user);

        return { success: true, user };
    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
};

// Login with email and password
export const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
        // Get user by email
        const user = await getUserByEmail(email);

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Verify password
        const isPasswordValid = await verifyPassword(user.id, password);

        if (!isPasswordValid) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Update last login time
        user.lastLoginAt = new Date();
        await updateUser(user);

        // Set as current user
        await setCurrentUser(user);

        return { success: true, user };
    } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
};

// Change password
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
        // Verify current password
        const isPasswordValid = await verifyPassword(userId, currentPassword);

        if (!isPasswordValid) {
            return { success: false, message: 'Current password is incorrect' };
        }

        // Set new password
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