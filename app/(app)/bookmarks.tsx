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
import {
    verticalScale,
    SPACING,
    FONT_SIZE
} from '../../src/utils/constants';

const BookmarksScreen = observer(() => {
    const handleSortChange = (option: SortOption) => {
        newsStore.setSortOption(option);
    };

    return (
        <SafeAreaView
            style={[styles.container, settingsStore.darkMode && styles.darkContainer]}
            edges={['right', 'left']}
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
    darkText: {
        color: colors.darkText,
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
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
    }

});

export default BookmarksScreen;