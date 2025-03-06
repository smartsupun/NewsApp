// app/(app)/bookmarks.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import ArticleCard from '../../src/components/news/ArticleCard';
import newsStore from '../../src/services/stores/newsStore';
import settingsStore from '../../src/services/stores/settingsStore';
import typography from '../../src/theme/typography';
import colors from '../../src/theme/colors';

const BookmarksScreen = observer(() => {
    return (
        <SafeAreaView style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
            <FlatList
                data={newsStore.bookmarkedArticles}
                keyExtractor={(item) => item.url}
                renderItem={({ item }) => <ArticleCard article={item} />}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <Text style={[styles.headerText, settingsStore.darkMode && styles.darkText]}>
                        Your Bookmarks
                    </Text>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome
                            name="bookmark-o"
                            size={64}
                            color={settingsStore.darkMode ? colors.darkTextSecondary : colors.textSecondary}
                        />
                        <Text style={[styles.emptyText, settingsStore.darkMode && styles.darkText]}>
                            No bookmarked articles yet
                        </Text>
                        <Text style={[styles.emptySubText, settingsStore.darkMode && styles.darkSubText]}>
                            Save articles to read later by tapping the bookmark icon
                        </Text>
                    </View>
                }
            />
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
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    headerText: {
        ...typography.h2,
        color: colors.text,
        marginBottom: 16,
    },
    darkText: {
        color: colors.darkText,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
    emptyText: {
        ...typography.h2,
        color: colors.text,
        marginTop: 16,
    },
    emptySubText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        maxWidth: '80%',
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
});

export default BookmarksScreen;