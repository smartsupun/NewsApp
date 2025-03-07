// src/services/notifications/notificationService.ts

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../models/User';

// Storage keys
const NOTIFICATION_TOKEN_KEY = 'newsapp_notification_token';
const NOTIFICATION_SETTINGS_KEY = 'newsapp_notification_settings';
const LAST_NOTIFICATION_KEY = 'newsapp_last_notification';

// Configure how the notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Default notification settings
export interface NotificationSettings {
    enabled: boolean;
    breakingNews: boolean;
    dailyDigest: boolean;
    categories: string[];
}

// Get default notification settings
export const getDefaultSettings = (): NotificationSettings => ({
    enabled: true,
    breakingNews: true,
    dailyDigest: true,
    categories: ['general'],
});

// Request permission for notifications
export const requestNotificationPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
        console.log('Cannot request notification permissions on emulator');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions');
        return false;
    }

    return true;
};

// Register for push notifications
export const registerForPushNotifications = async (user: User): Promise<string | null> => {
    try {
        // First, check permissions
        const permissionGranted = await requestNotificationPermissions();
        if (!permissionGranted) return null;

        // Get push token
        const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        // Store token locally
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);

        // Here you would typically send the token to your server
        // along with the user ID to register this device for notifications
        // This is where you'd integrate with your backend API
        console.log(`Push token for user ${user.id}: ${token.data}`);

        // For this example, we'll just store the token locally

        return token.data;
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
};

// Get stored push token
export const getPushToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
};

// Save notification settings
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    try {
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
};

// Get notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
    try {
        const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (!settings) return getDefaultSettings();
        return JSON.parse(settings);
    } catch (error) {
        console.error('Error getting notification settings:', error);
        return getDefaultSettings();
    }
};

// Schedule a local notification (useful for testing or local reminders)
export const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>,
    seconds = 1
): Promise<string | null> => {
    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: true,
            },
            trigger: {
                seconds,
            },
        });
        return id;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

// Send a local notification immediately
export const sendImmediateNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<string | null> => {
    return scheduleLocalNotification(title, body, data, 1);
};

// Cancel a scheduled notification
export const cancelScheduledNotification = async (id: string): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('Error canceling all notifications:', error);
    }
};

// Store the last received notification
export const storeLastNotification = async (notification: Notifications.Notification): Promise<void> => {
    try {
        await AsyncStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(notification));
    } catch (error) {
        console.error('Error storing last notification:', error);
    }
};

// Get the last received notification
export const getLastNotification = async (): Promise<Notifications.Notification | null> => {
    try {
        const notification = await AsyncStorage.getItem(LAST_NOTIFICATION_KEY);
        if (!notification) return null;
        return JSON.parse(notification);
    } catch (error) {
        console.error('Error getting last notification:', error);
        return null;
    }
};

// Schedule a daily digest notification
export const scheduleDailyDigest = async (hour = 9, minute = 0): Promise<string | null> => {
    try {
        // Check if notifications are enabled first
        const settings = await getNotificationSettings();
        if (!settings.enabled || !settings.dailyDigest) return null;

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Your Daily News Digest',
                body: 'Check out today\'s top stories in your favorite categories',
                data: { type: 'daily_digest' },
            },
            trigger: {
                hour,
                minute,
                repeats: true,
            },
        });
        return id;
    } catch (error) {
        console.error('Error scheduling daily digest:', error);
        return null;
    }
};

// Initialize notifications for a user
export const initializeNotifications = async (user: User): Promise<void> => {
    try {
        // Register for push notifications
        await registerForPushNotifications(user);

        // Get user notification settings
        const settings = user.preferences?.notifications
            ? await getNotificationSettings()
            : { ...getDefaultSettings(), enabled: false };

        // Save notification settings based on user preference
        await saveNotificationSettings({
            ...settings,
            enabled: !!user.preferences?.notifications,
        });

        // Schedule daily digest if enabled
        if (settings.enabled && settings.dailyDigest) {
            await scheduleDailyDigest();
        }
    } catch (error) {
        console.error('Error initializing notifications:', error);
    }
};

// Send a test notification (for development)
export const sendTestNotification = async (): Promise<void> => {
    await sendImmediateNotification(
        'Test Notification',
        'This is a test notification from NewsApp!',
        { type: 'test' }
    );
};