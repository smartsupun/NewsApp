import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import {
    scale,
    verticalScale,
    SPACING,
    RADIUS,
    FONT_SIZE
} from '../../../src/utils/constants';

export type SortOption = 'newest' | 'oldest';

interface SortOptionsProps {
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
}

const SortOptions = ({ currentSort, onSortChange }: SortOptionsProps) => {
    return (
        <View style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
            <Text style={[styles.label, settingsStore.darkMode && styles.darkText]}>
                Sort by:
            </Text>

            <TouchableOpacity
                style={[
                    styles.option,
                    currentSort === 'newest' && styles.selectedOption
                ]}
                onPress={() => onSortChange('newest')}
            >
                <Text
                    style={[
                        styles.optionText,
                        settingsStore.darkMode && styles.darkText,
                        currentSort === 'newest' && styles.selectedText
                    ]}
                >
                    Newest
                </Text>
                {currentSort === 'newest' && (
                    <FontAwesome name="check" size={14} color={colors.primary} />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.option,
                    currentSort === 'oldest' && styles.selectedOption
                ]}
                onPress={() => onSortChange('oldest')}
            >
                <Text
                    style={[
                        styles.optionText,
                        settingsStore.darkMode && styles.darkText,
                        currentSort === 'oldest' && styles.selectedText
                    ]}
                >
                    Oldest
                </Text>
                {currentSort === 'oldest' && (
                    <FontAwesome name="check" size={14} color={colors.primary} />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        height: verticalScale(44),
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
        borderBottomColor: colors.darkDivider,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginRight: SPACING.sm,
        fontSize: FONT_SIZE.sm,
    },
    darkText: {
        color: colors.darkTextSecondary,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        marginRight: SPACING.sm,
        borderRadius: RADIUS.round,
        backgroundColor: colors.surface,
        height: verticalScale(28),
        minWidth: scale(80),
        justifyContent: 'center',
    },
    selectedOption: {
        backgroundColor: colors.primaryLight,
    },
    optionText: {
        ...typography.caption,
        color: colors.text,
        marginRight: SPACING.xs,
        fontSize: FONT_SIZE.sm,
    },
    selectedText: {
        color: colors.primary,
        fontWeight: 'bold',
    }
});

export default SortOptions;