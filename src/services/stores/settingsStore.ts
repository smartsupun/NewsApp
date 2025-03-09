import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SettingsStore {
    darkMode: boolean = false;
    isLoading: boolean = false;
    wifiOnlyDownloads: boolean = false;

    constructor() {
        makeAutoObservable(this);
        this.initialize();
    }

    async initialize() {
        this.isLoading = true;
        try {
            const darkModeValue = await AsyncStorage.getItem('newsapp_dark_mode');


            runInAction(() => {
                this.darkMode = darkModeValue === 'true';

                this.isLoading = false;
            });
        } catch (error) {
            console.error('Settings initialization error:', error);
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async toggleDarkMode() {
        const newValue = !this.darkMode;
        try {
            await AsyncStorage.setItem('newsapp_dark_mode', newValue.toString());
            runInAction(() => {
                this.darkMode = newValue;
            });
        } catch (error) {
            console.error('Failed to toggle dark mode:', error);
        }
    }

}

export default new SettingsStore();