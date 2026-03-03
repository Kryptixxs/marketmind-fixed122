'use server';

// RSS feeds by category - these have real titles AND descriptions
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
    { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,MSFT,GOOGL,AMZN&region=US&lang=en-US', source: 'Yahoo Finance' },
    { url: 'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline', source: 'Investopedia' },
  ],
  Crypto: [
    { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    { url: 'https://coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { url: 'https://cryptonews.com/news/feed/', source: 'CryptoNews' },
    { url: 'https://decrypt.co/feed', source: 'Decrypt' },
  ],
  Forex: [
    { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet' },
    { url: 'https://www.forexlive.com/feed', source: 'ForexLive' },
    { url: 'https://www.dailyfx.com/feeds/all', source: 'DailyFX' },
  ],
};

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

function parseRSS(xmlText: string, sourceName: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Extract all <item> blocks
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractCdataOrText(itemXml, 'link');
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary') || extractTag(itemXml, 'content:encoded');
    const pubDateStr = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date') || extractTag(itemXml, 'published');
    
    if (!title || !link) continue;

    // Clean description: strip HTML tags, decode entities, trim whitespace
    const cleanDescription = cleanText(description || '');

    // Extract image from description or media tags
    const imageUrl = extractImage(itemXml, description || '');

    // Parse date
    let pubDate = Date.now();
    if (pubDateStr) {
      const parsed = Date.parse(pubDateStr);
      if (!isNaN(parsed)) pubDate = parsed;
    }

    // Format time
    const diffMs = Date.now() - pubDate;
    const diffMins = Math.round(diffMs / 60000);
    let timeStr: string;
    if (diffMins < 1) timeStr = 'Just now';
    else if (diffMins < 60) timeStr = `${diffMins}m ago`;
    else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)}h ago`;
    else timeStr = `${Math.floor(diffMins / 1440)}d ago`;

    items.push({
      title: cleanText(title),
      link: link.trim(),
      source: sourceName,
      time: timeStr,
      category,
      imageUrl,
      contentSnippet: cleanDescription.length > 200 
        ? cleanDescription.slice(0, 197) + '...' 
        : cleanDescription,
      pubDate,
    });
  }
  
  return items;
}

function extractTag(xml: string, tag: string): string {
  // Try CDATA first, then plain text
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const selfClosingRe = new RegExp(`<${tag}[^/]*\\/[^>]*>`, 'i');
  
  let m = cdataRe.exec(xml);
  if (m) return m[1].trim();
  
  m = plainRe.exec(xml);
  if (m) return m[1].trim();
  
  // For link, sometimes it's just text after the opening tag
  const linkInlineRe = /<link\s*\/?>(https?:\/\/[^\s<]+)/i;
  if (tag === 'link') {
    const lm = linkInlineRe.exec(xml);
    if (lm) return lm[1];
  }
  
  return '';
}

function extractCdataOrText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>[^<]*(https?://[^\\s<"]+)`, 'i');
  const m = re.exec(xml);
  return m ? m[1] : '';
}

function extractImage(itemXml: string, description: string): string | null {
  // media:content or media:thumbnail
  const mediaRe = /<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i;
  let m = mediaRe.exec(itemXml);
  if (m) return m[1];
  
  // enclosure
  const enclosureRe = /<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i;
  m = enclosureRe.exec(itemXml);
  if (m) return m[1];
  
  // img src in description
  const imgRe = /<img[^>]+src=["']([^"']+)["']/i;
  m = imgRe.exec(description);
  if (m) return m[1];
  
  return null;
}

function cleanText(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchNews(category: string): Promise<NewsItem[]> {
  const feeds = RSS_FEEDS[category] || RSS_FEEDS.General;
  
  const results = await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MarketMind/1.0; +https://marketmind.app)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          next: { revalidate: 300 }, // cache 5 mins
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          console.warn(`RSS fetch failed for ${url}: ${response.status}`);
          return [];
        }
        
        const text = await response.text();
        return parseRSS(text, source, category);
      } catch (e) {
        console.warn(`RSS error for ${url}:`, (e as Error).message);
        return [];
      }
    })
  );
  
  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }
  
  if (allItems.length === 0) {
    console.warn(`All RSS feeds failed for category: ${category}`);
    return [];
  }
  
  // De-duplicate by title similarity, sort by date desc
  const seen = new Set<string>();
  const deduped = allItems
    .filter(item => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, 20);
  
  return deduped;
}
