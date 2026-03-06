'use server';

import { makePrototypeNews } from '@/lib/prototype-data';

export interface NewsArticle {
  title: string;
  source: string;
  link: string;
  time: string;
  category: string;
  imageUrl: string | null;
  contentSnippet: string;
  pubDate: number;
  tickers: string[];
}

export async function fetchFinnhubNews(category: string = 'general', symbol?: string): Promise<NewsArticle[]> {
  const normalizedCategory =
    category.toLowerCase() === 'crypto'
      ? 'Crypto'
      : category.toLowerCase() === 'forex'
        ? 'Forex'
        : category.toLowerCase() === 'stock'
          ? 'Stock'
          : 'General';

  return makePrototypeNews(normalizedCategory, symbol).map((item) => ({
    title: item.title,
    source: item.source,
    link: item.link,
    time: item.time,
    category: item.category,
    imageUrl: item.imageUrl,
    contentSnippet: item.contentSnippet,
    pubDate: item.pubDate,
    tickers: symbol ? [symbol] : [],
  }));
}
