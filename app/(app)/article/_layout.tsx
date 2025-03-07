import { Stack } from 'expo-router';
import colors from '../../../src/theme/colors';

export default function ArticleLayout() {
    return (
        <Stack
            screenOptions={{

                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: 'white',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerTitleAlign: 'center',
                headerBackTitleVisible: false,
            }}
        />
    );
}