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

  // Ensure all requested keys exist in the result object
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
  // Since dates are shifted, they might land in a different bucket than they were fetched from
  rawEvents.forEach(event => {
    if (results[event.date]) {
      results[event.date].push(event);
    } else {
      // If we didn't ask for this date specifically but got data for it (due to shift),
      // we add it to the results map so the frontend can display it if it wants to.
      results[event.date] = [event];
    }
  });
  
  // Sort events within each day
  Object.keys(results).forEach(key => {
    results[key].sort((a, b) => {
       const impactScore = { High: 3, Medium: 2, Low: 1 };
       const scoreA = impactScore[a.impact] || 0;
       const scoreB = impactScore[b.impact] || 0;
       if (scoreA !== scoreB) return scoreB - scoreA;
       // Sort by time string "HH:MM"
       return a.time.localeCompare(b.time);
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
        // Use the raw time string from API (e.g. "08:30" or "14:00")
        // We assume this is already in the desired display timezone (EST) or close enough 
        // that the user prefers it over our calculated offset.
        let timeStr = row.gmt || '00:00';
        
        // Manual 1-day shift left logic
        // We create a Date object from the query date, subtract 1 day, and format it back to YYYY-MM-DD
        const d = new Date(`${dateStr}T00:00:00Z`);
        d.setDate(d.getDate() - 1);
        const shiftedDateStr = d.toISOString().split('T')[0];

        const impact = calculateImpact(row.eventName || '');
        const countryCode = COUNTRY_CODES[row.country] || 'US'; 

        return {
          id: `${dateStr}-${i}`,
          date: shiftedDateStr, // Shifted Date (-1 day)
          time: timeStr,        // Original Time (No timezone conversion)
          country: countryCode, 
          currency: CURRENCY_MAP[row.country] || 'USD',
          impact: impact, 
          title: row.eventName || 'Event',
          actual: row.actual || '',
          forecast: row.consensus || '',
          previous: row.previous || '',
          timestamp: 0 // Not strictly needed for grid view anymore
        };
      });
  } catch {
    return [];
  }
}