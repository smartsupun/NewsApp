import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import useGoogleAuth from '../../src/services/auth/googleAuth';
import useFacebookAuth from '../../src/services/auth/facebookAuth';
import { authenticateWithBiometrics } from '../../src/services/auth/biometricAuth';
import authStore from '../../src/services/stores/authStore';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/services/theme/colors';
import typography from '../../src/services/theme/typography';

const LoginScreen = observer(() => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const { loginWithGoogle } = useGoogleAuth();
    const { loginWithFacebook } = useFacebookAuth();

    useEffect(() => {
        const checkBiometric = async () => {
            const biometricStatus = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricAvailable(biometricStatus);
        };

        checkBiometric();
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        const result = await authStore.loginWithEmail(email, password);

        if (result.success) {
            router.replace('/(app)');
        } else {
            Alert.alert('Login Failed', result.message || 'Invalid credentials');
        }
    };

    const handleGoogleLogin = async () => {
        const result = await loginWithGoogle();

        if (result.success && result.user) {
            await authStore.setCurrentUser(result.user);
            router.replace('/(app)');
        } else {
            Alert.alert('Google Login Failed', result.message || 'Something went wrong');
        }
    };

    const handleFacebookLogin = async () => {
        const result = await loginWithFacebook();

        if (result.success && result.user) {
            await authStore.setCurrentUser(result.user);
            router.replace('/(app)');
        } else {
            Alert.alert('Facebook Login Failed', result.message || 'Something went wrong');
        }
    };

    const handleBiometricLogin = async () => {
        const result = await authenticateWithBiometrics();

        if (result.success && result.user) {
            await authStore.setCurrentUser(result.user);
            router.replace('/(app)');
        } else {
            Alert.alert('Biometric Login Failed', result.message || 'Authentication failed');
        }
    };

    const handleSwitchAccount = (userId: string) => {
        authStore.switchAccount(userId).then(result => {
            if (result.success) {
                router.replace('/(app)');
            } else {
                Alert.alert('Error', result.message || 'Failed to switch account');
            }
        });
    };

    const renderActiveAccounts = () => {
        if (authStore.activeAccounts.length === 0) return null;

        return (
            <View style={styles.activeAccountsContainer}>
                <Text style={[styles.activeAccountsTitle, settingsStore.darkMode && styles.darkText]}>Recent Accounts</Text>
                {authStore.activeAccounts.map((account) => (
                    <TouchableOpacity
                        key={account.id}
                        style={styles.accountItem}
                        onPress={() => handleSwitchAccount(account.id)}
                    >
                        <View style={styles.accountAvatar}>
                            <Text style={styles.avatarText}>
                                {account.firstName ? account.firstName[0] : account.email[0].toUpperCase()}
                            </Text>
                        </View>
                        <Text style={[styles.accountName, settingsStore.darkMode && styles.darkText]}>
                            {account.firstName
                                ? `${account.firstName} ${account.lastName || ''}`
                                : account.email
                            }
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.container,
                    settingsStore.darkMode && styles.darkContainer
                ]}
            >
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerText, settingsStore.darkMode && styles.darkText]}>Sign In</Text>
                    <Text style={[styles.subHeaderText, settingsStore.darkMode && styles.darkSubText]}>
                        Welcome back to NewsApp! Sign in to access your personalized news feed.
                    </Text>
                </View>

                {renderActiveAccounts()}

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={[styles.socialButton, styles.facebookButton]}
                        onPress={handleFacebookLogin}
                    >
                        <FontAwesome name="facebook" size={20} color="#fff" />
                        <Text style={styles.socialButtonText}>Facebook</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.socialButton, styles.googleButton]}
                        onPress={handleGoogleLogin}
                    >
                        <FontAwesome name="google" size={20} color="#fff" />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={[styles.divider, settingsStore.darkMode && styles.darkDivider]} />
                    <Text style={[styles.dividerText, settingsStore.darkMode && styles.darkText]}>Or</Text>
                    <View style={[styles.divider, settingsStore.darkMode && styles.darkDivider]} />
                </View>

                <View style={styles.formContainer}>
                    <View style={[styles.inputContainer, settingsStore.darkMode && styles.darkInputContainer]}>
                        <TextInput
                            style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                            placeholder="Email"
                            placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={[styles.inputContainer, settingsStore.darkMode && styles.darkInputContainer]}>
                        <TextInput
                            style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                            placeholder="Password"
                            placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <FontAwesome
                                name={showPassword ? 'eye' : 'eye-slash'}
                                size={20}
                                color={settingsStore.darkMode ? '#aaa' : '#999'}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={[styles.forgotPasswordText, settingsStore.darkMode && styles.darkLinkText]}>
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                    >
                        <Text style={styles.loginButtonText}>Log In</Text>
                    </TouchableOpacity>

                    {isBiometricAvailable && (
                        <TouchableOpacity
                            style={styles.biometricButton}
                            onPress={handleBiometricLogin}
                        >
                            <FontAwesome name="lock" size={24} color={colors.primary} />
                            <Text style={[styles.biometricText, settingsStore.darkMode && styles.darkLinkText]}>
                                Login with Fingerprint
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.signupContainer}>
                    <Text style={[styles.signupText, settingsStore.darkMode && styles.darkText]}>
                        Don't have account?
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                        <Text style={[styles.signupLink, settingsStore.darkMode && styles.darkLinkText]}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.darkModeToggle}
                    onPress={() => settingsStore.toggleDarkMode()}
                >
                    <FontAwesome
                        name={settingsStore.darkMode ? 'sun-o' : 'moon-o'}
                        size={20}
                        color={settingsStore.darkMode ? '#fff' : '#333'}
                    />
                    <Text style={[styles.darkModeText, settingsStore.darkMode && styles.darkText]}>
                        {settingsStore.darkMode ? 'Light Mode' : 'Dark Mode'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
        backgroundColor: colors.background,
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
    },
    headerContainer: {
        marginBottom: 30,
    },
    headerText: {
        ...typography.h1,
        color: colors.text,
    },
    subHeaderText: {
        ...typography.subtitle,
        color: colors.textSecondary,
    },
    activeAccountsContainer: {
        marginBottom: 20,
    },
    activeAccountsTitle: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: 10,
        color: colors.text,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 5,
    },
    accountAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    accountName: {
        ...typography.body,
        color: colors.text,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        flex: 0.48,
    },
    facebookButton: {
        backgroundColor: '#3b5998',
    },
    googleButton: {
        backgroundColor: '#db4437',
    },
    socialButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
    },
    dividerText: {
        marginHorizontal: 10,
        color: colors.textSecondary,
    },
    formContainer: {
        marginBottom: 20,
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
    input: {
        flex: 1,
        paddingVertical: 12,
        color: colors.text,
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: colors.primary,
    },
    loginButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    loginButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    biometricText: {
        marginLeft: 8,
        color: colors.primary,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    signupText: {
        color: colors.textSecondary,
    },
    signupLink: {
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    darkModeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginTop: 10,
    },
    darkModeText: {
        marginLeft: 8,
        color: colors.text,
    },
    darkText: {
        color: colors.darkText,
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
    darkInputContainer: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    darkInput: {
        color: colors.darkText,
    },
    darkDivider: {
        backgroundColor: colors.darkDivider,
    },
    darkLinkText: {
        color: colors.primaryLight,
    },
});

export default LoginScreen;