// src/services/stores/newsStore.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Article } from '../../models/Article';
import * as newsApi from '../api/newsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_STORAGE_KEY = 'newsapp_bookmarks';

class NewsStore {
    articles: Article[] = [];
    categoryArticles: { [key: string]: Article[] } = {};
    bookmarkedArticles: Article[] = [];
    searchResults: Article[] = [];
    isLoading: boolean = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
        this.loadBookmarks();
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

    async fetchTopHeadlines(country = 'us', category = '', refresh = false) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await newsApi.fetchTopHeadlines(country, category);

            runInAction(() => {
                if (category) {
                    this.categoryArticles[category] = response.articles;
                } else {
                    this.articles = response.articles;
                }
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message;
                this.isLoading = false;
            });
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
            const response = await newsApi.searchNews(query);

            runInAction(() => {
                this.searchResults = response.articles;
                this.isLoading = false;
            });
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