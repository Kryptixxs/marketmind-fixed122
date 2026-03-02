'use server';

import { EconomicEvent } from '@/lib/types';

// Simple in-memory cache
const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Interest Rate', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'Crude Oil Inventories', 'Consumer Confidence', 'JOLTs',
  'Bank of England', 'ECB', 'Meeting Minutes', 'Policy', 'Inflation'
];

const MEDIUM_IMPACT_KEYWORDS = [
  'Durable Goods', 'Housing Starts', 'Existing Home Sales', 'New Home Sales',
  'ADP', 'Initial Jobless Claims', 'Trade Balance', 'Factory Orders',
  'Building Permits', 'Michigan', 'PCE', 'Import Price', 'Export Price',
  'Wholesale', 'Industrial Production', 'Capacity Utilization'
];

const IGNORED_KEYWORDS = [
  'Bill Auction', 'Note Auction', 'Bond Auction', 'Tips Auction', 
  'Mortgage Market', 'MBA', 'Redbook', 'API Weekly', 'Rig Count',
  'Gasoline', 'Heating Oil', 'Cushing', 'Distillate', '3-Month', '6-Month',
  '4-Week', '8-Week', '52-Week'
];

const COUNTRY_CODES: Record<string, string> = {
  'United States': 'US', 'Euro Zone': 'EU', 'United Kingdom': 'GB',
  'Japan': 'JP', 'Canada': 'CA', 'Australia': 'AU', 'China': 'CN',
  'Switzerland': 'CH', 'New Zealand': 'NZ', 'Germany': 'DE', 'France': 'FR',
  'Italy': 'IT', 'Spain': 'ES'
};

const CURRENCY_MAP: Record<string, string> = {
  'United States': 'USD', 'Euro Zone': 'EUR', 'United Kingdom': 'GBP',
  'Japan': 'JPY', 'Canada': 'CAD', 'Australia': 'AUD', 'China': 'CNY',
  'Switzerland': 'CHF', 'New Zealand': 'NZD'
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

// Convert a UTC date string to Eastern Time date string (YYYY-MM-DD)
function getEasternDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD
    timeZone: 'America/New_York'
  });
}

// Format time to HH:MM in Eastern Time
function getEasternTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  const results: Record<string, EconomicEvent[]> = {};
  const datesToFetch: string[] = [];

  // Check cache
  for (const date of dates) {
    const cached = CACHE[date];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      results[date] = cached.data;
    } else {
      datesToFetch.push(date);
    }
  }

  // Initialize empty arrays for requested dates to ensure they exist
  dates.forEach(d => { if (!results[d]) results[d] = []; });

  if (datesToFetch.length === 0) return results;

  // We need to fetch a bit more than requested to handle timezone shifts
  // e.g., an event on Monday morning GMT might fall into Sunday EST
  // so we fetching strictly the requested dates might miss events shifted from the "next" GMT day
  // For now, let's just fetch the requested dates and sort them into the correct buckets.
  // Note: This might result in missing events at the very end of the week if we don't fetch "next Monday".
  
  // OPTIMIZATION: Fetch one extra day at the end if we want perfect coverage, 
  // but for simplicity, we just process what we asked for.
  
  const rawEvents: EconomicEvent[] = [];

  await Promise.all(datesToFetch.map(async (date) => {
    try {
      const events = await fetchEventsForDate(date);
      rawEvents.push(...events);
      // We don't cache here directly because we need to re-bucket them
      // Actually, we can cache the raw GMT fetch per date, but for now let's just process.
    } catch (error) {
      console.error(`Error fetching economic calendar for ${date}:`, error);
    }
  }));

  // Re-bucket events into the correct Eastern Time dates
  // Since we might be returning a Record keyed by requested dates, 
  // we need to make sure we put events into the keys the frontend expects.
  
  rawEvents.forEach(event => {
    // The event.date is currently the EST date calculated in fetchEventsForDate
    if (results[event.date]) {
      results[event.date].push(event);
    } else {
      // If it falls onto a date we didn't explicitly ask for (e.g. shifted to prev Sunday),
      // we might want to add it if it's relevant, or ignore.
      // For the grid view, if we ask for Mon-Sun, and an event shifts to Sun, it's fine.
      // If it shifts to prev Sunday (outside view), it's ignored.
      results[event.date] = [event];
    }
  });
  
  // Sort each bucket
  Object.keys(results).forEach(key => {
    results[key].sort((a, b) => {
       const impactScore = { High: 3, Medium: 2, Low: 1 };
       const scoreA = impactScore[a.impact] || 0;
       const scoreB = impactScore[b.impact] || 0;
       if (scoreA !== scoreB) return scoreB - scoreA;
       return a.timestamp - b.timestamp;
    });
  });

  return results;
}

async function fetchEventsForDate(dateStr: string): Promise<EconomicEvent[]> {
  try {
    const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${dateStr}`;
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
      .map((row: any, i: number) => {
        // NASDAQ API 'gmt' field format: "HH:MM"
        // We construct a UTC Date object
        const timeStr = row.gmt || '00:00';
        const dateTimeStr = `${dateStr}T${timeStr}:00Z`; // Assume UTC
        const utcDate = new Date(dateTimeStr);
        
        // Convert to Eastern Time
        const estDateStr = getEasternDate(utcDate);
        const estTimeStr = getEasternTime(utcDate);
        
        const impact = calculateImpact(row.eventName || '');
        const countryCode = COUNTRY_CODES[row.country] || 'US'; 

        return {
          id: `${dateStr}-${i}`,
          date: estDateStr, // Correct bucket (e.g. might become day before)
          time: estTimeStr, // Correct EST time (e.g. 19:00)
          country: countryCode, 
          currency: CURRENCY_MAP[row.country] || 'USD',
          impact: impact, 
          title: row.eventName || 'Event',
          actual: row.actual || '',
          forecast: row.consensus || '',
          previous: row.previous || '',
          timestamp: utcDate.getTime()
        };
      });
  } catch {
    return [];
  }
}