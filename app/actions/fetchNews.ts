'use server';

// RSS feeds by category
const RSS_FEEDS: Record<string, { url: string; source: string }[]> = {
  General: [
    { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI&region=US&lang=en-US', source: 'Yahoo Finance' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC' },
    { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', source: 'MarketWatch' },
    { url: 'https://www.ft.com/rss/home/uk', source: 'Financial Times' },
  ],
  Stock: [
    { url: 'https://www.cnbc.com/id/15839135/device/rss/rss.html', source: 'CNBC Markets' },
    { url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/', source: 'MarketWatch' },
    { url: 'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline', source: 'Investopedia' },
  ],
  Crypto: [
    { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    { url: 'https://coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { url: 'https://cryptonews.com/news/feed/', source: 'CryptoNews' },
  ],
  Forex: [
    { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet' },
    { url: 'https://www.forexlive.com/feed', source: 'ForexLive' },
    { url: 'https://www.dailyfx.com/feeds/all', source: 'DailyFX' },
  ],
};

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  sources: string[];
  time: string;
  category: string;
  imageUrl: string | null;
  contentSnippet: string;
  pubDate: number;
  entities: string[];
}

function parseRSS(xmlText: string, sourceName: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractCdataOrText(itemXml, 'link');
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary');
    const pubDateStr = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published');
    
    if (!title || !link) continue;

    const cleanDescription = cleanText(description || '');
    let pubDate = Date.now();
    if (pubDateStr) {
      const parsed = Date.parse(pubDateStr);
      if (!isNaN(parsed)) pubDate = parsed;
    }

    // Simple entity detection (tickers/currencies)
    const entities = Array.from(new Set(title.match(/\b[A-Z]{2,5}\b/g) || []))
      .filter(e => !['THE', 'AND', 'FOR', 'WITH', 'FROM', 'THAT', 'THIS'].includes(e));

    items.push({
      id: Math.random().toString(36).substring(7),
      title: cleanText(title),
      link: link.trim(),
      sources: [sourceName],
      time: '', // Formatted later
      category,
      imageUrl: null,
      contentSnippet: cleanDescription,
      pubDate,
      entities
    });
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  let m = cdataRe.exec(xml);
  if (m) return m[1].trim();
  m = plainRe.exec(xml);
  if (m) return m[1].trim();
  return '';
}

function extractCdataOrText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>[^<]*(https?://[^\\s<"]+)`, 'i');
  const m = re.exec(xml);
  return m ? m[1] : '';
}

function cleanText(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchNews(category: string, symbols: string[] = []): Promise<NewsItem[]> {
  let feeds = RSS_FEEDS[category] || RSS_FEEDS.General;
  
  if (category === 'Watchlist' && symbols.length > 0) {
    feeds = [{
      url: `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbols.join(',')}&region=US&lang=en-US`,
      source: 'Yahoo Finance'
    }];
  }

  const results = await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const response = await fetch(url, { next: { revalidate: 300 } });
        if (!response.ok) return [];
        const text = await response.text();
        return parseRSS(text, source, category);
      } catch (e) {
        return [];
      }
    })
  );
  
  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') allItems.push(...result.value);
  }
  
  // Clustering & Deduplication
  const clusters: Record<string, NewsItem> = {};
  allItems.forEach(item => {
    const key = item.title.toLowerCase().slice(0, 60); // Cluster by title similarity
    if (clusters[key]) {
      if (!clusters[key].sources.includes(item.sources[0])) {
        clusters[key].sources.push(item.sources[0]);
      }
    } else {
      clusters[key] = item;
    }
  });

  const finalItems = Object.values(clusters)
    .sort((a, b) => b.pubDate - a.pubDate)
    .map(item => {
      const diffMins = Math.round((Date.now() - item.pubDate) / 60000);
      let timeStr = 'Just now';
      if (diffMins >= 1440) timeStr = `${Math.floor(diffMins / 1440)}d ago`;
      else if (diffMins >= 60) timeStr = `${Math.floor(diffMins / 60)}h ago`;
      else if (diffMins >= 1) timeStr = `${diffMins}m ago`;
      return { ...item, time: timeStr };
    })
    .slice(0, 40);
  
  return finalItems;
}