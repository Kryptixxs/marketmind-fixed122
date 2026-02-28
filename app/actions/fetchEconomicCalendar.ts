'use server';

import * as cheerio from 'cheerio';

export interface CalendarEvent {
  date: string;       // ISO string e.g. 2026-02-27T08:30:00-05:00
  time: string;       // Formatted time or "All Day"
  currency: string;
  impact: string;
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

// Map common countries to currencies for fallback
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', 'United States': 'USD', USA: 'USD',
  EU: 'EUR', Eurozone: 'EUR', Germany: 'EUR', France: 'EUR', Italy: 'EUR', Spain: 'EUR',
  UK: 'GBP', 'United Kingdom': 'GBP', Britain: 'GBP',
  Japan: 'JPY', China: 'CNY', Australia: 'AUD', Canada: 'CAD', 'New Zealand': 'NZD',
  Switzerland: 'CHF', 'Hong Kong': 'HKD', 'South Korea': 'KRW', India: 'INR',
  Mexico: 'MXN', Brazil: 'BRL', 'South Africa': 'ZAR',
};

function normalizeImpact(impactClassOrTitle: string): string {
  if (!impactClassOrTitle) return 'Low';
  const lower = impactClassOrTitle.toLowerCase();
  if (lower.includes('high') || lower.includes('red')) return 'High';
  if (lower.includes('medium') || lower.includes('orange')) return 'Medium';
  if (lower.includes('low') || lower.includes('yellow')) return 'Low';
  return 'Low';
}

// ------------------------------------------------------------------
// In-Memory Cache
// ------------------------------------------------------------------
let cachedData: CalendarEvent[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// ------------------------------------------------------------------
// 1. JSON Fetch (Primary - Fastest)
// ------------------------------------------------------------------
async function fetchFromJSON(): Promise<CalendarEvent[]> {
  const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketMind/1.0)',
      },
      next: { revalidate: 300 }
    });
    clearTimeout(timeout);
    
    if (res.status === 429) throw new Error('RateLimited');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();
    if (!Array.isArray(body)) throw new Error('Invalid JSON');

    return body.map((item: any) => {
      const dateStr = String(item.date ?? '').trim();
      const country = String(item.country ?? '');
      const currency = COUNTRY_TO_CURRENCY[country] ?? (String(item.currency ?? '').toUpperCase() || country);
      
      let timeStr = 'All Day';
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
      }

      return {
        date: dateStr,
        time: timeStr,
        currency: currency || 'USD',
        impact: normalizeImpact(String(item.impact ?? '')),
        title: String(item.title ?? 'Economic Event'),
        forecast: String(item.forecast ?? ''),
        previous: String(item.previous ?? ''),
        actual: String(item.actual ?? ''),
        country: country || currency,
      };
    });
  } catch (e) {
    if ((e as Error).message === 'RateLimited') throw e; // Propagate to trigger fallback
    console.warn('JSON fetch warning:', (e as Error).message);
    return []; // Return empty to signal failure without forcing fallback if just a network blip
  }
}

// ------------------------------------------------------------------
// 2. HTML Scrape (Fallback - Robust)
// ------------------------------------------------------------------
async function scrapeFromHTML(): Promise<CalendarEvent[]> {
  const url = 'https://www.forexfactory.com/calendar?week=this';
  try {
    console.log('Attempting to scrape Forex Factory HTML...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache',
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const events: CalendarEvent[] = [];
    
    // Attempt to find today's date context
    const now = new Date();
    
    $('tr.calendar_row').each((_, el) => {
      const row = $(el);
      const currency = row.find('.calendar__currency').text().trim();
      const title = row.find('.calendar__event-title').text().trim() || row.find('.calendar__event').text().trim();
      const time = row.find('.calendar__time').text().trim();
      const impactClass = row.find('.calendar__impact span').attr('class') || '';
      const actual = row.find('.calendar__actual').text().trim();
      const forecast = row.find('.calendar__forecast').text().trim();
      const previous = row.find('.calendar__previous').text().trim();

      if (!title || !currency) return;

      events.push({
        date: now.toISOString(), // Fallback date
        time: time || 'All Day',
        currency: currency,
        impact: normalizeImpact(impactClass),
        title,
        forecast,
        previous,
        actual,
        country: currency
      });
    });

    return events;
  } catch (err) {
    console.error('Scraping failed:', err);
    return [];
  }
}

// ------------------------------------------------------------------
// Main Fetch Logic
// ------------------------------------------------------------------
export async function fetchEconomicCalendarForWeek(weekOffset: number): Promise<CalendarEvent[]> {
  const now = Date.now();
  
  // 1. Check Cache
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData;
  }

  // 2. Try JSON Feed
  try {
    const jsonData = await fetchFromJSON();
    if (jsonData.length > 0) {
      cachedData = jsonData;
      lastFetchTime = now;
      return jsonData;
    }
  } catch (e) {
    // If rate limited, fall through to scrape
    if ((e as Error).message === 'RateLimited') {
      console.warn('JSON feed rate limited. Switching to scrape fallback.');
    }
  }

  // 3. Fallback: Scrape HTML (Only for current week)
  if (weekOffset === 0) {
    const scrapedData = await scrapeFromHTML();
    if (scrapedData.length > 0) {
      cachedData = scrapedData;
      lastFetchTime = now;
      return scrapedData;
    }
  }

  // 4. Return stale cache if everything fails
  return cachedData || [];
}

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  return fetchEconomicCalendarForWeek(0);
}

export async function isEconomicCalendarConfigured(): Promise<boolean> {
  return true;
}