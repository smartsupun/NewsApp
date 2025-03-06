// src/services/stores/newsStore.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Article } from '../../models/Article';
import * as newsApi from '../api/newsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as articleRepository from '../database/articleRepository';
import NetInfo from '@react-native-community/netinfo';

const BOOKMARKS_STORAGE_KEY = 'newsapp_bookmarks';

class NewsStore {
    articles: Article[] = [];
    categoryArticles: { [key: string]: Article[] } = {};
    bookmarkedArticles: Article[] = [];
    searchResults: Article[] = [];
    isLoading: boolean = false;
    error: string | null = null;
    isOffline: boolean = false;

    constructor() {
        makeAutoObservable(this);
        this.loadBookmarks();
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
        await this.loadCachedArticles();
    }

    async loadCachedArticles() {
        try {
            const cachedArticles = await articleRepository.getCachedArticles();
            if (cachedArticles.length > 0) {
                runInAction(() => {
                    this.articles = cachedArticles;
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
                    this.bookmarkedArticles = JSON.parse(storedBookmarks);
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
                        this.categoryArticles[category] = response.articles;
                        // Cache category articles
                        articleRepository.cacheCategoryArticles(category, response.articles);
                    } else {
                        this.articles = response.articles;
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
                        this.categoryArticles[category] = cachedArticles;
                    });
                } else {
                    cachedArticles = await articleRepository.getCachedArticles();
                    runInAction(() => {
                        this.articles = cachedArticles;
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
                            this.categoryArticles[category] = cachedArticles;
                            this.error = 'Showing cached articles. Please check your connection.';
                        }
                    });
                } else {
                    cachedArticles = await articleRepository.getCachedArticles();
                    runInAction(() => {
                        if (cachedArticles.length > 0) {
                            this.articles = cachedArticles;
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
                    this.searchResults = response.articles;
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
                    this.searchResults = results;
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