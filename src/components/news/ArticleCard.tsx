import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { Article } from '../../models/Article';
import newsStore from '../../services/stores/newsStore';
import settingsStore from '../../services/stores/settingsStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import {
    scale,
    verticalScale,
    SPACING,
    RADIUS,
    FONT_SIZE
} from '../../../src/utils/constants';

interface ArticleCardProps {
    article: Article;
    showBookmarkButton?: boolean;
}

const ArticleCard = observer(({ article, showBookmarkButton = true }: ArticleCardProps) => {
    const publishedDate = new Date(article.publishedAt);

    const formattedDate = publishedDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const isBookmarked = newsStore.isBookmarked(article.url);

    const handlePress = () => {
        router.push(`/article/${encodeURIComponent(article.url)}`);
    };

    return (
        <TouchableOpacity
            style={[styles.card, settingsStore.darkMode && styles.darkCard]}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
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

                {showBookmarkButton && (
                    <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={() => {
                            newsStore.toggleBookmark(article);
                        }}
                    >
                        <FontAwesome
                            name={isBookmarked ? "bookmark" : "bookmark-o"}
                            size={24}
                            color={isBookmarked ? colors.primary : (settingsStore.darkMode ? colors.darkText : colors.text)}
                        />
                    </TouchableOpacity>
                )}
            </View>

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
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: RADIUS.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        width: '100%',
    },
    darkCard: {
        backgroundColor: colors.darkSurface,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
    },
    image: {
        height: verticalScale(180),
        width: '100%',
    },
    placeholderImage: {
        height: verticalScale(180),
        width: '100%',
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: SPACING.md,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZE.lg,
        lineHeight: FONT_SIZE.lg * 1.3,
    },
    darkText: {
        color: colors.darkText,
    },
    source: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZE.sm,
    },
    darkSubText: {
        color: colors.darkTextSecondary,
    },
    description: {
        ...typography.body,
        color: colors.text,
        fontSize: FONT_SIZE.md,
        lineHeight: FONT_SIZE.md * 1.4,
    },
    bookmarkButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        padding: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: RADIUS.round,
        width: scale(40),
        height: scale(40),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    }
});

export default ArticleCard;