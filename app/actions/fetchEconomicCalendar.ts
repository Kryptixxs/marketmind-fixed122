'use server';

import { EconomicEvent } from '@/lib/types';

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

function sanitizeValue(val: string | undefined): string {
  if (!val) return '';
  // Strip HTML and entities
  const clean = val.replace(/<[^>]*>?/gm, '').replace(/&[a-z0-9#]+;/gi, '').trim();
  // Check if it's a reasonable numeric/percent string
  // Matches: 1.2, -0.5%, 100k, 50.5M, 1.23B
  const isReasonable = /^-?[\d,.]+[kMB%]?$/i.test(clean);
  return isReasonable ? clean : '';
}

function normalizeTime(time: string | undefined, gmt: string | undefined): string {
  const t = (time || gmt || '').trim().toUpperCase();
  if (!t || t === '24H' || t === 'ALL DAY') return 'All Day';
  return t;
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
      const events = await fetchEventsForDate(date);
      rawEvents.push(...events);
    } catch (error) {
      console.error(`Error fetching economic calendar for ${date}:`, error);
    }
  }));

  rawEvents.forEach(event => {
    if (results[event.date]) {
      results[event.date].push(event);
    } else {
      results[event.date] = [event];
    }
  });
  
  Object.keys(results).forEach(key => {
    results[key].sort((a, b) => {
       if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
       const impactScore = { High: 3, Medium: 2, Low: 1 };
       return (impactScore[b.impact] || 0) - (impactScore[a.impact] || 0);
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
      .map((row: any) => {
        const time = normalizeTime(row.time, row.gmt);
        
        // Manual 1-day shift left logic to match trading week grid
        const d = new Date(`${dateStr}T00:00:00Z`);
        d.setDate(d.getDate() - 1);
        const shiftedDateStr = d.toISOString().split('T')[0];

        // Calculate real timestamp for sorting
        let sortTime = "00:00";
        if (time !== 'All Day' && time.includes(':')) {
          sortTime = time;
        }
        const timestamp = new Date(`${shiftedDateStr}T${sortTime}:00Z`).getTime();

        const impact = calculateImpact(row.eventName || '');
        const countryCode = COUNTRY_CODES[row.country] || 'US'; 
        const currency = CURRENCY_MAP[row.country] || 'USD';

        // Stable ID generation
        const stableId = `${shiftedDateStr}-${row.eventName}-${countryCode}-${time}`.replace(/\s+/g, '-').toLowerCase();

        return {
          id: stableId,
          date: shiftedDateStr,
          time: time,
          country: countryCode, 
          currency: currency,
          impact: impact, 
          title: row.eventName || 'Event',
          actual: sanitizeValue(row.actual),
          forecast: sanitizeValue(row.consensus),
          previous: sanitizeValue(row.previous),
          timestamp: timestamp
        };
      });
  } catch {
    return [];
  }
}