'use server';

import { EconomicEvent } from '@/lib/types';
import { toISODateString } from '@/lib/date-utils';

const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Interest Rate', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'Crude Oil Inventories', 'Consumer Confidence', 'JOLTs',
  'Bank of England', 'ECB', 'Meeting Minutes', 'Policy', 'Inflation',
  'Employment Change', 'Jobless Claims', 'PMI', 'Rate Statement', 'Non-Farm'
];

const MEDIUM_IMPACT_KEYWORDS = [
  'Durable Goods', 'Housing Starts', 'Existing Home Sales', 'New Home Sales',
  'ADP', 'Trade Balance', 'Factory Orders', 'Building Permits', 'Michigan', 
  'PCE', 'Import Price', 'Export Price', 'Wholesale', 'Industrial Production', 
  'Capacity Utilization', 'Leading Index', 'Budget Balance', 'Current Account'
];

const IGNORED_KEYWORDS = [
  'Bill Auction', 'Note Auction', 'Bond Auction', 'Tips Auction', 
  'Mortgage Market', 'MBA', 'Redbook', 'API Weekly', 'Rig Count',
  'Gasoline', 'Heating Oil', 'Cushing', 'Distillate', '3-Month', '6-Month',
  '4-Week', '8-Week', '52-Week', 'Wasde', 'Natural Gas Storage',
  'Challenger Job Cuts', 'Chain Store', 'Baskin', 'Money Supply',
  'Settlement Price', 'HICP', 'Labor Costs', 'Production Price Index'
];

const COUNTRY_CODES: Record<string, string> = {
  'United States': 'US', 'Euro Zone': 'EU', 'United Kingdom': 'GB',
  'Japan': 'JP', 'Canada': 'CA', 'Australia': 'AU', 'China': 'CN',
  'Switzerland': 'CH', 'New Zealand': 'NZ', 'Germany': 'DE', 'France': 'FR',
  'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL', 'India': 'IN',
  'Brazil': 'BR', 'Mexico': 'MX', 'South Korea': 'KR'
};

const CURRENCY_MAP: Record<string, string> = {
  'United States': 'USD', 'Euro Zone': 'EUR', 'United Kingdom': 'GBP',
  'Japan': 'JPY', 'Canada': 'CAD', 'Australia': 'AUD', 'China': 'CNY',
  'Switzerland': 'CHF', 'New Zealand': 'NZD', 'Germany': 'EUR', 'France': 'EUR',
  'Italy': 'EUR', 'Spain': 'EUR', 'Netherlands': 'EUR', 'India': 'INR',
  'Brazil': 'BRL', 'Mexico': 'MXN', 'South Korea': 'KRW'
};

function calculateImpact(title: string): 'High' | 'Medium' | 'Low' {
  const t = title.toLowerCase();
  if (HIGH_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return 'High';
  if (MEDIUM_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return 'Medium';
  return 'Low';
}

function shouldFilterOut(title: string): boolean {
  const t = title.toLowerCase();
  return IGNORED_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}

function sanitizeValue(val: string | null | undefined): string | null {
  if (!val) return null;
  // Strip HTML and entities
  const clean = val.replace(/<[^>]*>?/gm, '').replace(/&[a-z0-9#]+;/gi, '').trim();
  // Check if it's a reasonable numeric/percent string (e.g. 5.2%, 250k, 1.2M, -0.1)
  if (/^-?\d*\.?\d+%?k?m?b?t?$/i.test(clean)) return clean;
  return null;
}

export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  const results: Record<string, EconomicEvent[]> = {};
  const datesToFetch: string[] = [];

  for (const date of dates) {
    const cached = CACHE[date];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      results[date] = cached.data;
    } else {
      datesToFetch.push(date);
    }
  }

  if (datesToFetch.length === 0) return results;

  await Promise.all(datesToFetch.map(async (date) => {
    try {
      const events = await fetchEventsForDate(date);
      results[date] = events;
      CACHE[date] = { data: events, timestamp: Date.now() };
    } catch (error) {
      console.error(`Error fetching economic calendar for ${date}:`, error);
      results[date] = [];
    }
  }));

  return results;
}

async function fetchEventsForDate(dateStr: string): Promise<EconomicEvent[]> {
  try {
    // NASDAQ API often returns data for the day AFTER the requested date in UTC.
    // We shift the query date forward by 1 to align with the intended display date.
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    const queryDate = toISODateString(d);

    const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${queryDate}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) return [];
    const json = await response.json();
    if (!json.data?.rows) return [];

    return json.data.rows
      .filter((row: any) => row.eventName && !shouldFilterOut(row.eventName))
      .map((row: any) => {
        // Normalize Time: Prefer row.time, then row.gmt, then "All Day"
        let timeStr = row.time || row.gmt || 'All Day';
        if (timeStr === '24H' || !timeStr.trim()) timeStr = 'All Day';

        const country = row.country || 'United States';
        const countryCode = COUNTRY_CODES[country] || 'US';
        const currency = CURRENCY_MAP[country] || 'USD';
        const title = row.eventName || 'Event';
        const impact = calculateImpact(title);

        // Stable ID based on content
        const id = Buffer.from(`${dateStr}-${title}-${countryCode}-${timeStr}`).toString('base64').slice(0, 16);

        // Timestamp for sorting
        let timestamp = new Date(`${dateStr}T00:00:00Z`).getTime();
        if (timeStr.includes(':')) {
          const [h, m] = timeStr.split(':');
          const dateObj = new Date(`${dateStr}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00Z`);
          if (!isNaN(dateObj.getTime())) timestamp = dateObj.getTime();
        }

        return {
          id,
          date: dateStr,
          time: timeStr,
          country: countryCode, 
          currency: currency,
          impact: impact, 
          title: title,
          actual: sanitizeValue(row.actual),
          forecast: sanitizeValue(row.consensus),
          previous: sanitizeValue(row.previous),
          timestamp
        };
      });
  } catch {
    return [];
  }
}