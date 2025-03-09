import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import settingsStore from '../../services/stores/settingsStore';
import authStore from '../../services/stores/authStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import {
    getNotificationSettings,
    saveNotificationSettings,
    NotificationSettings as NotificationSettingsType,
    requestNotificationPermissions,
    sendTestNotification,
    scheduleDailyDigest
} from '../../services/notifications/notificationService';
import {
    SPACING,
    RADIUS,
    FONT_SIZE,
} from '../../utils/constants';

interface CategoryOption {
    id: string;
    name: string;
}

const categories: CategoryOption[] = [
    { id: 'general', name: 'General' },
    { id: 'business', name: 'Business' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'health', name: 'Health' },
    { id: 'science', name: 'Science' },
    { id: 'sports', name: 'Sports' },
    { id: 'technology', name: 'Technology' },
];

const NotificationSettings = observer(() => {
    const [settings, setSettings] = useState<NotificationSettingsType>({
        enabled: true,
        breakingNews: true,
        dailyDigest: true,
        categories: ['general'],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const savedSettings = await getNotificationSettings();
            setSettings(savedSettings);
        } catch (error) {
            console.error('Error loading notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSetting = async (key: keyof NotificationSettingsType, value: boolean) => {
        if (key === 'enabled' && value) {
            const permissionGranted = await requestNotificationPermissions();
            if (!permissionGranted) {
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications in your device settings to receive news updates.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }

        const updatedSettings = { ...settings, [key]: value };
        setSettings(updatedSettings);
        await saveNotificationSettings(updatedSettings);

        if (key === 'dailyDigest' && value) {
            await scheduleDailyDigest();
        }

        if (key === 'enabled' && authStore.currentUser) {
            await authStore.updateUserProfile({
                preferences: {
                    ...authStore.currentUser.preferences,
                    notifications: value
                }
            });
        }
    };

    const handleToggleCategory = async (categoryId: string) => {
        let updatedCategories: string[];

        if (settings.categories.includes(categoryId)) {
            if (settings.categories.length > 1) {
                updatedCategories = settings.categories.filter(id => id !== categoryId);
            } else {
                Alert.alert('Cannot Remove', 'You must have at least one category selected.');
                return;
            }
        } else {
            updatedCategories = [...settings.categories, categoryId];
        }

        const updatedSettings = { ...settings, categories: updatedCategories };
        setSettings(updatedSettings);
        await saveNotificationSettings(updatedSettings);
    };

    const handleSendTestNotification = async () => {
        if (!settings.enabled) {
            Alert.alert(
                'Notifications Disabled',
                'Please enable notifications first to receive test notification.'
            );
            return;
        }

        try {
            await sendTestNotification();
            Alert.alert('Test Notification Sent', 'You should receive a notification shortly.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send test notification.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={[styles.text, settingsStore.darkMode && styles.darkText]}>
                    Loading notification settings...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
            <View style={[styles.section, settingsStore.darkMode && styles.darkSection]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, settingsStore.darkMode && styles.darkText]}>
                        Notification Preferences
                    </Text>
                </View>

                <View style={styles.option}>
                    <View style={styles.optionInfo}>
                        <FontAwesome name="bell" size={20} color={colors.primary} />
                        <Text style={[styles.optionText, settingsStore.darkMode && styles.darkText]}>
                            Enable Notifications
                        </Text>
                    </View>
                    <Switch
                        value={settings.enabled}
                        onValueChange={(value) => handleToggleSetting('enabled', value)}
                        trackColor={{ false: '#767577', true: colors.primaryLight }}
                        thumbColor={settings.enabled ? colors.primary : '#f4f3f4'}
                    />
                </View>

                {settings.enabled && (
                    <>
                        <View style={styles.option}>
                            <View style={styles.optionInfo}>
                                <FontAwesome name="bolt" size={20} color={colors.primary} />
                                <Text style={[styles.optionText, settingsStore.darkMode && styles.darkText]}>
                                    Breaking News
                                </Text>
                            </View>
                            <Switch
                                value={settings.breakingNews}
                                onValueChange={(value) => handleToggleSetting('breakingNews', value)}
                                trackColor={{ false: '#767577', true: colors.primaryLight }}
                                thumbColor={settings.breakingNews ? colors.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.option}>
                            <View style={styles.optionInfo}>
                                <FontAwesome name="newspaper-o" size={20} color={colors.primary} />
                                <Text style={[styles.optionText, settingsStore.darkMode && styles.darkText]}>
                                    Daily News Digest
                                </Text>
                            </View>
                            <Switch
                                value={settings.dailyDigest}
                                onValueChange={(value) => handleToggleSetting('dailyDigest', value)}
                                trackColor={{ false: '#767577', true: colors.primaryLight }}
                                thumbColor={settings.dailyDigest ? colors.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.categoriesContainer}>
                            <Text style={[styles.categoryTitle, settingsStore.darkMode && styles.darkText]}>
                                Categories for Notifications
                            </Text>
                            <View style={styles.categoriesList}>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.categoryButton,
                                            settings.categories.includes(category.id) && styles.selectedCategory,
                                            settingsStore.darkMode && styles.darkCategoryButton,
                                            settings.categories.includes(category.id) && settingsStore.darkMode && styles.darkSelectedCategory,
                                        ]}
                                        onPress={() => handleToggleCategory(category.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                settings.categories.includes(category.id) && styles.selectedCategoryText,
                                                settingsStore.darkMode && styles.darkText,
                                            ]}
                                        >
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={handleSendTestNotification}
                        >
                            <FontAwesome name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.testButtonText}>Send Test Notification</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        backgroundColor: colors.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    darkSection: {
        backgroundColor: colors.darkSurface,
    },
    sectionHeader: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        ...typography.h2,
        color: colors.text,
        fontSize: FONT_SIZE.lg,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    optionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        ...typography.body,
        color: colors.text,
        marginLeft: SPACING.md,
        fontSize: FONT_SIZE.md,
    },
    text: {
        ...typography.body,
        color: colors.text,
    },
    darkText: {
        color: colors.darkText,
    },
    categoriesContainer: {
        marginTop: SPACING.md,
    },
    categoryTitle: {
        ...typography.body,
        color: colors.text,
        fontWeight: '600',
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZE.md,
    },
    categoriesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: SPACING.sm,
    },
    categoryButton: {
        backgroundColor: colors.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.sm,
        marginRight: SPACING.sm,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.divider,
    },
    darkCategoryButton: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    selectedCategory: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
    },
    darkSelectedCategory: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryLight,
    },
    categoryText: {
        color: colors.text,
        fontSize: FONT_SIZE.sm,
    },
    selectedCategoryText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    testButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        marginTop: SPACING.lg,
    },
    testButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: FONT_SIZE.md,
    },
});

export default NotificationSettings;