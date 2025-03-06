// src/components/news/SortOptions.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';

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
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.background,
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginRight: 10,
    },
    darkText: {
        color: colors.darkTextSecondary,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 16,
        backgroundColor: colors.surface,
    },
    selectedOption: {
        backgroundColor: colors.primaryLight,
    },
    optionText: {
        ...typography.caption,
        color: colors.text,
        marginRight: 5,
    },
    selectedText: {
        color: colors.primary,
        fontWeight: 'bold',
    }
});

export default SortOptions;