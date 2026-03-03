'use server';

import { EconomicEvent, Impact } from '@/lib/types';

const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const COUNTRY_MAP: Record<string, { code: string; currency: string }> = {
  'United States': { code: 'US', currency: 'USD' },
  'Euro Zone': { code: 'EU', currency: 'EUR' },
  'United Kingdom': { code: 'GB', currency: 'GBP' },
  'Japan': { code: 'JP', currency: 'JPY' },
  'Canada': { code: 'CA', currency: 'CAD' },
  'Australia': { code: 'AU', currency: 'AUD' },
  'China': { code: 'CN', currency: 'CNY' },
  'Switzerland': { code: 'CH', currency: 'CHF' },
  'New Zealand': { code: 'NZ', currency: 'NZD' },
  'Germany': { code: 'DE', currency: 'EUR' },
  'France': { code: 'FR', currency: 'EUR' },
  'Italy': { code: 'IT', currency: 'EUR' },
  'Spain': { code: 'ES', currency: 'EUR' },
  'Netherlands': { code: 'NL', currency: 'EUR' },
  'India': { code: 'IN', currency: 'INR' },
  'Brazil': { code: 'BR', currency: 'BRL' },
  'Mexico': { code: 'MX', currency: 'MXN' },
  'South Korea': { code: 'KR', currency: 'KRW' },
  'Sweden': { code: 'SE', currency: 'SEK' },
  'Norway': { code: 'NO', currency: 'NOK' },
  'Hong Kong': { code: 'HK', currency: 'HKD' },
  'Singapore': { code: 'SG', currency: 'SGD' },
};

const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Interest Rate', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'Crude Oil Inventories', 'Consumer Confidence', 'JOLTs',
  'Bank of England', 'ECB', 'Meeting Minutes', 'Policy', 'Inflation',
  'Employment Change', 'Jobless Claims', 'PMI', 'Rate Statement'
];

const MEDIUM_IMPACT_KEYWORDS = [
  'Durable Goods', 'Housing Starts', 'Existing Home Sales', 'New Home Sales',
  'ADP', 'Trade Balance', 'Factory Orders', 'Building Permits', 'Michigan', 
  'PCE', 'Import Price', 'Export Price', 'Wholesale', 'Industrial Production'
];

function calculateImpact(title: string): Impact {
  const t = title.toLowerCase();
  if (HIGH_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return 'High';
  if (MEDIUM_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return 'Medium';
  return 'Low';
}

function sanitizeValue(val: string | undefined): string | null {
  if (!val) return null;
  const clean = val.replace(/<[^>]*>?/gm, '').replace(/&[a-z0-9#]+;/gi, '').trim();
  const normalized = clean.replace(/\s+/g, ' ');
  const isNumeric = /^-?[\d,.]+[kMB%]?$/i.test(normalized);
  return isNumeric ? normalized : null;
}

function normalizeTime(time: string | undefined): string {
  const t = (time || '').trim().toUpperCase();
  if (!t || t === '24H' || t === 'ALL DAY') return 'All Day';
  if (t === 'TENTATIVE' || t === 'TBD') return 'TBD';
  
  // Handle "8:30 AM" or "2:15 PM" and convert to 24h "HH:mm"
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3];
    
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return t;
}

function generateStableId(date: string, time: string, title: string, country: string): string {
  const raw = `${date}-${time}-${title}-${country}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return raw;
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

    return json.data.rows.map((row: any) => {
      const time = normalizeTime(row.time);
      const countryInfo = COUNTRY_MAP[row.country] || { code: row.country || 'UN', currency: '---' };
      
      let sortTime = "00:00";
      if (time !== 'All Day' && time !== 'TBD' && time.includes(':')) {
        sortTime = time;
      }
      const timestamp = new Date(`${dateStr}T${sortTime}:00Z`).getTime();

      return {
        id: generateStableId(dateStr, time, row.eventName, countryInfo.code),
        date: dateStr,
        time: time,
        country: countryInfo.code,
        currency: countryInfo.currency,
        impact: calculateImpact(row.eventName || ''),
        title: (row.eventName || 'Unknown Event').trim(),
        actual: sanitizeValue(row.actual),
        forecast: sanitizeValue(row.consensus),
        previous: sanitizeValue(row.previous),
        timestamp: timestamp
      };
    }).sort((a: EconomicEvent, b: EconomicEvent) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}