// app/(app)/profile.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Alert, ScrollView, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import authStore from '../../src/services/stores/authStore';
import settingsStore from '../../src/services/stores/settingsStore';
import { enableBiometricAuth, disableBiometricAuth } from '../../src/services/auth/biometricAuth';
import { changePassword, verifyPassword } from '../../src/services/database/userRepository';
import colors from '../../src/theme/colors';
import typography from '../../src/theme/typography';

const ProfileScreen = observer(() => {
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    if (!authStore.currentUser) {
        return null; // Should never happen due to auth protection in routes
    }

    console.log('Biometric availability:', {
        available: authStore.isBiometricAvailable,
        type: authStore.biometricType,
        userHasEnabled: authStore.currentUser?.preferences?.biometricEnabled
    });

    const handleLogout = async () => {
        const result = await authStore.logout();

        if (result.success) {
            router.replace('/(auth)/login');
        } else {
            Alert.alert('Logout Failed', result.message || 'Something went wrong');
        }
    };

    const handleToggleBiometric = async () => {
        if (!authStore.currentUser) return;

        const currentStatus = authStore.currentUser.preferences?.biometricEnabled || false;

        if (currentStatus) {
            // Disable biometric
            const result = await disableBiometricAuth(authStore.currentUser.id);

            if (!result.success) {
                Alert.alert('Error', result.message || 'Failed to disable biometric authentication');
            }
        } else {
            // Enable biometric
            const result = await enableBiometricAuth(authStore.currentUser.id);

            if (!result.success) {
                Alert.alert('Error', result.message || 'Failed to enable biometric authentication');
            }
        }

        // Refresh user data in store
        await authStore.initialize();
    };

    const handleSavePassword = async () => {
        if (!authStore.currentUser) return;

        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirmation do not match');
            return;
        }

        // Verify current password
        const isValid = await verifyPassword(authStore.currentUser.id, currentPassword);

        if (!isValid) {
            Alert.alert('Error', 'Current password is incorrect');
            return;
        }

        // Change password
        const result = await changePassword(authStore.currentUser.id, newPassword);

        if (result) {
            Alert.alert('Success', 'Password changed successfully');
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            Alert.alert('Error', 'Failed to change password');
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera permissions to take a photo');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                setProfileImage(result.assets[0].uri);

                // Here you would typically upload the image and update the user profile
                // For now, we'll just update the UI
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    return (
        <SafeAreaView style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHeader}>
                    <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Text style={styles.profilePlaceholderText}>
                                    {authStore.currentUser?.firstName
                                        ? authStore.currentUser.firstName[0].toUpperCase()
                                        : authStore.currentUser?.email[0].toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <FontAwesome name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.profileName, settingsStore.darkMode && styles.darkText]}>
                        {authStore.currentUser?.firstName && authStore.currentUser?.lastName
                            ? `${authStore.currentUser.firstName} ${authStore.currentUser.lastName}`
                            : authStore.currentUser?.email}
                    </Text>

                    <Text style={[styles.profileEmail, settingsStore.darkMode && styles.darkSubText]}>
                        {authStore.currentUser?.email}
                    </Text>
                </View>

                {/* Password Settings Section */}
                <View style={[styles.section, settingsStore.darkMode && styles.darkSection]}>
                    <Text style={[styles.sectionTitle, settingsStore.darkMode && styles.darkText]}>
                        Password Settings
                    </Text>

                    {isEditingPassword ? (
                        <View style={styles.passwordForm}>
                            <View style={[styles.inputContainer, settingsStore.darkMode && styles.darkInputContainer]}>
                                <TextInput
                                    style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                                    placeholder="Current Password"
                                    placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                                    secureTextEntry={!showCurrentPassword}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <FontAwesome
                                        name={showCurrentPassword ? 'eye' : 'eye-slash'}
                                        size={20}
                                        color={settingsStore.darkMode ? '#aaa' : '#999'}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputContainer, settingsStore.darkMode && styles.darkInputContainer]}>
                                <TextInput
                                    style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                                    placeholder="New Password"
                                    placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                                    secureTextEntry={!showNewPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <FontAwesome
                                        name={showNewPassword ? 'eye' : 'eye-slash'}
                                        size={20}
                                        color={settingsStore.darkMode ? '#aaa' : '#999'}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputContainer, settingsStore.darkMode && styles.darkInputContainer]}>
                                <TextInput
                                    style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                                    placeholder="Confirm New Password"
                                    placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                                    secureTextEntry={!showNewPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => {
                                        setIsEditingPassword(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleSavePassword}
                                >
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => setIsEditingPassword(true)}
                        >
                            <View style={styles.optionInfo}>
                                <FontAwesome name="lock" size={20} color={colors.primary} />
                                <Text style={[styles.optionText, settingsStore.darkMode && styles.darkText]}>
                                    Change Password
                                </Text>
                            </View>
                            <FontAwesome
                                name="chevron-right"
                                size={16}
                                color={settingsStore.darkMode ? colors.darkTextSecondary : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Biometric Section */}
                {authStore.isBiometricAvailable && (
                    <View style={[styles.section, settingsStore.darkMode && styles.darkSection]}>
                        <Text style={[styles.sectionTitle, settingsStore.darkMode && styles.darkText]}>
                            Security Settings
                        </Text>

                        <View style={styles.optionRow}>
                            <View style={styles.optionInfo}>
                                <FontAwesome name="lock" size={20} color={colors.primary} />
                                <Text style={[styles.optionText, settingsStore.darkMode && styles.darkText]}>
                                    {`Login with ${authStore.biometricType}`}
                                </Text>
                            </View>
                            <Switch
                                value={authStore.currentUser?.preferences?.biometricEnabled || false}
                                onValueChange={handleToggleBiometric}
                                trackColor={{ false: '#767577', true: colors.primaryLight }}
                                thumbColor={
                                    authStore.currentUser?.preferences?.biometricEnabled
                                        ? colors.primary
                                        : '#f4f3f4'
                                }
                            />
                        </View>
                    </View>
                )}

                {/* Dark Mode Section */}
                <View style={[styles.section, settingsStore.darkMode && styles.darkSection]}>
                    <Text style={[styles.sectionTitle, settingsStore.darkMode && styles.darkText]}>
                        App Settings
                    </Text>

                    <View style={styles.optionRow}>
                        <View style={styles.optionInfo}>
                            <FontAwesome
                                name={settingsStore.darkMode ? 'sun-o' : 'moon-o'}
                                size={20}
                                color={colors.primary}
                            />
                            <Text style={[styles.optionText, settingsStore.darkMode && styles.darkText]}>
                                {settingsStore.darkMode ? 'Light Mode' : 'Dark Mode'}
                            </Text>
                        </View>
                        <Switch
                            value={settingsStore.darkMode}
                            onValueChange={() => settingsStore.toggleDarkMode()}
                            trackColor={{ false: '#767577', true: colors.primaryLight }}
                            thumbColor={settingsStore.darkMode ? colors.primary : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Sign Out Section */}
                <View style={[styles.section, settingsStore.darkMode && styles.darkSection]}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <FontAwesome name="sign-out" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>

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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    profilePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePlaceholderText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    profileName: {
        ...typography.h2,
        color: colors.text,
        marginBottom: 4,
    },
    profileEmail: {
        ...typography.body,
        color: colors.textSecondary,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
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
        marginLeft: 12,
    },
    darkText: {
        color: colors.darkText,
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    passwordForm: {
        marginTop: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: colors.surface,
    },
    darkInputContainer: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        color: colors.text,
    },
    darkInput: {
        color: colors.darkText,
    },
    eyeIcon: {
        padding: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    button: {
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    darkSection: {
        backgroundColor: colors.darkSurface,
    },
    sectionTitle: {
        ...typography.h2,
        color: colors.text,
        marginBottom: 16,
    },
    darkSectionTitle: {
        color: colors.darkText,
    },
});

export default ProfileScreen;