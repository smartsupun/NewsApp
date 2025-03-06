import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import newsStore from '../../services/stores/newsStore';
import {
    verticalScale,
    SPACING,
    FONT_SIZE
} from '../../../src/utils/constants';

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
        padding: SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: verticalScale(40),
    },
    text: {
        color: 'white',
        marginLeft: SPACING.sm,
        fontWeight: '500',
        fontSize: FONT_SIZE.sm,
    }

});

export default OfflineNotice;