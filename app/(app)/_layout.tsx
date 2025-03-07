import { Tabs } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/theme/colors';

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
                headerTitleAlign: 'center',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="categories"
                options={{
                    title: 'Categories',
                    tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bookmarks"
                options={{
                    title: 'Bookmarks',
                    tabBarIcon: ({ color }) => <FontAwesome name="bookmark" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Notifications',
                    tabBarButton: () => null,
                }}
            />

            <Tabs.Screen
                name="article"
                options={{
                    title: 'Article',
                    tabBarButton: () => null,
                }}
            />
        </Tabs>
    );
});

export default AppLayout;