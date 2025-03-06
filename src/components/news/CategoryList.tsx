// src/components/news/CategoryList.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { FontAwesome } from '@expo/vector-icons';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface CategoryListProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

const categories: Category[] = [
    { id: '', name: 'All', icon: 'globe' },
    { id: 'business', name: 'Business', icon: 'briefcase' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film' },
    { id: 'health', name: 'Health', icon: 'heartbeat' },
    { id: 'science', name: 'Science', icon: 'flask' },
    { id: 'sports', name: 'Sports', icon: 'futbol-o' },
    { id: 'technology', name: 'Technology', icon: 'microchip' },
];

const CategoryList = observer(({ selectedCategory, onSelectCategory }: CategoryListProps) => {
    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
                style={styles.scrollView}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryItem,
                            selectedCategory === category.id && styles.selectedCategory,
                            settingsStore.darkMode && styles.darkCategoryItem,
                            selectedCategory === category.id && settingsStore.darkMode && styles.darkSelectedCategory,
                        ]}
                        onPress={() => onSelectCategory(category.id)}
                    >
                        <FontAwesome
                            name={category.icon as any}
                            size={16}
                            color={
                                selectedCategory === category.id
                                    ? '#fff'
                                    : settingsStore.darkMode
                                        ? colors.darkTextSecondary
                                        : colors.textSecondary
                            }
                        />
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === category.id && styles.selectedCategoryText,
                                settingsStore.darkMode && styles.darkCategoryText,
                                selectedCategory === category.id && styles.selectedCategoryText,
                            ]}
                        >
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 8, // Add space below the category list
        height: 50, // Set a fixed height to ensure visibility
        width: '100%',
    },
    scrollView: {
        paddingVertical: 4, // Add vertical padding
    },
    container: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center', // Center items vertically
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        minWidth: 80,
        height: 36, // Fixed height for consistency
    },
    darkCategoryItem: {
        backgroundColor: colors.darkSurface,
        borderColor: colors.darkDivider,
    },
    selectedCategory: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    darkSelectedCategory: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    categoryText: {
        ...typography.caption,
        marginLeft: 8,
        color: colors.text,
    },
    darkCategoryText: {
        color: colors.darkText,
    },
    selectedCategoryText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default CategoryList;