import Constants from 'expo-constants';
import { ArticleResponse } from '../../models/Article';

const API_KEY = Constants.expoConfig?.extra?.newsApiId;
const BASE_URL = Constants.expoConfig?.extra?.newsApiUrl;

export const fetchTopHeadlines = async (
    country = 'us',
    category = '',
    pageSize = 20,
    page = 1
): Promise<ArticleResponse> => {
    try {
        const url = `${BASE_URL}/top-headlines?country=${country}&pageSize=${pageSize}&page=${page}${category ? `&category=${category}` : ''
            }&apiKey=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching headlines:', error);
        throw error;
    }
};

export const searchNews = async (
    query: string,
    pageSize = 20,
    page = 1
): Promise<ArticleResponse> => {
    try {
        const url = `${BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching news:', error);
        throw error;
    }
};