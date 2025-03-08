// app/_layout.tsx

import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { observer } from 'mobx-react-lite';
import * as SplashScreen from 'expo-splash-screen';
import { initStorage } from '../src/services/database/userRepository';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import authStore from '../src/services/stores/authStore';
import settingsStore from '../src/services/stores/settingsStore';
import NotificationListener from '../src/components/common/NotificationListener';

// Keep the splash screen visible while we initialize the app
SplashScreen.preventAutoHideAsync();

const RootLayout = observer(() => {
    const router = useRouter();
    const segments = useSegments();
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('Comprehensive App Initialization');

                // Initialize storage
                await initStorage();

                // Initialize stores with comprehensive logging
                console.log('Initializing Auth Store...');
                await authStore.initialize();

                console.log('Initializing Settings Store...');
                await settingsStore.initialize();

                // Detailed logging about current authentication state
                console.log('Current User:',
                    authStore.currentUser ? authStore.currentUser.id : 'No current user'
                );
                console.log('Active Accounts:',
                    authStore.activeAccounts.map(a => a.id)
                );

                // Rest of existing initialization logic...
            } catch (error) {
                console.error('Critical App Initialization Error:', error);
                // Ensure user is directed to login even if initialization fails
                router.replace('/(auth)/login');
            }
        };

        initializeApp();
    }, []);

    // If there's an error during initialization but we're done loading
    if (error && !isInitializing) {
        console.log('Encountered error during initialization:', error);
    }

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style={settingsStore.darkMode ? 'light' : 'dark'} />
            <NotificationListener />
            <Slot />
        </View>
    );
});

export default RootLayout;