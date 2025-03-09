import { makeAutoObservable, runInAction } from 'mobx';
import { Article } from '../../models/Article';
import * as newsApi from '../api/newsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as articleRepository from '../database/articleRepository';
import NetInfo from '@react-native-community/netinfo';
import { getNotificationSettings, sendImmediateNotification } from '../notifications/notificationService';

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

    currentPage: number = 1;
    hasMoreArticles: boolean = true;
    isLoadingMore: boolean = false;


    constructor() {
        makeAutoObservable(this);
        this.loadBookmarks();
        this.loadSortPreference();
        this.checkConnectivity();
    }

    async checkConnectivity() {
        const netInfo = await NetInfo.fetch();
        this.isOffline = !netInfo.isConnected;

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


    sortAllArticles() {
        this.articles = this.sortArticles(this.articles);
        this.searchResults = this.sortArticles(this.searchResults);
        this.bookmarkedArticles = this.sortArticles(this.bookmarkedArticles);

        Object.keys(this.categoryArticles).forEach(category => {
            this.categoryArticles[category] = this.sortArticles(this.categoryArticles[category]);
        });
    }

    sortArticles(articlesToSort: Article[]): Article[] {
        return [...articlesToSort].sort((a, b) => {
            const dateA = new Date(a.publishedAt).getTime();
            const dateB = new Date(b.publishedAt).getTime();

            if (this.sortOption === 'newest') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
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

    async fetchTopHeadlines(country = 'us', category = '', page = 1, refresh = false) {
        if (refresh || page === 1) {
            this.isLoading = true;
            runInAction(() => {
                this.currentPage = 1;
                this.hasMoreArticles = true;
            });
        } else {
            this.isLoadingMore = true;
        }

        this.error = null;

        try {
            const existingArticles = category
                ? this.categoryArticles[category] || []
                : this.articles;

            const netInfo = await NetInfo.fetch();
            const isConnected = netInfo.isConnected;

            if (isConnected) {
                const response = await newsApi.fetchTopHeadlines(country, category, 20, page);

                runInAction(() => {
                    this.hasMoreArticles = response.articles.length > 0;

                    if (page === 1) {
                        if (category) {
                            this.categoryArticles[category] = this.sortArticles(response.articles);
                            articleRepository.cacheCategoryArticles(category, response.articles);
                        } else {
                            this.articles = this.sortArticles(response.articles);
                            articleRepository.cacheArticles(response.articles);
                        }
                    } else {
                        if (category) {
                            this.categoryArticles[category] = [
                                ...existingArticles,
                                ...this.sortArticles(response.articles)
                            ];
                        } else {
                            this.articles = [
                                ...existingArticles,
                                ...this.sortArticles(response.articles)
                            ];
                        }
                    }

                    this.currentPage = page;
                    this.isLoading = false;
                    this.isLoadingMore = false;
                });
            } else {
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

    async loadMoreArticles(country = 'us', category = '') {
        if (this.isLoading || this.isLoadingMore || !this.hasMoreArticles) {
            return;
        }

        const nextPage = this.currentPage + 1;
        await this.fetchTopHeadlines(country, category, nextPage, false);
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
            const netInfo = await NetInfo.fetch();
            const isConnected = netInfo.isConnected;

            if (isConnected) {
                const response = await newsApi.searchNews(query);

                runInAction(() => {
                    this.searchResults = this.sortArticles(response.articles);
                    this.isLoading = false;
                });
            } else {
                runInAction(() => {
                    this.isOffline = true;
                });

                const cachedArticles = await articleRepository.getCachedArticles();
                const categoryArticlesAll = await Promise.all(
                    ['business', 'entertainment', 'health', 'science', 'sports', 'technology']
                        .map(c => articleRepository.getCachedCategoryArticles(c))
                );

                const allCachedArticles = [
                    ...cachedArticles,
                    ...categoryArticlesAll.flat(),
                    ...this.bookmarkedArticles
                ];

                const uniqueArticles = Array.from(
                    new Map(allCachedArticles.map(item => [item.url, item])).values()
                );

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

    private async checkForBreakingNews(newArticles: Article[], oldArticles: Article[] = []) {
        try {
            const settings = await getNotificationSettings();

            if (!settings.enabled || !settings.breakingNews) return;

            const breakingNews = newArticles.filter(article =>
                article.title.toLowerCase().includes('breaking') &&
                !oldArticles.some(oldArticle => oldArticle.url === article.url)
            );

            if (breakingNews.length > 0) {
                const article = breakingNews[0];
                await sendImmediateNotification(
                    'Breaking News',
                    article.title,
                    {
                        type: 'article',
                        articleUrl: article.url
                    }
                );
            }
        } catch (error) {
            console.error('Error checking for breaking news:', error);
        }


    }
    private async checkForCategoryUpdates(category: string, newArticles: Article[], oldArticles: Article[] = []) {
        try {

            const settings = await getNotificationSettings();

            if (!settings.enabled || !settings.categories.includes(category)) return;

            const newUpdates = newArticles.filter(article =>
                !oldArticles.some(oldArticle => oldArticle.url === article.url)
            );

            if (newUpdates.length > 0) {
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                await sendImmediateNotification(
                    `${categoryName} News Update`,
                    `${newUpdates.length} new ${categoryName} articles available`,
                    {
                        type: 'category',
                        category: category
                    }
                );
            }
        } catch (error) {
            console.error(`Error checking for ${category} updates:`, error);
        }
    }

}


export default new NewsStore();