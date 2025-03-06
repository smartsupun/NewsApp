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
import {
    scale,
    verticalScale,
    SPACING,
    RADIUS,
    FONT_SIZE
} from '../../src/utils/constants';
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
        marginVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.xl,
    },
    categoryList: {
        padding: SPACING.sm,
    },
    categoryCard: {
        flex: 1,
        margin: SPACING.sm,
        padding: SPACING.lg,
        backgroundColor: colors.surface,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: verticalScale(120),
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
        marginTop: SPACING.md,
        textAlign: 'center',
        fontSize: FONT_SIZE.md,
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
        backgroundColor: colors.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        height: verticalScale(64),
    },

    categoryHeaderText: {
        ...typography.h2,
        color: colors.text,
        fontSize: FONT_SIZE.xl,
    },
    closeButton: {
        padding: SPACING.sm,
        width: scale(40),
        height: scale(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    articlesList: {
        padding: SPACING.md,
        backgroundColor: colors.background,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },

    emptyContainer: {
        padding: SPACING.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: FONT_SIZE.md,
    }

});

export default CategoriesScreen;