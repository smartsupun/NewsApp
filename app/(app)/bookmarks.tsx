// app/(app)/bookmarks.tsx
import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArticleCard from '../../src/components/news/ArticleCard';
import SortOptions from '../../src/components/news/SortOptions';
import newsStore, { SortOption } from '../../src/services/stores/newsStore';
import settingsStore from '../../src/services/stores/settingsStore';
import colors from '../../src/theme/colors';
import typography from '../../src/theme/typography';

const BookmarksScreen = observer(() => {
    const handleSortChange = (option: SortOption) => {
        newsStore.setSortOption(option);
    };

    return (
        <SafeAreaView
            style={[styles.container, settingsStore.darkMode && styles.darkContainer]}
            edges={['right', 'left']} // Don't include top edge to reduce whitespace
        >
            <View style={styles.header}>
                <Text style={[styles.headerTitle, settingsStore.darkMode && styles.darkText]}>
                    Bookmarks
                </Text>
            </View>

            <SortOptions
                currentSort={newsStore.sortOption}
                onSortChange={handleSortChange}
            />

            {newsStore.bookmarkedArticles.length > 0 ? (
                <FlatList
                    data={newsStore.bookmarkedArticles}
                    keyExtractor={(item) => item.url}
                    renderItem={({ item }) => (
                        <ArticleCard
                            article={item}
                            showBookmarkButton={true}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, settingsStore.darkMode && styles.darkText]}>
                        You haven't bookmarked any articles yet.
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
    darkText: {
        color: colors.darkText,
    },
    listContent: {
        padding: 16,
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
});

export default BookmarksScreen;