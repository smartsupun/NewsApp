import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import { SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error to an error reporting service
        console.error('Error caught by boundary:', error, errorInfo);

        // Optional: Report to Sentry
        // Sentry.captureException(error);

        this.setState({ errorInfo });
    }

    resetError = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // If a custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <View style={styles.container}>
                    <FontAwesome name="exclamation-triangle" size={48} color={colors.error} />
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={this.resetError}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: colors.background,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.sm,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: FONT_SIZE.md,
    },
});

export default ErrorBoundary;