import { makeAutoObservable, runInAction } from 'mobx';
import {
    getCurrentUser,
    setCurrentUser as setCurrentUserInDb,
    clearCurrentUser,
    getActiveAccounts,
    removeActiveAccount,
    updateUser
} from '../database/userRepository';
import { User } from '../../models/User';
import { checkBiometricAvailability } from '../auth/biometricAuth';
import * as emailAuth from '../auth/emailAuth';
import { initializeNotifications } from '../notifications/notificationService';

interface AuthResult {
    success: boolean;
    user?: User;
    message?: string;
}

class AuthStore {
    currentUser: User | null = null;
    activeAccounts: User[] = [];
    isLoading: boolean = false;
    error: string | null = null;
    isBiometricAvailable: boolean = false;
    biometricType: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    async initialize() {
        this.isLoading = true;
        try {

            const user = await getCurrentUser();
            console.log('Initialize - Current User:', user ? user.id : 'none');


            const accounts = await getActiveAccounts();
            console.log('Initialize - Active Accounts:', accounts.length, accounts.map(a => a.id));


            const biometricStatus = await checkBiometricAvailability();

            runInAction(() => {
                this.currentUser = user;
                this.activeAccounts = accounts;
                this.isBiometricAvailable = biometricStatus.available;


                if (biometricStatus.biometricTypes.includes(1)) {
                    this.biometricType = 'Fingerprint';
                } else {
                    this.biometricType = 'Biometric';
                }

                this.isLoading = false;
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async registerWithEmail(userData: any, password: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const result = await emailAuth.registerUser(userData, password);

            if (result.success && result.user) {
                runInAction(() => {
                    this.currentUser = result.user || null;
                    if (result.user) {
                        this.activeAccounts = [...this.activeAccounts, result.user];
                    }
                    this.isLoading = false;
                });

                return { success: true };
            } else {
                runInAction(() => {
                    this.error = result.message || 'Registration failed';
                    this.isLoading = false;
                });

                return { success: false, message: result.message };
            }
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || 'Registration failed';
                this.isLoading = false;
            });

            return { success: false, message: error.message };
        }
    }

    async loginWithEmail(email: string, password: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const result: AuthResult = await emailAuth.loginWithEmail(email, password);

            if (result.success && result.user) {
                const user = result.user;

                runInAction(() => {
                    this.currentUser = user;

                    if (!this.activeAccounts.some(account => account.id === user.id)) {
                        this.activeAccounts = [...this.activeAccounts, user];
                    } else {
                        this.activeAccounts = this.activeAccounts.map(account =>
                            account.id === user.id ? user : account
                        );
                    }

                    this.isLoading = false;
                });

                return { success: true };
            } else {
                runInAction(() => {
                    this.error = result.message || 'Login failed';
                    this.isLoading = false;
                });

                return { success: false, message: result.message };
            }
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || 'Login failed';
                this.isLoading = false;
            });

            return { success: false, message: error.message };
        }
    }

    async setCurrentUser(user: User) {
        try {
            await setCurrentUserInDb(user);

            await initializeNotifications(user);

            runInAction(() => {
                this.currentUser = user;

                if (!this.activeAccounts.some(account => account.id === user.id)) {
                    this.activeAccounts = [...this.activeAccounts, user];
                } else {
                    this.activeAccounts = this.activeAccounts.map(account =>
                        account.id === user.id ? user : account
                    );
                }
            });

            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }


    async updateUserProfile(userData: Partial<User>) {
        this.isLoading = true;

        try {
            if (!this.currentUser) {
                throw new Error('No user is currently logged in');
            }

            const updatedUser = new User({
                ...this.currentUser,
                ...userData
            });

            await updateUser(updatedUser);

            await setCurrentUserInDb(updatedUser);

            runInAction(() => {
                this.currentUser = updatedUser;

                this.activeAccounts = this.activeAccounts.map(account =>
                    account.id === updatedUser.id ? updatedUser : account
                );

                this.isLoading = false;
            });

            return { success: true };
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || 'Failed to update profile';
                this.isLoading = false;
            });

            return { success: false, message: error.message };
        }
    }

    async updateProfilePicture(imageUri: string) {
        this.isLoading = true;

        try {
            if (!this.currentUser) {
                throw new Error('No user is currently logged in');
            }

            const updatedUser = new User({
                ...this.currentUser,
                profilePicture: imageUri
            });

            await updateUser(updatedUser);

            await setCurrentUserInDb(updatedUser);

            runInAction(() => {
                this.currentUser = updatedUser;

                this.activeAccounts = this.activeAccounts.map(account =>
                    account.id === updatedUser.id ? updatedUser : account
                );

                this.isLoading = false;
            });

            return { success: true };
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || 'Failed to update profile picture';
                this.isLoading = false;
            });

            return { success: false, message: error.message };
        }
    }

    async switchAccount(userId: string) {
        this.isLoading = true;

        try {
            const account = this.activeAccounts.find(acc => acc.id === userId);

            if (!account) {
                runInAction(() => {
                    this.isLoading = false;
                });
                return { success: false, message: 'Account not found' };
            }

            await setCurrentUserInDb(account);

            runInAction(() => {
                this.currentUser = account;
                this.isLoading = false;
            });

            return { success: true };
        } catch (error: any) {
            runInAction(() => {
                this.isLoading = false;
            });

            return { success: false, message: error.message };
        }
    }

    async logout() {
        this.isLoading = true;

        try {
            if (this.currentUser) {
                console.log('Logout - Removing account:', this.currentUser.id);
                await removeActiveAccount(this.currentUser.id);
                await clearCurrentUser();
            }

            runInAction(() => {
                this.currentUser = null;
                this.activeAccounts = [];
                this.isLoading = false;
            });

            return { success: true };
        } catch (error: any) {
            console.error('Logout error:', error);
            runInAction(() => {
                this.currentUser = null;
                this.activeAccounts = [];
                this.isLoading = false;
            });

            return { success: false, message: error.message };
        }
    }

}

export default new AuthStore();