// src/components/news/SearchBar.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import newsStore from '../../services/stores/newsStore';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';

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
                    size={20}
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
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.divider,
    },
    darkSearchContainer: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        color: colors.text,
        fontSize: 16,
    },
    darkInput: {
        color: colors.darkText,
    },
});

export default SearchBar;