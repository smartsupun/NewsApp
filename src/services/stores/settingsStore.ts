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
            // Load dark mode setting
            const darkModeValue = await AsyncStorage.getItem('newsapp_dark_mode');

            // Load wifi-only downloads setting
            const wifiOnlyValue = await AsyncStorage.getItem('newsapp_wifi_only');

            runInAction(() => {
                this.darkMode = darkModeValue === 'true';
                if (wifiOnlyValue !== null) {
                    this.wifiOnlyDownloads = JSON.parse(wifiOnlyValue);
                }
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

    async toggleWifiOnlyDownloads() {
        this.wifiOnlyDownloads = !this.wifiOnlyDownloads;

        try {
            await AsyncStorage.setItem('newsapp_wifi_only', JSON.stringify(this.wifiOnlyDownloads));
        } catch (error) {
            console.error('Error saving wifi only setting:', error);
        }
    }
}

export default new SettingsStore();