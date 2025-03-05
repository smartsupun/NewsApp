import { Redirect } from 'expo-router';
import authStore from '../src/services/stores/authStore';

export default function Index() {
    return authStore.currentUser
        ? <Redirect href="/(app)" />
        : <Redirect href="/(auth)/login" />;
}