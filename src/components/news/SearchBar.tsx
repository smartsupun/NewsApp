import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import newsStore from '../../services/stores/newsStore';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';
import {
    verticalScale,
    SPACING,
    RADIUS,
    FONT_SIZE,
} from '../../../src/utils/constants';

interface SearchBarProps {
    placeholder?: string;
}

const SearchBar = observer(({ placeholder = 'Search news...' }: SearchBarProps) => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        newsStore.searchArticles(query);
    };

    const handleClear = () => {
        setQuery('');
        newsStore.clearSearch();
    };

    return (
        <View style={styles.container}>
            <View style={[
                styles.searchContainer,
                settingsStore.darkMode && styles.darkSearchContainer
            ]}>
                <FontAwesome
                    name="search"
                    size={13}
                    color={settingsStore.darkMode ? colors.darkTextSecondary : colors.textSecondary}
                />

                <TextInput
                    style={[styles.input, settingsStore.darkMode && styles.darkInput]}
                    placeholder={placeholder}
                    placeholderTextColor={settingsStore.darkMode ? colors.darkTextSecondary : colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />

                {query.length > 0 && (
                    <TouchableOpacity onPress={handleClear}>
                        <FontAwesome
                            name="times-circle"
                            size={20}
                            color={settingsStore.darkMode ? colors.darkTextSecondary : colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: SPACING.md,
        width: '100%',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: colors.divider,
        height: verticalScale(48),
    },
    darkSearchContainer: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    input: {
        flex: 1,
        marginLeft: SPACING.sm,
        color: colors.text,
        fontSize: FONT_SIZE.md,
    },
    darkInput: {
        color: colors.darkText,
    }
});

export default SearchBar;