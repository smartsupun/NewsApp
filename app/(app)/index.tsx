import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArticleCard from '../../src/components/news/ArticleCard';
import SearchBar from '../../src/components/news/SearchBar';
import CategoryList from '../../src/components/news/CategoryList';
import SortOptions from '../../src/components/news/SortOptions';
import newsStore, { SortOption } from '../../src/services/stores/newsStore';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/theme/colors';
import typography from '../../src/theme/typography';
import OfflineNotice from '../../src/components/common/OfflineNotice';
import {
    verticalScale,
    SPACING,
    FONT_SIZE,
    IS_LARGE_DEVICE
} from '../../src/utils/constants';
const HomeScreen = observer(() => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadArticles = async () => {
        await newsStore.fetchTopHeadlines('us', selectedCategory, 1, true);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadArticles();
        setRefreshing(false);
    };

    const handleLoadMore = () => {
        newsStore.loadMoreArticles('us', selectedCategory);
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const handleSortChange = (option: SortOption) => {
        newsStore.setSortOption(option);
    };

    useEffect(() => {
        loadArticles();
    }, [selectedCategory]);

    const articles = selectedCategory
        ? newsStore.categoryArticles[selectedCategory] || []
        : newsStore.searchResults.length > 0
            ? newsStore.searchResults
            : newsStore.articles;

    return (
        <SafeAreaView
            style={[styles.container, settingsStore.darkMode && styles.darkContainer]}
            edges={['right', 'left']}         >

            <OfflineNotice />
            <SearchBar />

            <CategoryList
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategorySelect}
            />

            <SortOptions
                currentSort={newsStore.sortOption}
                onSortChange={handleSortChange}
            />

            {newsStore.isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : articles.length > 0 ? (
                <FlatList
                    data={articles}
                    keyExtractor={(item) => item.url}
                    renderItem={({ item }) => <ArticleCard article={item} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={settingsStore.darkMode ? colors.primaryLight : colors.primary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={newsStore.isLoadingMore ? (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.loadingMoreText, settingsStore.darkMode && styles.darkText]}>
                                Loading more articles...
                            </Text>
                        </View>
                    ) : null}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, settingsStore.darkMode && styles.darkText]}>
                        {newsStore.error ?
                            `Error loading articles: ${newsStore.error}` :
                            'No articles found. Try a different category or search term.'}
                    </Text>
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
    header: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: colors.primary,
        height: verticalScale(56),
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h1,
        color: '#ffffff',
        fontSize: FONT_SIZE.xxl,
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: FONT_SIZE.md,
        lineHeight: FONT_SIZE.md * 1.5,
        maxWidth: IS_LARGE_DEVICE ? '60%' : '80%',
    },
    darkText: {
        color: colors.darkTextSecondary,
    },
    loadingMoreContainer: {
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingMoreText: {
        ...typography.caption,
        marginLeft: SPACING.sm,
        color: colors.textSecondary,
    },
});

export default HomeScreen;