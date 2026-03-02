'use server';

import { EconomicEvent } from '@/lib/types';

const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Enhanced High Impact Keywords
const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Interest Rate', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'Crude Oil Inventories', 'Consumer Confidence', 'JOLTs',
  'Bank of England', 'ECB', 'Meeting Minutes', 'Policy', 'Inflation',
  'Employment Change', 'Jobless Claims', 'PMI', 'Rate Statement', 'Non-Farm'
];

// Medium Impact
const MEDIUM_IMPACT_KEYWORDS = [
  'Durable Goods', 'Housing Starts', 'Existing Home Sales', 'New Home Sales',
  'ADP', 'Trade Balance', 'Factory Orders', 'Building Permits', 'Michigan', 
  'PCE', 'Import Price', 'Export Price', 'Wholesale', 'Industrial Production', 
  'Capacity Utilization', 'Leading Index', 'Budget Balance', 'Current Account'
];

// Expanded Noise Filter
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

// Convert a UTC date to Eastern Time date string (YYYY-MM-DD)
function getEasternDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { 
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

  for (const date of dates) {
    const cached = CACHE[date];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      results[date] = cached.data;
    } else {
      datesToFetch.push(date);
    }
  }

  // Ensure all requested keys exist
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

  // Re-bucket events into the correct dates
  rawEvents.forEach(event => {
    if (results[event.date]) {
      results[event.date].push(event);
    } else {
      results[event.date] = [event];
    }
  });
  
  // Sort
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
        // Parse incoming time (assumed to be UTC/GMT based on NASDAQ usually)
        const timeStr = row.gmt || '00:00';
        const dateTimeStr = `${dateStr}T${timeStr}:00Z`;
        const utcDate = new Date(dateTimeStr);
        
        // Manual 1-day shift left as requested
        utcDate.setDate(utcDate.getDate() - 1);
        
        // Convert to Eastern Time
        const estDateStr = getEasternDate(utcDate);
        const estTimeStr = getEasternTime(utcDate);
        
        const impact = calculateImpact(row.eventName || '');
        const countryCode = COUNTRY_CODES[row.country] || 'US'; 

        return {
          id: `${dateStr}-${i}`,
          date: estDateStr,
          time: estTimeStr,
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