'use server';

import { EconomicEvent } from '@/lib/types';

const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Strict Tier-1 Market Movers
const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Interest Rate', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'JOLTs', 'Bank of England', 'ECB', 'Meeting Minutes', 'PCE'
];

// Noise filters
const IGNORED_KEYWORDS = [
  'Bill Auction', 'Note Auction', 'Bond Auction', 'Tips Auction', 
  'Mortgage Market', 'MBA', 'Redbook', 'API Weekly', 'Rig Count',
  'Gasoline', 'Heating Oil', 'Cushing', 'Distillate', '3-Month', '6-Month',
  '4-Week', '8-Week', '52-Week', 'Wasde', 'Natural Gas Storage',
  'Challenger Job Cuts', 'Chain Store', 'Baskin', 'Money Supply',
  'Settlement Price', 'HICP', 'Labor Costs', 'Production Price Index',
  'HCOB', 'Buba', 'Foreign Exchange', 'Reserves'
];

const COUNTRY_CODES: Record<string, string> = {
  'United States': 'US', 'Euro Zone': 'EU', 'United Kingdom': 'GB',
  'Japan': 'JP', 'Canada': 'CA', 'Australia': 'AU', 'China': 'CN',
  'Switzerland': 'CH', 'New Zealand': 'NZ', 'Germany': 'DE', 'France': 'FR'
};

const CURRENCY_MAP: Record<string, string> = {
  'United States': 'USD', 'Euro Zone': 'EUR', 'United Kingdom': 'GBP',
  'Japan': 'JPY', 'Canada': 'CAD', 'Australia': 'AUD', 'China': 'CNY',
  'Switzerland': 'CHF', 'New Zealand': 'NZD', 'Germany': 'EUR', 'France': 'EUR'
};

// Use the exact country codes for filtering to avoid mismatching 'US' with 'United States'
const MAJOR_COUNTRY_CODES = Object.values(COUNTRY_CODES);

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateImpact(title: string): 'High' | 'Medium' | 'Low' {
  const t = title.toLowerCase();
  if (HIGH_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return 'High';
  return 'Medium'; 
}

function shouldKeepEvent(title: string, countryCode: string): boolean {
  const t = title.toLowerCase();
  
  // 1. Reject obvious noise
  if (IGNORED_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return false;
  
  // 2. Keep events only if they belong to a major economy code (US, EU, GB, etc.)
  if (!MAJOR_COUNTRY_CODES.includes(countryCode)) return false;

  return true;
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

  dates.forEach(d => { if (!results[d]) results[d] = []; });

  if (datesToFetch.length === 0) return results;

  const rawEvents: EconomicEvent[] = [];

  await Promise.all(datesToFetch.map(async (date) => {
    try {
      const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${date}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        },
        next: { revalidate: 3600 }
      });

      if (!response.ok) return;
      const json = await response.json();
      if (!json.data?.rows) return;

      const dailyEvents = json.data.rows
        .map((row: any, i: number) => {
          const rawTitle = row.eventName || '';
          const cleanTitle = cleanText(rawTitle);
          // If the country isn't in our map, fall back to the raw string so it gets filtered out
          const countryCode = COUNTRY_CODES[row.country] || row.country; 
          
          return {
            id: `${date}-${i}`,
            date: date,
            time: row.gmt || '00:00',
            country: countryCode, 
            currency: CURRENCY_MAP[row.country] || 'USD',
            impact: calculateImpact(cleanTitle), 
            title: cleanTitle,
            actual: cleanText(row.actual),
            forecast: cleanText(row.consensus),
            previous: cleanText(row.previous),
            timestamp: 0
          };
        })
        .filter((e: EconomicEvent) => shouldKeepEvent(e.title, e.country));

      rawEvents.push(...dailyEvents);
      CACHE[date] = { data: dailyEvents, timestamp: Date.now() };
    } catch (error) {
      console.error(`Error fetching economic calendar for ${date}:`, error);
    }
  }));

  rawEvents.forEach(event => {
    if (results[event.date]) {
      results[event.date].push(event);
    }
  });
  
  Object.keys(results).forEach(key => {
    results[key].sort((a, b) => {
       const impactScore = { High: 3, Medium: 2, Low: 1 };
       const scoreA = impactScore[a.impact] || 0;
       const scoreB = impactScore[b.impact] || 0;
       if (scoreA !== scoreB) return scoreB - scoreA;
       return a.time.localeCompare(b.time);
    });
  });

  return results;
}