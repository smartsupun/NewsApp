import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../models/User';

const NOTIFICATION_TOKEN_KEY = 'newsapp_notification_token';
const NOTIFICATION_SETTINGS_KEY = 'newsapp_notification_settings';
const LAST_NOTIFICATION_KEY = 'newsapp_last_notification';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export interface NotificationSettings {
    enabled: boolean;
    breakingNews: boolean;
    dailyDigest: boolean;
    categories: string[];
}

export const getDefaultSettings = (): NotificationSettings => ({
    enabled: true,
    breakingNews: true,
    dailyDigest: true,
    categories: ['general'],
});

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

export const registerForPushNotifications = async (user: User): Promise<string | null> => {
    try {
        const permissionGranted = await requestNotificationPermissions();
        if (!permissionGranted) return null;
        console.log('Constants.expoConfig:', Constants.expoConfig);

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
            development: true
        });

        console.log('Token:', token);

        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);

        console.log(`Push token for user ${user.id}: ${token.data}`);

        return token.data;
    } catch (error) {
        return null;
    }
};

export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    try {
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
};


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


export const sendImmediateNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<string | null> => {
    return scheduleLocalNotification(title, body, data, 1);
};


export const storeLastNotification = async (notification: Notifications.Notification): Promise<void> => {
    try {
        await AsyncStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(notification));
    } catch (error) {
        console.error('Error storing last notification:', error);
    }
};

export const scheduleDailyDigest = async (hour = 9, minute = 0): Promise<string | null> => {
    try {
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

export const initializeNotifications = async (user: User): Promise<void> => {
    try {
        await registerForPushNotifications(user);

        const settings = user.preferences?.notifications
            ? await getNotificationSettings()
            : { ...getDefaultSettings(), enabled: false };

        await saveNotificationSettings({
            ...settings,
            enabled: !!user.preferences?.notifications,
        });

        if (settings.enabled && settings.dailyDigest) {
            await scheduleDailyDigest();
        }
    } catch (error) {
        console.error('Error initializing notifications:', error);
    }
};

export const sendTestNotification = async (): Promise<void> => {
    await sendImmediateNotification(
        'Test Notification',
        'This is a test notification from NewsApp!',
        { type: 'test' }
    );
};