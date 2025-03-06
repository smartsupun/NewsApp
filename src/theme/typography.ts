import { StyleSheet } from 'react-native';

export const typography = StyleSheet.create({
    h1: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    h2: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
    },
    button: {
        fontSize: 16,
        fontWeight: '600',
    },
    caption: {
        fontSize: 12,
        color: '#666',
    },
});

export default typography;