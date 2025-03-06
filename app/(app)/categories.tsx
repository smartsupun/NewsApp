// app/(app)/categories.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import ArticleCard from '../../src/components/news/ArticleCard';
import newsStore from '../../src/services/stores/newsStore';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/theme/colors';
import typography from '../../src/theme/typography';

interface Category {
    id: string;
    name: string;
    icon: string;
}

const categories: Category[] = [
    { id: 'business', name: 'Business', icon: 'briefcase' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film' },
    { id: 'health', name: 'Health', icon: 'heartbeat' },
    { id: 'science', name: 'Science', icon: 'flask' },
    { id: 'sports', name: 'Sports', icon: 'futbol-o' },
    { id: 'technology', name: 'Technology', icon: 'microchip' },
];

const CategoriesScreen = observer(() => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const loadCategoryArticles = async (categoryId: string) => {
        await newsStore.fetchTopHeadlines('us', categoryId);
    };

    useEffect(() => {
        if (activeCategory) {
            loadCategoryArticles(activeCategory);
        }
    }, [activeCategory]);

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={[
                styles.categoryCard,
                settingsStore.darkMode && styles.darkCategoryCard,
                activeCategory === item.id && styles.activeCategory,
            ]}
            onPress={() => setActiveCategory(item.id)}
        >
            <FontAwesome
                name={item.icon as any}
                size={32}
                color={activeCategory === item.id ? '#fff' : colors.primary}
            />
            <Text
                style={[
                    styles.categoryText,
                    activeCategory === item.id && styles.activeCategoryText,
                    settingsStore.darkMode && styles.darkText,
                    activeCategory === item.id && styles.activeCategoryText,
                ]}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
            <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.categoryList}
                ListHeaderComponent={
                    <Text style={[styles.headerText, settingsStore.darkMode && styles.darkText]}>
                        News Categories
                    </Text>
                }
            />

            {activeCategory && (
                <View style={styles.articlesContainer}>
                    <View style={styles.categoryHeader}>
                        <Text style={[styles.categoryHeaderText, settingsStore.darkMode && styles.darkText]}>
                            {categories.find(c => c.id === activeCategory)?.name} News
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setActiveCategory(null)}
                        >
                            <FontAwesome
                                name="times"
                                size={20}
                                color={settingsStore.darkMode ? colors.darkText : colors.text}
                            />
                        </TouchableOpacity>
                    </View>

                    {newsStore.isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={newsStore.categoryArticles[activeCategory] || []}
                            keyExtractor={(item) => item.url}
                            renderItem={({ item }) => <ArticleCard article={item} />}
                            contentContainerStyle={styles.articlesList}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={[styles.emptyText, settingsStore.darkMode && styles.darkText]}>
                                        No articles found in this category.
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    darkContainer: {
        backgroundColor: colors.darkBackground,
    },
    headerText: {
        ...typography.h2,
        color: colors.text,
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    categoryList: {
        padding: 8,
    },
    categoryCard: {
        flex: 1,
        margin: 8,
        padding: 20,
        backgroundColor: colors.surface,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 120,
    },
    darkCategoryCard: {
        backgroundColor: colors.darkSurface,
    },
    activeCategory: {
        backgroundColor: colors.primary,
    },
    categoryText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        marginTop: 12,
        textAlign: 'center',
    },
    darkText: {
        color: colors.darkText,
    },
    activeCategoryText: {
        color: '#fff',
    },
    articlesContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: settingsStore.darkMode ? colors.darkSurface : colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: settingsStore.darkMode ? colors.darkDivider : colors.divider,
    },
    categoryHeaderText: {
        ...typography.h2,
        color: colors.text,
    },
    closeButton: {
        padding: 8,
    },
    articlesList: {
        padding: 16,
        backgroundColor: settingsStore.darkMode ? colors.darkBackground : colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: settingsStore.darkMode ? colors.darkBackground : colors.background,
    },
    emptyContainer: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});

export default CategoriesScreen;