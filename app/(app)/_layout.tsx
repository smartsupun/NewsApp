import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import settingsStore from '../../src/services/stores/settingsStore';
import { colors } from '../../src/services/theme/colors';

const AppLayout = observer(() => {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: settingsStore.darkMode ? colors.primaryLight : colors.primary,
                tabBarStyle: {
                    backgroundColor: settingsStore.darkMode ? colors.darkSurface : colors.surface,
                },
                headerStyle: {
                    backgroundColor: settingsStore.darkMode ? colors.darkPrimary : colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
});

export default AppLayout;