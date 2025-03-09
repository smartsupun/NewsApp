export interface Source {
    id: string | null;
    name: string;
}

export interface Article {
    source: Source;
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

export interface ArticleResponse {
    status: string;
    totalResults: number;
    articles: Article[];
}