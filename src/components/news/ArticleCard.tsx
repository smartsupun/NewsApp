// src/components/news/ArticleCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Article } from '../../models/Article';
import newsStore from '../../services/stores/newsStore';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';

interface ArticleCardProps {
    article: Article;
    showBookmarkButton?: boolean;
}

const ArticleCard = ({ article, showBookmarkButton = true }: ArticleCardProps) => {
    const formattedDate = new Date(article.publishedAt).toLocaleDateString();
    const isBookmarked = newsStore.isBookmarked(article.url);

    const handlePress = () => {
        // Navigate to article detail, encoding the URL to use as a parameter
        router.push(`/article/${encodeURIComponent(article.url)}`);
    };

    return (
        <TouchableOpacity
            style={[styles.card, settingsStore.darkMode && styles.darkCard]}
            onPress={handlePress}
        >
            {article.urlToImage ? (
                <Image
                    source={{ uri: article.urlToImage }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.placeholderImage}>
                    <FontAwesome name="newspaper-o" size={48} color={colors.textSecondary} />
                </View>
            )}

            <View style={styles.content}>
                <Text style={[styles.title, settingsStore.darkMode && styles.darkText]}>
                    {article.title}
                </Text>

                <Text style={[styles.source, settingsStore.darkMode && styles.darkSubText]}>
                    {article.source.name} • {formattedDate}
                </Text>

                {article.description && (
                    <Text
                        style={[styles.description, settingsStore.darkMode && styles.darkText]}
                        numberOfLines={3}
                    >
                        {article.description}
                    </Text>
                )}

                {showBookmarkButton && (
                    <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={() => newsStore.toggleBookmark(article)}
                    >
                        <FontAwesome
                            name={isBookmarked ? "bookmark" : "bookmark-o"}
                            size={24}
                            color={isBookmarked ? colors.primary : (settingsStore.darkMode ? colors.darkText : colors.text)}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
        overflow: 'hidden',
    },
    darkCard: {
        backgroundColor: colors.darkSurface,
    },
    image: {
        height: 180,
        width: '100%',
    },
    placeholderImage: {
        height: 180,
        width: '100%',
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        marginBottom: 8,
    },
    darkText: {
        color: colors.darkText,
    },
    source: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
    description: {
        ...typography.body,
        color: colors.text,
    },
    bookmarkButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
});

export default ArticleCard;