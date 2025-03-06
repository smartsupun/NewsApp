// src/services/database/articleRepository.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../../models/Article';

// Storage keys
const CACHED_ARTICLES_KEY = 'newsapp_cached_articles';
const CATEGORY_ARTICLES_KEY = 'newsapp_category_articles';
const LAST_FETCH_TIME_KEY = 'newsapp_last_fetch_time';

// Save articles to local storage
export const cacheArticles = async (articles: Article[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(CACHED_ARTICLES_KEY, JSON.stringify(articles));
        await AsyncStorage.setItem(LAST_FETCH_TIME_KEY, new Date().toISOString());
    } catch (error) {
        console.error('Error caching articles:', error);
    }
};

// Cache articles by category
export const cacheCategoryArticles = async (
    category: string,
    articles: Article[]
): Promise<void> => {
    try {
        // Get existing categories data or initialize empty object
        const categoryDataJson = await AsyncStorage.getItem(CATEGORY_ARTICLES_KEY);
        const categoryData = categoryDataJson ? JSON.parse(categoryDataJson) : {};

        // Update with new data for this category
        categoryData[category] = {
            articles,
            timestamp: new Date().toISOString()
        };

        await AsyncStorage.setItem(CATEGORY_ARTICLES_KEY, JSON.stringify(categoryData));
    } catch (error) {
        console.error(`Error caching ${category} articles:`, error);
    }
};

// Get cached articles
export const getCachedArticles = async (): Promise<Article[]> => {
    try {
        const articlesJson = await AsyncStorage.getItem(CACHED_ARTICLES_KEY);
        if (!articlesJson) return [];
        return JSON.parse(articlesJson);
    } catch (error) {
        console.error('Error retrieving cached articles:', error);
        return [];
    }
};

// Get category articles
export const getCachedCategoryArticles = async (category: string): Promise<Article[]> => {
    try {
        const categoryDataJson = await AsyncStorage.getItem(CATEGORY_ARTICLES_KEY);
        if (!categoryDataJson) return [];

        const categoryData = JSON.parse(categoryDataJson);
        if (!categoryData[category]) return [];

        return categoryData[category].articles;
    } catch (error) {
        console.error(`Error retrieving cached ${category} articles:`, error);
        return [];
    }
};

// Get last fetch time
export const getLastFetchTime = async (): Promise<Date | null> => {
    try {
        const timestamp = await AsyncStorage.getItem(LAST_FETCH_TIME_KEY);
        if (!timestamp) return null;
        return new Date(timestamp);
    } catch (error) {
        console.error('Error retrieving last fetch time:', error);
        return null;
    }
};

// Clear cache
export const clearArticleCache = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CACHED_ARTICLES_KEY);
        await AsyncStorage.removeItem(CATEGORY_ARTICLES_KEY);
        await AsyncStorage.removeItem(LAST_FETCH_TIME_KEY);
    } catch (error) {
        console.error('Error clearing article cache:', error);
    }
};