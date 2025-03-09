import { User, UserData } from '../../models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';


const USERS_STORAGE_KEY = 'newsapp_users';
const ACTIVE_ACCOUNTS_STORAGE_KEY = 'newsapp_active_accounts';
const USER_PASSWORD_PREFIX = 'newsapp_password_';
const CURRENT_USER_KEY = 'newsapp_current_user';

export const initStorage = async (): Promise<void> => {
    try {
        const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (usersJson === null) {
            await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
        }

        const activeAccountsJson = await AsyncStorage.getItem(ACTIVE_ACCOUNTS_STORAGE_KEY);
        if (activeAccountsJson === null) {
            await AsyncStorage.setItem(ACTIVE_ACCOUNTS_STORAGE_KEY, JSON.stringify([]));
        }

        console.log('AsyncStorage initialized successfully');
    } catch (error) {
        console.error('Error initializing AsyncStorage:', error);
        throw error;
    }
};

const getUsers = async (): Promise<User[]> => {
    try {
        const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (!usersJson) return [];

        const usersData = JSON.parse(usersJson);
        return usersData.map((userData: any) => new User({
            ...userData,
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
            createdAt: new Date(userData.createdAt),
            lastLoginAt: new Date(userData.lastLoginAt)
        }));
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
};

const saveUsers = async (users: User[]): Promise<void> => {
    try {
        const usersData = users.map(user => ({
            ...user,
            dateOfBirth: user.dateOfBirth?.toISOString(),
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt.toISOString()
        }));
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersData));
    } catch (error) {
        console.error('Error saving users:', error);
        throw error;
    }
};

export const createUser = async (userData: UserData, password?: string): Promise<User> => {
    try {
        const user = new User(userData);

        if (password) {
            await SecureStore.setItemAsync(`${USER_PASSWORD_PREFIX}${user.id}`, password);
        }

        const users = await getUsers();

        const existingUser = users.find(u =>
            u.email === user.email && u.authProvider === user.authProvider
        );

        if (existingUser) {
            throw new Error('User with this email and auth provider already exists');
        }

        users.push(user);
        await saveUsers(users);

        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const getUserByEmail = async (email: string, authProvider = 'email'): Promise<User | null> => {
    try {
        const users = await getUsers();
        const user = users.find(u => u.email === email && u.authProvider === authProvider);
        return user || null;
    } catch (error) {
        console.error('Error getting user by email:', error);
        throw error;
    }
};

export const getUserById = async (id: string): Promise<User | null> => {
    try {
        const users = await getUsers();
        const user = users.find(u => u.id === id);
        return user || null;
    } catch (error) {
        console.error('Error getting user by id:', error);
        throw error;
    }
};

export const updateUser = async (user: User): Promise<User> => {
    try {
        const users = await getUsers();
        const index = users.findIndex(u => u.id === user.id);

        if (index === -1) {
            throw new Error('User not found');
        }

        users[index] = user;
        await saveUsers(users);

        const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);
            if (currentUser.id === user.id) {
                await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            }
        }

        return user;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const getActiveAccounts = async (): Promise<User[]> => {
    try {
        const activeAccountsJson = await AsyncStorage.getItem(ACTIVE_ACCOUNTS_STORAGE_KEY);
        if (!activeAccountsJson) return [];

        const activeAccountIds = JSON.parse(activeAccountsJson);
        const users = await getUsers();

        return activeAccountIds
            .map((item: any) => {
                const user = users.find(u => u.id === item.userId);
                return user ? { user, lastActive: new Date(item.lastActive) } : null;
            })
            .filter((item: any) => item !== null)
            .sort((a: any, b: any) => b.lastActive.getTime() - a.lastActive.getTime())
            .map((item: any) => item.user);
    } catch (error) {
        console.error('Error getting active accounts:', error);
        return [];
    }
};

export const addActiveAccount = async (user: User): Promise<void> => {
    try {
        const activeAccountsJson = await AsyncStorage.getItem(ACTIVE_ACCOUNTS_STORAGE_KEY);
        const activeAccounts = activeAccountsJson ? JSON.parse(activeAccountsJson) : [];

        const filteredAccounts = activeAccounts.filter(
            (account: any) => account.userId !== user.id
        );

        filteredAccounts.push({
            userId: user.id,
            lastActive: new Date().toISOString()
        });

        await AsyncStorage.setItem(ACTIVE_ACCOUNTS_STORAGE_KEY, JSON.stringify(filteredAccounts));
    } catch (error) {
        console.error('Error adding active account:', error);
        throw error;
    }
};

export const removeActiveAccount = async (userId: string): Promise<void> => {
    try {
        console.log('Remove active account - userId:', userId);
        const activeAccountsJson = await AsyncStorage.getItem(ACTIVE_ACCOUNTS_STORAGE_KEY);
        console.log('Active accounts before removal:', activeAccountsJson);

        if (!activeAccountsJson) {
            console.log('No active accounts found in storage');
            return;
        }

        const activeAccounts = JSON.parse(activeAccountsJson);
        console.log('Parsed active accounts:', activeAccounts);

        const filteredAccounts = activeAccounts.filter(
            (account: any) => account.userId !== userId
        );

        console.log('Filtered accounts:', filteredAccounts);
        await AsyncStorage.setItem(ACTIVE_ACCOUNTS_STORAGE_KEY, JSON.stringify(filteredAccounts));

        const updatedJson = await AsyncStorage.getItem(ACTIVE_ACCOUNTS_STORAGE_KEY);
        console.log('Active accounts after removal:', updatedJson);
    } catch (error) {
        console.error('Error removing active account:', error);
        throw error;
    }
};
export const setCurrentUser = async (user: User): Promise<void> => {
    try {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        await addActiveAccount(user);
    } catch (error) {
        console.error('Error setting current user:', error);
        throw error;
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (!userJson) return null;

        const userData = JSON.parse(userJson);
        return new User({
            ...userData,
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
            createdAt: new Date(userData.createdAt),
            lastLoginAt: new Date(userData.lastLoginAt)
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

export const clearCurrentUser = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
        console.error('Error clearing current user:', error);
        throw error;
    }
};

export const verifyPassword = async (userId: string, password: string): Promise<boolean> => {
    try {
        const storedPassword = await SecureStore.getItemAsync(`${USER_PASSWORD_PREFIX}${userId}`);
        return storedPassword === password;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
};

export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
        await SecureStore.setItemAsync(`${USER_PASSWORD_PREFIX}${userId}`, newPassword);
        return true;
    } catch (error) {
        console.error('Error changing password:', error);
        return false;
    }
};

export default {
    init: initStorage,
    createUser,
    getUserByEmail,
    getUserById,
    updateUser,
    getActiveAccounts,
    addActiveAccount,
    removeActiveAccount,
    setCurrentUser,
    getCurrentUser,
    clearCurrentUser,
    verifyPassword,
    changePassword
};