// app/_layout.tsx - Update

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
import ErrorBoundary from '../src/components/common/ErrorBoundary';

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
                console.log('Initializing app...');

                // Initialize storage instead of SQLite database
                console.log('Initializing storage...');
                await initStorage();
                console.log('Storage initialized successfully');

                // Initialize stores
                console.log('Initializing auth store...');
                await authStore.initialize();
                console.log('Initializing settings store...');
                await settingsStore.initialize();
                console.log('Stores initialized successfully');

                // After auth state is loaded, decide where to go
                const inAuthGroup = segments[0] === '(auth)';

                if (!authStore.currentUser && !inAuthGroup) {
                    // Not logged in, go to login
                    router.replace('/(auth)/login');
                } else if (authStore.currentUser && inAuthGroup) {
                    // Logged in but on auth screen, go to app
                    router.replace('/(app)');
                }

                // Hide splash screen and mark initialization as complete
                await SplashScreen.hideAsync();
                setIsInitializing(false);
            } catch (error: any) {
                console.error('Error initializing app:', error);
                // Set error message and hide splash screen
                setError(error.message || 'Failed to initialize app');
                await SplashScreen.hideAsync();
                setIsInitializing(false);

                // Navigate to login on error
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
        <ErrorBoundary>
            <View style={{ flex: 1 }}>
                <StatusBar style={settingsStore.darkMode ? 'light' : 'dark'} />
                <NotificationListener />
                <Slot />
            </View>
        </ErrorBoundary>
    );
});

export default RootLayout;