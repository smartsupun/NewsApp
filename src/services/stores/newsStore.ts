// src/services/stores/newsStore.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Article } from '../../models/Article';
import * as newsApi from '../api/newsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as articleRepository from '../database/articleRepository';
import NetInfo from '@react-native-community/netinfo';

const BOOKMARKS_STORAGE_KEY = 'newsapp_bookmarks';
const SORT_PREFERENCE_KEY = 'newsapp_sort_preference';

export type SortOption = 'newest' | 'oldest';

class NewsStore {
    articles: Article[] = [];
    categoryArticles: { [key: string]: Article[] } = {};
    bookmarkedArticles: Article[] = [];
    searchResults: Article[] = [];
    isLoading: boolean = false;
    error: string | null = null;
    isOffline: boolean = false;
    sortOption: SortOption = 'newest';

    constructor() {
        makeAutoObservable(this);
        this.loadBookmarks();
        this.loadSortPreference();
        this.checkConnectivity();
    }

    async checkConnectivity() {
        const netInfo = await NetInfo.fetch();
        this.isOffline = !netInfo.isConnected;

        // Subscribe to network state updates
        NetInfo.addEventListener(state => {
            runInAction(() => {
                this.isOffline = !state.isConnected;
            });
        });
    }

    async initialize() {
        await this.loadBookmarks();
        await this.loadSortPreference();
        await this.loadCachedArticles();
    }

    async loadSortPreference() {
        try {
            const savedSort = await AsyncStorage.getItem(SORT_PREFERENCE_KEY);
            if (savedSort) {
                runInAction(() => {
                    this.sortOption = savedSort as SortOption;
                });
            }
        } catch (error) {
            console.error('Error loading sort preference:', error);
        }
    }

    async saveSortPreference() {
        try {
            await AsyncStorage.setItem(SORT_PREFERENCE_KEY, this.sortOption);
        } catch (error) {
            console.error('Error saving sort preference:', error);
        }
    }

    setSortOption(option: SortOption) {
        this.sortOption = option;
        this.saveSortPreference();
        this.sortAllArticles();
    }

    // Apply current sort option to all article collections
    sortAllArticles() {
        this.articles = this.sortArticles(this.articles);
        this.searchResults = this.sortArticles(this.searchResults);
        this.bookmarkedArticles = this.sortArticles(this.bookmarkedArticles);

        // Sort category articles
        Object.keys(this.categoryArticles).forEach(category => {
            this.categoryArticles[category] = this.sortArticles(this.categoryArticles[category]);
        });
    }

    // Sort an array of articles based on the current sort option
    sortArticles(articlesToSort: Article[]): Article[] {
        return [...articlesToSort].sort((a, b) => {
            const dateA = new Date(a.publishedAt).getTime();
            const dateB = new Date(b.publishedAt).getTime();

            if (this.sortOption === 'newest') {
                return dateB - dateA; // Newest first
            } else {
                return dateA - dateB; // Oldest first
            }
        });
    }

    async loadCachedArticles() {
        try {
            const cachedArticles = await articleRepository.getCachedArticles();
            if (cachedArticles.length > 0) {
                runInAction(() => {
                    this.articles = this.sortArticles(cachedArticles);
                });
            }
        } catch (error) {
            console.error('Error loading cached articles:', error);
        }
    }

    async loadBookmarks() {
        try {
            const storedBookmarks = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);

            if (storedBookmarks) {
                runInAction(() => {
                    this.bookmarkedArticles = this.sortArticles(JSON.parse(storedBookmarks));
                });
            }
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }

    async saveBookmarks() {
        try {
            await AsyncStorage.setItem(
                BOOKMARKS_STORAGE_KEY,
                JSON.stringify(this.bookmarkedArticles)
            );
        } catch (error) {
            console.error('Error saving bookmarks:', error);
        }
    }

    // Fetch articles with offline support
    async fetchTopHeadlines(country = 'us', category = '', refresh = false) {
        this.isLoading = true;
        this.error = null;

        try {
            // Check if we're online
            const netInfo = await NetInfo.fetch();
            const isConnected = netInfo.isConnected;

            if (isConnected) {
                // Online: fetch from API
                const response = await newsApi.fetchTopHeadlines(country, category);

                runInAction(() => {
                    if (category) {
                        this.categoryArticles[category] = this.sortArticles(response.articles);
                        // Cache category articles
                        articleRepository.cacheCategoryArticles(category, response.articles);
                    } else {
                        this.articles = this.sortArticles(response.articles);
                        // Cache main articles
                        articleRepository.cacheArticles(response.articles);
                    }
                    this.isLoading = false;
                });
            } else {
                // Offline: load from cache
                runInAction(() => {
                    this.isOffline = true;
                });

                let cachedArticles: Article[] = [];
                if (category) {
                    cachedArticles = await articleRepository.getCachedCategoryArticles(category);
                    runInAction(() => {
                        this.categoryArticles[category] = this.sortArticles(cachedArticles);
                    });
                } else {
                    cachedArticles = await articleRepository.getCachedArticles();
                    runInAction(() => {
                        this.articles = this.sortArticles(cachedArticles);
                    });
                }

                runInAction(() => {
                    this.isLoading = false;
                    if (cachedArticles.length === 0) {
                        this.error = 'No cached articles available offline';
                    }
                });
            }
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message;
                this.isLoading = false;
            });

            // If API fails, try to load from cache
            try {
                let cachedArticles: Article[] = [];
                if (category) {
                    cachedArticles = await articleRepository.getCachedCategoryArticles(category);
                    runInAction(() => {
                        if (cachedArticles.length > 0) {
                            this.categoryArticles[category] = this.sortArticles(cachedArticles);
                            this.error = 'Showing cached articles. Please check your connection.';
                        }
                    });
                } else {
                    cachedArticles = await articleRepository.getCachedArticles();
                    runInAction(() => {
                        if (cachedArticles.length > 0) {
                            this.articles = this.sortArticles(cachedArticles);
                            this.error = 'Showing cached articles. Please check your connection.';
                        }
                    });
                }
            } catch (cacheError) {
                console.error('Error loading from cache:', cacheError);
            }
        }
    }


    async searchArticles(query: string) {
        if (!query.trim()) {
            runInAction(() => {
                this.searchResults = [];
            });
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            // Check if we're online
            const netInfo = await NetInfo.fetch();
            const isConnected = netInfo.isConnected;

            if (isConnected) {
                // Online: search via API
                const response = await newsApi.searchNews(query);

                runInAction(() => {
                    this.searchResults = this.sortArticles(response.articles);
                    this.isLoading = false;
                });
            } else {
                // Offline: search in cached articles
                runInAction(() => {
                    this.isOffline = true;
                });

                const cachedArticles = await articleRepository.getCachedArticles();
                const categoryArticlesAll = await Promise.all(
                    ['business', 'entertainment', 'health', 'science', 'sports', 'technology']
                        .map(c => articleRepository.getCachedCategoryArticles(c))
                );

                // Combine all cached articles for searching
                const allCachedArticles = [
                    ...cachedArticles,
                    ...categoryArticlesAll.flat(),
                    ...this.bookmarkedArticles
                ];

                // Remove duplicates
                const uniqueArticles = Array.from(
                    new Map(allCachedArticles.map(item => [item.url, item])).values()
                );

                // Search in cached articles
                const queryLower = query.toLowerCase();
                const results = uniqueArticles.filter(article =>
                    article.title.toLowerCase().includes(queryLower) ||
                    (article.description && article.description.toLowerCase().includes(queryLower)) ||
                    (article.content && article.content.toLowerCase().includes(queryLower))
                );

                runInAction(() => {
                    this.searchResults = this.sortArticles(results);
                    this.isLoading = false;
                    if (results.length === 0) {
                        this.error = 'No matching articles found in offline mode';
                    }
                });
            }
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message;
                this.isLoading = false;
            });
        }
    }

    toggleBookmark(article: Article) {
        const isBookmarked = this.isBookmarked(article.url);

        if (isBookmarked) {
            this.bookmarkedArticles = this.bookmarkedArticles.filter(
                item => item.url !== article.url
            );
        } else {
            this.bookmarkedArticles.push(article);
            this.bookmarkedArticles = this.sortArticles(this.bookmarkedArticles);
        }

        this.saveBookmarks();
    }

    isBookmarked(url: string): boolean {
        return this.bookmarkedArticles.some(article => article.url === url);
    }

    getArticleByUrl(url: string): Article | undefined {
        return (
            this.articles.find(a => a.url === url) ||
            this.searchResults.find(a => a.url === url) ||
            this.bookmarkedArticles.find(a => a.url === url) ||
            Object.values(this.categoryArticles)
                .flat()
                .find(a => a.url === url)
        );
    }

    clearSearch() {
        this.searchResults = [];
    }
}

export default new NewsStore();