// app/(app)/(article)/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, Linking, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Article } from '../../../src/models/Article';
import newsStore from '../../../src/services/stores/newsStore';
import settingsStore from '../../../src/services/stores/settingsStore';
import colors from '../../../src/theme/colors';
import typography from '../../../src/theme/typography';

const ArticleDetailScreen = observer(() => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [article, setArticle] = useState<Article | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            try {
                // First try to use it directly
                let url = decodeURIComponent(id);
                let foundArticle = newsStore.getArticleByUrl(url);

                // If not found, try another approach
                if (!foundArticle) {
                    const allArticles = [
                        ...newsStore.articles,
                        ...newsStore.bookmarkedArticles,
                        ...newsStore.searchResults,
                        ...Object.values(newsStore.categoryArticles).flat()
                    ];

                    foundArticle = allArticles.find(a =>
                        a.url.includes(url) || url.includes(a.url) ||
                        id.includes(encodeURIComponent(a.url))
                    );
                }

                setArticle(foundArticle);
            } catch (error) {
                console.error('Error processing article URL:', error);
            }
            setLoading(false);
        }
    }, [id]);

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Article', // Just use a simple, clean title
                    headerShown: false,
                    headerTintColor: 'white',
                    headerTitleAlign: 'center', // Center the header text
                    headerStyle: {
                        backgroundColor: colors.primary
                    },
                    // Add a back button that doesn't show text
                    headerBackTitleVisible: false,
                }}
            />

            <SafeAreaView style={[styles.container, settingsStore.darkMode && styles.darkContainer]}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : !article ? (
                    <View style={styles.errorContainer}>
                        <FontAwesome
                            name="exclamation-circle"
                            size={64}
                            color={settingsStore.darkMode ? colors.darkTextSecondary : colors.textSecondary}
                        />
                        <Text style={[styles.errorText, settingsStore.darkMode && styles.darkText]}>
                            Article not found
                        </Text>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.backButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {article.urlToImage ? (
                            <Image source={{ uri: article.urlToImage }} style={styles.image} resizeMode="cover" />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <FontAwesome name="newspaper-o" size={64} color={colors.textSecondary} />
                            </View>
                        )}

                        <View style={styles.articleContent}>
                            <Text style={[styles.title, settingsStore.darkMode && styles.darkText]}>
                                {article.title}
                            </Text>

                            <View style={styles.metaRow}>
                                <Text style={[styles.source, settingsStore.darkMode && styles.darkSubText]}>
                                    {article.source.name}
                                </Text>
                                <Text style={[styles.date, settingsStore.darkMode && styles.darkSubText]}>
                                    {new Date(article.publishedAt).toLocaleDateString()} at {new Date(article.publishedAt).toLocaleTimeString()}
                                </Text>
                            </View>

                            {article.author && (
                                <Text style={[styles.author, settingsStore.darkMode && styles.darkSubText]}>
                                    By {article.author}
                                </Text>
                            )}

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => newsStore.toggleBookmark(article)}
                                >
                                    <FontAwesome
                                        name={newsStore.isBookmarked(article.url) ? "bookmark" : "bookmark-o"}
                                        size={20}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.actionText}>
                                        {newsStore.isBookmarked(article.url) ? "Bookmarked" : "Bookmark"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionButton} onPress={() => {
                                    Share.share({
                                        message: `Check out this article: ${article.title} - ${article.url}`,
                                        url: article.url,
                                    });
                                }}>
                                    <FontAwesome name="share-alt" size={20} color={colors.primary} />
                                    <Text style={styles.actionText}>Share</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionButton} onPress={() => {
                                    Linking.openURL(article.url);
                                }}>
                                    <FontAwesome name="external-link" size={20} color={colors.primary} />
                                    <Text style={styles.actionText}>Open</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.separator} />

                            <Text style={[styles.content, settingsStore.darkMode && styles.darkText]}>
                                {article.content ?
                                    article.content.replace(/\[\+\d+ chars\]$/, '') :
                                    article.description}
                            </Text>

                            <TouchableOpacity
                                style={styles.readMoreButton}
                                onPress={() => Linking.openURL(article.url)}
                            >
                                <Text style={styles.readMoreText}>Read Full Article</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </>
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
    scrollContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        ...typography.h2,
        color: colors.text,
        marginTop: 16,
        marginBottom: 24,
    },
    darkText: {
        color: colors.darkText,
    },
    backButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: 250,
    },
    placeholderImage: {
        width: '100%',
        height: 250,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    articleContent: {
        padding: 16,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    source: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    date: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    author: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    actionText: {
        marginLeft: 6,
        color: colors.primary,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: settingsStore.darkMode ? colors.darkDivider : colors.divider,
        marginVertical: 16,
    },
    content: {
        ...typography.body,
        color: colors.text,
        lineHeight: 24,
    },
    readMoreButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    readMoreText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ArticleDetailScreen;