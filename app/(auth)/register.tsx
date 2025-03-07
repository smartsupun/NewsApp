import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Alert
} from 'react-native';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as yup from 'yup';
import useGoogleAuth from '../../src/services/auth/googleAuth';
import useFacebookAuth from '../../src/services/auth/facebookAuth';
import authStore from '../../src/services/stores/authStore';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/theme/colors';
import typography from '../../src/theme/typography';
import {
    scale,
    verticalScale,
    SPACING,
    RADIUS,
    FONT_SIZE,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    IS_LANDSCAPE,
    IS_LARGE_DEVICE
} from '../../src/utils/constants';

// Form validation schema
const validationSchema = yup.object().shape({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    mobileNumber: yup.string().matches(/^\d{10}$/, 'Phone number must be 10 digits').required('Mobile number is required'),
    password: yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
        .required('Password is required'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
    dateOfBirth: yup.date()
        .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old')
        .required('Date of birth is required'),
    termsAccepted: yup.boolean()
        .oneOf([true], 'You must accept the terms and conditions')
});

const RegisterScreen = observer(() => {
    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000),
        termsAccepted: false
    });

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Social auth hooks
    const { loginWithGoogle } = useGoogleAuth();
    const { loginWithFacebook } = useFacebookAuth();

    // Update form data
    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when field is edited
        if (formErrors[field]) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };

    // Validate a single field
    const validateField = async (field: string) => {
        try {
            const schema = yup.reach(validationSchema, field) as yup.Schema<any>;
            await schema.validate(formData[field as keyof typeof formData]);
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
            return true;
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                setFormErrors(prev => ({
                    ...prev,
                    [field]: error.message
                }));
            }
            return false;
        }
    };

    // Validate all fields
    const validateForm = async () => {
        try {
            await validationSchema.validate(formData, { abortEarly: false });
            setFormErrors({});
            return true;
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                const errors: { [key: string]: string } = {};
                error.inner.forEach(e => {
                    if (e.path) {
                        errors[e.path] = e.message;
                    }
                });
                setFormErrors(errors);
            }
            return false;
        }
    };

    // Handle registration
    const handleRegister = async () => {
        const isValid = await validateForm();

        if (!isValid) {
            Alert.alert('Validation Error', 'Please correct the errors in the form');
            return;
        }

        const { confirmPassword, termsAccepted, ...userData } = formData;

        const result = await authStore.registerWithEmail(userData, formData.password);

        if (result.success) {
            Alert.alert(
                'Registration Successful',
                'Your account has been created successfully!',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        } else {
            Alert.alert('Registration Failed', result.message || 'Something went wrong');
        }
    };

    // Handle Google registration
    const handleGoogleRegister = async () => {
        const result = await loginWithGoogle();

        if (result.success && result.user) {
            // Here we might want to collect additional info not provided by Google
            // For now, we'll just set the current user and navigate
            await authStore.setCurrentUser(result.user);
            router.replace('/(app)');
        } else {
            Alert.alert('Google Registration Failed', result.message || 'Something went wrong');
        }
    };

    // Handle Facebook registration
    const handleFacebookRegister = async () => {
        const result = await loginWithFacebook();

        if (result.success && result.user) {
            await authStore.setCurrentUser(result.user);
            router.replace('/(app)');
        } else {
            Alert.alert('Facebook Registration Failed', result.message || 'Something went wrong');
        }
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                    <Text style={[styles.headerText, settingsStore.darkMode && styles.darkText]}>Create Account</Text>
                    <Text style={[styles.subHeaderText, settingsStore.darkMode && styles.darkSubText]}>
                        Join NewsApp to get personalized news content tailored to your interests
                    </Text>
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={[styles.socialButton, styles.facebookButton]}
                        onPress={handleFacebookRegister}
                    >
                        <FontAwesome name="facebook" size={20} color="#fff" />
                        <Text style={styles.socialButtonText}>Facebook</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.socialButton, styles.googleButton]}
                        onPress={handleGoogleRegister}
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
                    {/* First Name */}
                    <View style={styles.nameContainer}>
                        <View style={[
                            styles.inputContainer,
                            styles.halfWidth,
                            formErrors.firstName ? styles.inputError : null,
                            settingsStore.darkMode && styles.darkInputContainer
                        ]}>
                            <TextInput
                                style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                                placeholder="First Name"
                                placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                                value={formData.firstName}
                                onChangeText={(text) => handleChange('firstName', text)}
                                onBlur={() => validateField('firstName')}
                            />
                        </View>

                        {/* Last Name */}
                        <View style={[
                            styles.inputContainer,
                            styles.halfWidth,
                            formErrors.lastName ? styles.inputError : null,
                            settingsStore.darkMode && styles.darkInputContainer
                        ]}>
                            <TextInput
                                style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                                placeholder="Last Name"
                                placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                                value={formData.lastName}
                                onChangeText={(text) => handleChange('lastName', text)}
                                onBlur={() => validateField('lastName')}
                            />
                        </View>
                    </View>

                    {/* Error messages for name fields */}
                    <View style={styles.nameContainer}>
                        {formErrors.firstName && (
                            <Text style={[styles.errorText, styles.halfWidth]}>{formErrors.firstName}</Text>
                        )}
                        {formErrors.lastName && (
                            <Text style={[styles.errorText, styles.halfWidth]}>{formErrors.lastName}</Text>
                        )}
                    </View>

                    {/* Email */}
                    <View style={[
                        styles.inputContainer,
                        ...(formErrors.email ? [styles.inputError] : []),
                        settingsStore.darkMode && styles.darkInputContainer
                    ]}>
                        <TextInput
                            style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                            placeholder="Email"
                            placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                            onBlur={() => validateField('email')}
                        />
                    </View>
                    {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

                    {/* Mobile Number */}
                    <View style={[
                        styles.inputContainer,
                        ...(formErrors.mobileNumber ? [styles.inputError] : []),
                        settingsStore.darkMode && styles.darkInputContainer
                    ]}>
                        <TextInput
                            style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                            placeholder="Mobile Number"
                            placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                            keyboardType="phone-pad"
                            value={formData.mobileNumber}
                            onChangeText={(text) => handleChange('mobileNumber', text)}
                            onBlur={() => validateField('mobileNumber')}
                        />
                    </View>
                    {formErrors.mobileNumber && <Text style={styles.errorText}>{formErrors.mobileNumber}</Text>}

                    {/* Date of Birth */}
                    <TouchableOpacity
                        style={[
                            styles.inputContainer,
                            ...(formErrors.dateOfBirth ? [styles.inputError] : []),
                            settingsStore.darkMode && styles.darkInputContainer
                        ]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text
                            style={[
                                styles.input,
                                !formData.dateOfBirth && styles.placeholderText,
                                settingsStore.darkMode && styles.darkInput
                            ]}
                        >
                            {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : "Date of Birth"}
                        </Text>
                        <FontAwesome
                            name="calendar"
                            size={20}
                            color={settingsStore.darkMode ? '#aaa' : '#999'}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                    {formErrors.dateOfBirth && <Text style={styles.errorText}>{formErrors.dateOfBirth}</Text>}

                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.dateOfBirth}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    handleChange('dateOfBirth', selectedDate);
                                    validateField('dateOfBirth');
                                }
                            }}
                        />
                    )}

                    {/* Password */}
                    <View style={[
                        styles.inputContainer,
                        formErrors.password ? styles.inputError : null,
                        settingsStore.darkMode && styles.darkInputContainer
                    ]}>
                        <TextInput
                            style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                            placeholder="Password"
                            placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                            secureTextEntry={!showPassword}
                            value={formData.password}
                            onChangeText={(text) => handleChange('password', text)}
                            onBlur={() => validateField('password')}
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
                    {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}

                    {/* Confirm Password */}
                    <View style={[
                        styles.inputContainer,
                        formErrors.confirmPassword ? styles.inputError : null,
                        settingsStore.darkMode && styles.darkInputContainer
                    ]}>
                        <TextInput
                            style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                            placeholder="Confirm Password"
                            placeholderTextColor={settingsStore.darkMode ? '#aaa' : '#999'}
                            secureTextEntry={!showConfirmPassword}
                            value={formData.confirmPassword}
                            onChangeText={(text) => handleChange('confirmPassword', text)}
                            onBlur={() => validateField('confirmPassword')}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <FontAwesome
                                name={showConfirmPassword ? 'eye' : 'eye-slash'}
                                size={20}
                                color={settingsStore.darkMode ? '#aaa' : '#999'}
                            />
                        </TouchableOpacity>
                    </View>
                    {formErrors.confirmPassword && <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>}

                    {/* Terms and Conditions */}
                    <TouchableOpacity
                        style={styles.termsContainer}
                        onPress={() => handleChange('termsAccepted', !formData.termsAccepted)}
                    >
                        <View style={[
                            styles.checkbox,
                            formData.termsAccepted && styles.checkboxChecked,
                            ...(formErrors.termsAccepted ? [styles.checkboxError] : [])
                        ]}>
                            {formData.termsAccepted && (
                                <FontAwesome name="check" size={14} color="#fff" />
                            )}
                        </View>
                        <Text style={[styles.termsText, settingsStore.darkMode && styles.darkText]}>
                            I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>
                    {formErrors.termsAccepted && <Text style={styles.errorText}>{formErrors.termsAccepted}</Text>}

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                    >
                        <Text style={styles.registerButtonText}>Create Account</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.loginContainer}>
                    <Text style={[styles.loginText, settingsStore.darkMode && styles.darkText]}>
                        Already have an account?
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text style={[styles.loginLink, settingsStore.darkMode && styles.darkLinkText]}>
                            Sign In
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
        paddingHorizontal: SPACING.lg,
        paddingTop: verticalScale(40),
        paddingBottom: SPACING.lg,
        backgroundColor: colors.background,
        minHeight: SCREEN_HEIGHT,
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
    },
    headerContainer: {
        marginBottom: SPACING.lg,
        width: '100%',
    },
    headerText: {
        ...typography.h1,
        color: colors.text,
        fontSize: FONT_SIZE.display,
        marginBottom: SPACING.xs,
    },
    subHeaderText: {
        ...typography.subtitle,
        color: colors.textSecondary,
        fontSize: FONT_SIZE.md,
        lineHeight: FONT_SIZE.md * 1.4,
        width: '90%',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
        width: '100%',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        flex: 0.48,
        height: verticalScale(48),
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
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZE.md,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        width: '100%',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
    },
    dividerText: {
        marginHorizontal: SPACING.sm,
        color: colors.textSecondary,
        fontSize: FONT_SIZE.md,
    },
    formContainer: {
        marginBottom: SPACING.lg,
        width: '100%',
    },
    nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    halfWidth: {
        width: '48%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: RADIUS.sm,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: colors.surface,
        height: verticalScale(48),
    },
    inputError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.md,
        color: colors.text,
        fontSize: FONT_SIZE.md,
        height: '100%',
    },
    placeholderText: {
        color: '#999',
    },
    darkInputContainer: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    darkInput: {
        color: colors.darkText,
    },
    eyeIcon: {
        padding: SPACING.sm,
        height: '100%',
        justifyContent: 'center',
    },
    icon: {
        padding: SPACING.sm,
        height: '100%',
        justifyContent: 'center',
    },
    errorText: {
        color: colors.error,
        fontSize: FONT_SIZE.xs,
        marginTop: -SPACING.xs,
        marginBottom: SPACING.md,
        marginLeft: SPACING.xs,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        width: '100%',
        paddingVertical: SPACING.xs,
    },
    checkbox: {
        width: scale(20),
        height: scale(20),
        borderRadius: RADIUS.xs,
        borderWidth: 1,
        borderColor: colors.divider,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkboxError: {
        borderColor: colors.error,
    },
    termsText: {
        flex: 1,
        color: colors.text,
        fontSize: FONT_SIZE.md,
    },
    termsLink: {
        color: colors.primary,
        fontWeight: '600',
    },
    registerButton: {
        backgroundColor: colors.primary,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        alignItems: 'center',
        marginBottom: SPACING.lg,
        width: '100%',
        height: verticalScale(50),
        justifyContent: 'center',
    },
    registerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: FONT_SIZE.lg,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
        width: '100%',
    },
    loginText: {
        color: colors.textSecondary,
        fontSize: FONT_SIZE.md,
    },
    loginLink: {
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: SPACING.xs,
        fontSize: FONT_SIZE.md,
    },
    darkModeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.sm,
        marginTop: SPACING.sm,
        width: '100%',
        height: verticalScale(44),
    },
    darkModeText: {
        marginLeft: SPACING.sm,
        color: colors.text,
        fontSize: FONT_SIZE.md,
    },
    darkText: {
        color: colors.darkText,
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
    darkDivider: {
        backgroundColor: colors.darkDivider,
    },
    darkLinkText: {
        color: colors.primaryLight,
    },
    scrollViewContent: {
        flexGrow: 1,
        minHeight: SCREEN_HEIGHT,
    },
    keyboardAvoidingView: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    landscapeAdjustment: {
        paddingHorizontal: IS_LANDSCAPE ? SPACING.xxl : SPACING.lg,
    },
    tabletAdjustment: {
        paddingHorizontal: IS_LARGE_DEVICE ? SPACING.xxl : SPACING.lg,
        maxWidth: IS_LARGE_DEVICE ? 600 : '100%',
        alignSelf: 'center',
    },
    validInput: {
        borderColor: colors.accent,
    },
    validationIcon: {
        padding: SPACING.sm,
        height: '100%',
        justifyContent: 'center',
    },
    passwordStrengthContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -SPACING.xs,
        marginBottom: SPACING.sm,
        width: '100%',
    },
    strengthIndicator: {
        height: verticalScale(4),
        flex: 1,
        borderRadius: RADIUS.xs,
        marginRight: SPACING.xs,
        backgroundColor: colors.divider,
    },
    strengthWeak: {
        backgroundColor: '#FF4D4F',
    },
    strengthMedium: {
        backgroundColor: '#FAAD14',
    },
    strengthStrong: {
        backgroundColor: '#52C41A',
    },
    datePickerButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xs,
        marginTop: -SPACING.xs,
        marginBottom: SPACING.sm,
    },
    datePickerText: {
        color: colors.primary,
        marginLeft: SPACING.xs,
        fontSize: FONT_SIZE.sm,
    },
});

export default RegisterScreen;