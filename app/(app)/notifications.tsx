import React from 'react';
import { StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import NotificationSettings from '../../src/components/settings/NotificationSettings';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/theme/colors';

const NotificationsScreen = observer(() => {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Notification Settings',
                    headerStyle: {
                        backgroundColor: settingsStore.darkMode ? colors.darkPrimary : colors.primary,
                    },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
                <NotificationSettings />
            </SafeAreaView>
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
    },
});

export default NotificationsScreen;