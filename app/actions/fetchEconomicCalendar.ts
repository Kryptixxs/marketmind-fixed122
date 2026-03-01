'use server';

import { CalendarEvent } from '@/types/financial'; // We will define this type locally if not exists, but for now strict typing here.

export interface EconomicEvent {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm or "All Day"
  timestamp: number;  // Unix timestamp for sorting
  currency: string;
  country: string;
  impact: 'High' | 'Medium' | 'Low';
  title: string;
  actual: string;
  forecast: string;
  previous: string;
  source: string;
}

const COUNTRY_MAP: Record<string, string> = {
  'USA': 'USD', 'United States': 'USD', 'US': 'USD',
  'Euro Zone': 'EUR', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR',
  'United Kingdom': 'GBP', 'UK': 'GBP', 'Great Britain': 'GBP',
  'Japan': 'JPY', 'China': 'CNY', 'Australia': 'AUD', 'Canada': 'CAD',
  'New Zealand': 'NZD', 'Switzerland': 'CHF',
};

function determineImpact(title: string, country: string): 'High' | 'Medium' | 'Low' {
  const t = title.toLowerCase();
  
  // High Impact Keywords
  if (
    t.includes('interest rate') || 
    t.includes('rate decision') || 
    t.includes('non-farm') || 
    t.includes('payroll') || 
    t.includes('gdp') || 
    t.includes('cpi') || 
    t.includes('fomc') ||
    t.includes('unemployment rate')
  ) return 'High';

  // Medium Impact
  if (
    t.includes('pmi') || 
    t.includes('retail sales') || 
    t.includes('confidence') || 
    t.includes('sentiment') || 
    t.includes('trade balance') || 
    t.includes('ppi') ||
    t.includes('durable goods') ||
    t.includes('housing starts')
  ) return 'Medium';

  return 'Low';
}

async function fetchDayData(dateStr: string): Promise<EconomicEvent[]> {
  // Using Nasdaq API as the data source
  const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${dateStr}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) throw new Error(`Failed to fetch ${dateStr}: ${res.status}`);

    const json = await res.json();
    const rows = json?.data?.rows;

    if (!Array.isArray(rows)) return [];

    return rows.map((item: any, index: number) => {
      const country = item.country || 'Global';
      const currency = COUNTRY_MAP[country] || 'USD'; // Default to USD if unknown, or we could leave blank
      const title = item.eventName || 'Economic Event';
      const rawTime = item.gmt || '00:00';
      
      // Construct a pseudo-timestamp for sorting (Assuming EST for Nasdaq data usually)
      // This is rough but sufficient for intra-day sorting
      const [h, m] = rawTime.includes(':') ? rawTime.split(':') : ['0', '0'];
      const timestamp = new Date(dateStr).setHours(parseInt(h), parseInt(m), 0);

      return {
        id: `${dateStr}-${index}`,
        date: dateStr,
        time: rawTime,
        timestamp,
        country,
        currency,
        impact: determineImpact(title, country),
        title,
        actual: item.actual || '-',
        forecast: item.consensus || '-',
        previous: item.previous || '-',
        source: 'Nasdaq'
      };
    });
  } catch (e) {
    console.error(`Error fetching calendar for ${dateStr}`, e);
    return [];
  }
}

/**
 * Fetches economic calendar events for a specific array of date strings.
 * This ensures the server fetches exactly what the client requested.
 */
export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  const results: Record<string, EconomicEvent[]> = {};
  
  // Run fetches in parallel
  const promises = dates.map(async (date) => {
    const events = await fetchDayData(date);
    // Sort events by time within the day
    events.sort((a, b) => {
      // Prioritize High impact if times are equal
      if (a.time === b.time) {
         const impactScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
         return impactScore[b.impact] - impactScore[a.impact];
      }
      return a.time.localeCompare(b.time);
    });
    results[date] = events;
  });

  await Promise.all(promises);
  return results;
}