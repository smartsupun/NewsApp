import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { storeLastNotification } from '../../services/notifications/notificationService';

const NotificationListener: React.FC = () => {
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground:', notification);
            storeLastNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);

            const data = response.notification.request.content.data;

            if (data?.type === 'article') {
                if (data.articleUrl) {
                    router.push(`/article/${encodeURIComponent(data.articleUrl as string)}`);
                }
            } else if (data?.type === 'category') {
                if (data.category) {
                    router.push('/(app)/categories');
                }
            } else if (data?.type === 'daily_digest') {
                router.push('/(app)');
            } else {
                router.push('/(app)');
            }
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    return null;
};

export default NotificationListener;