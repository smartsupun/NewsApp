import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../models/User';
import {
    getUserById,
    updateUser,
    setCurrentUser
} from '../database/userRepository';

// Check if biometric authentication is available
export const checkBiometricAvailability = async (): Promise<{
    available: boolean;
    biometricTypes: LocalAuthentication.AuthenticationType[];
    message?: string;
}> => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
            return { available: false, biometricTypes: [], message: 'This device does not have biometric hardware' };
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
            return { available: false, biometricTypes: [], message: 'No biometrics enrolled on this device' };
        }

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        return {
            available: true,
            biometricTypes: types
        };
    } catch (error) {
        console.error('Biometric availability check error:', error);
        return { available: false, biometricTypes: [], message: 'Failed to check biometric availability' };
    }
};

// Enable biometric authentication for a user
export const enableBiometricAuth = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const biometricStatus = await checkBiometricAvailability();

        if (!biometricStatus.available) {
            return { success: false, message: biometricStatus.message };
        }

        // Store the user ID for biometric authentication
        await AsyncStorage.setItem('newsapp_biometric_user_id', userId);

        // Get user to update preferences
        const user = await getUserById(userId);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Update user preferences
        user.preferences.biometricEnabled = true;
        await updateUser(user);

        return { success: true };
    } catch (error) {
        console.error('Enable biometric error:', error);
        return { success: false, message: 'Failed to enable biometric authentication' };
    }
};

// Disable biometric authentication
export const disableBiometricAuth = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        await AsyncStorage.removeItem('newsapp_biometric_user_id');

        // Get user to update preferences
        const user = await getUserById(userId);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Update user preferences
        user.preferences.biometricEnabled = false;
        await updateUser(user);

        return { success: true };
    } catch (error) {
        console.error('Disable biometric error:', error);
        return { success: false, message: 'Failed to disable biometric authentication' };
    }
};

// Authenticate with biometrics
export const authenticateWithBiometrics = async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
        // Check if biometric auth is enabled
        const biometricUserId = await AsyncStorage.getItem('newsapp_biometric_user_id');

        if (!biometricUserId) {
            return { success: false, message: 'Biometric authentication is not enabled' };
        }

        // Authenticate
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Login with Fingerprint',
            disableDeviceFallback: false,
            cancelLabel: 'Cancel'
        });

        if (result.success) {
            // Get user data
            const user = await getUserById(biometricUserId);

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Update last login time
            user.lastLoginAt = new Date();
            await updateUser(user);

            // Set as current user
            await setCurrentUser(user);

            return { success: true, user };
        } else {
            let message = 'Authentication failed';

            if (result.error === 'user_cancel') {
                message = 'Authentication cancelled';
            } else if (result.error === 'lockout') {
                message = 'Too many attempts. Try again later.';
            } else if (result.error === 'lockout_permanent') {
                message = 'Device is permanently locked out from biometric authentication';
            }

            return { success: false, message };
        }
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return { success: false, message: 'Failed to authenticate with biometrics' };
    }
};