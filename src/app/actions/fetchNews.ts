'use server';

import { makePrototypeNews } from '@/lib/prototype-data';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  time: string;
  category: string;
  imageUrl: string | null;
  contentSnippet: string;
  pubDate: number;
}

export async function fetchNews(category: string): Promise<NewsItem[]> {
  return makePrototypeNews(category).map((item) => ({
    title: item.title,
    link: item.link,
    source: item.source,
    time: item.time,
    category: item.category,
    imageUrl: item.imageUrl,
    contentSnippet: item.contentSnippet,
    pubDate: item.pubDate,
  }));
}
