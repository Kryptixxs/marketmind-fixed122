'use server';

import { EconomicEvent } from '@/lib/types';

const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Keywords for High Impact (Red)
const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Interest Rate', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'Crude Oil Inventories', 'Consumer Confidence', 'JOLTs',
  'Bank of England', 'ECB', 'Meeting Minutes', 'Policy', 'Inflation'
];

// Keywords for Medium Impact (Orange)
const MEDIUM_IMPACT_KEYWORDS = [
  'Durable Goods', 'Housing Starts', 'Existing Home Sales', 'New Home Sales',
  'ADP', 'Initial Jobless Claims', 'Trade Balance', 'Factory Orders',
  'Building Permits', 'Michigan', 'PCE', 'Import Price', 'Export Price',
  'Wholesale', 'Industrial Production', 'Capacity Utilization'
];

// Noise to filter out entirely for day traders
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
        // NASDAQ API returns times in ET (Eastern Time).
        // Format is usually "HH:MM" 24-hour or AM/PM.
        // We will normalize to 12h format AM/PM for display.
        let displayTime = row.gmt || 'All Day'; 

        const impact = calculateImpact(row.eventName || '');
        const countryCode = COUNTRY_CODES[row.country] || 'US'; 

        return {
          id: `${dateStr}-${i}`,
          date: dateStr,
          time: displayTime, 
          country: countryCode, 
          currency: CURRENCY_MAP[row.country] || 'USD',
          impact: impact, 
          title: row.eventName || 'Event',
          actual: row.actual || '',
          forecast: row.consensus || '',
          previous: row.previous || '',
          timestamp: 0 // Not needed for grid view sorting
        };
      });
  } catch {
    return [];
  }
}