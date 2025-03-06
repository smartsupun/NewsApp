// src/components/common/OfflineNotice.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import newsStore from '../../services/stores/newsStore';
import colors from '../../theme/colors';

const OfflineNotice = observer(() => {
    if (!newsStore.isOffline) return null;

    return (
        <View style={styles.container}>
            <FontAwesome name="wifi" size={16} color="white" />
            <Text style={styles.text}>You are offline. Showing cached content.</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ff9800',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    text: {
        color: 'white',
        marginLeft: 8,
        fontWeight: '500',
    }
});

export default OfflineNotice;