'use server';

interface FinnhubNewsItem {
  id: number;
  headline: string;
  source: string;
  url: string;
  summary: string;
  datetime: number;
  category: string;
  related: string;
  image: string;
}

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

const CACHE: { data: NewsArticle[]; ts: number; category: string } = { data: [], ts: 0, category: '' };
const CACHE_TTL = 300_000;

function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts * 1000;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export async function fetchFinnhubNews(category: string = 'general', symbol?: string): Promise<NewsArticle[]> {
  const cacheKey = `${category}:${symbol || ''}`;
  if (CACHE.category === cacheKey && Date.now() - CACHE.ts < CACHE_TTL) {
    return CACHE.data;
  }

  const apiKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    let url: string;
    if (symbol) {
      const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];
      url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`;
    } else {
      url = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;
    }

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const items: FinnhubNewsItem[] = await res.json();

    const articles: NewsArticle[] = items.slice(0, 25).map(item => ({
      title: item.headline,
      source: item.source,
      link: item.url,
      time: formatTimeAgo(item.datetime),
      category: item.category,
      imageUrl: item.image || null,
      contentSnippet: item.summary?.slice(0, 200) || '',
      pubDate: item.datetime * 1000,
      tickers: item.related ? item.related.split(',').map(t => t.trim()) : [],
    }));

    CACHE.data = articles;
    CACHE.ts = Date.now();
    CACHE.category = cacheKey;

    return articles;
  } catch (e) {
    console.warn('[FinnhubNews] Error:', (e as Error).message);
    return CACHE.data;
  }
}
