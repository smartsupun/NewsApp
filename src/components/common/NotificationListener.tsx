// src/components/common/NotificationListener.tsx

import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { storeLastNotification } from '../../services/notifications/notificationService';

// This component doesn't render anything visible
// It just sets up notification handlers
const NotificationListener: React.FC = () => {
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        // When a notification is received while the app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground:', notification);
            storeLastNotification(notification);
        });

        // When a user taps on a notification (works for both foreground and background)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);

            const data = response.notification.request.content.data;

            // Handle navigation based on notification type
            if (data?.type === 'article') {
                // Navigate to specific article
                if (data.articleUrl) {
                    router.push(`/article/${encodeURIComponent(data.articleUrl as string)}`);
                }
            } else if (data?.type === 'category') {
                // Navigate to specific category
                if (data.category) {
                    router.push('/(app)/categories');
                    // You might need a way to select the category once on that screen
                }
            } else if (data?.type === 'daily_digest') {
                // Navigate to home screen
                router.push('/(app)');
            } else {
                // Default navigation to home screen
                router.push('/(app)');
            }
        });

        return () => {
            // Clean up listeners on unmount
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    // This component doesn't render anything
    return null;
};

export default NotificationListener;