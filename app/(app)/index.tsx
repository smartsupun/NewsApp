// app/(app)/index.tsx
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

const HomeScreen = observer(() => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadArticles = async () => {
        await newsStore.fetchTopHeadlines('us', selectedCategory);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadArticles();
        setRefreshing(false);
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primary,
    },
    headerTitle: {
        ...typography.h1,
        color: colors.text,
        fontSize: 24,
    },
    listContent: {
        padding: 16,
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
        padding: 20,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    darkText: {
        color: colors.darkTextSecondary,
    },
});

export default HomeScreen;