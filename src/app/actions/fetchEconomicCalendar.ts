'use server';

import { EconomicEvent } from '@/lib/types';

const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// STRICT Day Trading Liquidity Injectors (Tier 1)
const HIGH_IMPACT_KEYWORDS = [
  'CPI', 'Core CPI', 'PPI', 'Core PPI', 'Nonfarm Payroll', 'FOMC', 
  'Interest Rate Decision', 'Gross Domestic Product', 'GDP', 
  'ISM Manufacturing', 'ISM Services'
];

// Secondary movers that can cause intraday chop (Tier 2)
const MEDIUM_IMPACT_KEYWORDS = [
  'Jobless Claims', 'Retail Sales', 'PCE', 'Core PCE', 
  'Consumer Confidence', 'Crude Oil Inventories', 'JOLTs', 
  'Housing Starts', 'Building Permits', 'Existing Home Sales', 
  'New Home Sales', 'PMI', 'ADP Employment', 'ECB', 'Bank of England'
];

// Total noise for a day trader - completely filter these out
const IGNORED_KEYWORDS = [
  'Auction', 'Speaks', 'Speech', 'Redbook', 'Mortgage', 'MBA', 'API Weekly',
  'Wasde', 'Challenger', 'Baskin', 'HICP', 'Labor Costs', 'Reserves',
  'Current Account', 'Trade Balance', 'Export', 'Import', 'Capital Flow',
  'Foreign Investment', 'Money Supply', 'Bank Lending', 'Business Confidence',
  'Economic Sentiment', 'Machine Orders', 'Capacity Utilization', 'Baker Hughes',
  'EIA Natural Gas', 'Consumer Credit', 'Wholesale Inventories', 'Factory Orders'
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
  if (MEDIUM_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return 'Medium';
  return 'Low';
}

function shouldKeepEvent(title: string, countryCode: string): boolean {
  const t = title.toLowerCase();
  if (IGNORED_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return false;
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

  await Promise.all(datesToFetch.map(async (requestedDate) => {
    try {
      // Shift the requested date right by 1 day for the API query
      const d = new Date(requestedDate);
      d.setUTCDate(d.getUTCDate() + 1);
      const queryDate = d.toISOString().split('T')[0];

      const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${queryDate}`;
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
          const countryCode = COUNTRY_CODES[row.country] || row.country;

          return {
            id: `${requestedDate}-${i}`,
            date: requestedDate, 
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
      CACHE[requestedDate] = { data: dailyEvents, timestamp: Date.now() };
    } catch (error) {
      console.error(`Error fetching economic calendar for ${requestedDate}:`, error);
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

export type CalendarEvent = EconomicEvent;
export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  const batch = await fetchEconomicCalendarBatch(dates);
  return Object.values(batch).flat();
}