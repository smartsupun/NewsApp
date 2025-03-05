import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/services/theme/colors';

const AuthLayout = observer(() => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: settingsStore.darkMode ? colors.darkPrimary : colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: {
                    backgroundColor: settingsStore.darkMode ? colors.darkBackground : colors.background,
                },
            }}
        >
            <Stack.Screen
                name="login"
                options={{ title: 'Login', headerShown: false }}
            />
            <Stack.Screen
                name="register"
                options={{ title: 'Register', headerShown: false }}
            />
        </Stack>
    );
});

export default AuthLayout;