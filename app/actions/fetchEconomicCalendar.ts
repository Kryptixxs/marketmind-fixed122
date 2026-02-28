'use server';

export interface CalendarEvent {
  date: string;       // ISO string
  time: string;       // Formatted time
  currency: string;
  impact: string;
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', 'United States': 'USD', USA: 'USD',
  EU: 'EUR', Eurozone: 'EUR', Germany: 'EUR', France: 'EUR', Italy: 'EUR', Spain: 'EUR',
  UK: 'GBP', 'United Kingdom': 'GBP', Britain: 'GBP',
  Japan: 'JPY', China: 'CNY', Australia: 'AUD', Canada: 'CAD', 'New Zealand': 'NZD',
  Switzerland: 'CHF', 'Hong Kong': 'HKD', 'South Korea': 'KRW', India: 'INR',
  Mexico: 'MXN', Brazil: 'BRL', 'South Africa': 'ZAR',
};

function normalizeImpact(impact: string): string {
  if (!impact) return 'Low';
  const lower = impact.toLowerCase();
  if (lower.includes('high') || lower === 'red') return 'High';
  if (lower.includes('medium') || lower.includes('med') || lower === 'orange') return 'Medium';
  return 'Low';
}

// --- In-Memory Cache ---
// preventing 429s during hot reloads
let cachedData: CalendarEvent[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Fetches the official JSON feed which is much more reliable than scraping.
 */
async function fetchJSONFeed(): Promise<CalendarEvent[]> {
  const now = Date.now();
  
  // Return cached data if fresh
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData;
  }

  const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  
  try {
    console.log('Fetching economic calendar from JSON feed...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 } // Ask Next.js to cache for 1 hour
    });

    // Handle Rate Limiting gracefully
    if (response.status === 429) {
      console.warn('Rate limited (429) by Forex Factory. Returning cached data if available.');
      return cachedData || [];
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Data is not an array');
    }

    const mappedData = data.map((item: any) => {
      const dateStr = item.date || '';
      let timeStr = 'All Day';
      
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          timeStr = d.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
        }
      }

      const country = item.country || '';
      const currency = item.currency || COUNTRY_TO_CURRENCY[country] || country;

      return {
        date: dateStr,
        time: timeStr,
        currency: currency.toUpperCase(),
        impact: normalizeImpact(item.impact),
        title: item.title || 'Economic Event',
        forecast: item.forecast || '',
        previous: item.previous || '',
        actual: item.actual || '',
        country: country,
      };
    });

    // Update Cache
    cachedData = mappedData;
    lastFetchTime = now;
    
    return mappedData;

  } catch (error) {
    console.error('Failed to fetch JSON feed:', error);
    // Fallback to cache if request fails completely
    return cachedData || [];
  }
}

export async function fetchEconomicCalendarForWeek(weekOffset: number): Promise<CalendarEvent[]> {
  // The JSON feed only provides the current week.
  if (weekOffset !== 0) return [];
  return await fetchJSONFeed();
}

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  return await fetchJSONFeed();
}

export async function isEconomicCalendarConfigured(): Promise<boolean> {
  return true;
}