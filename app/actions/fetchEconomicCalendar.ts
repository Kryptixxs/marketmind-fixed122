'use server';

import { EconomicEvent } from '@/lib/types';

// Simple in-memory cache
const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Keywords to identify High/Medium impact events
const HIGH_IMPACT_KEYWORDS = [
  'Nonfarm Payrolls', 'Unemployment Rate', 'CPI', 'PPI', 'GDP', 'FOMC', 
  'Fed Chair', 'Interest Rate Decision', 'Retail Sales', 'ISM Manufacturing', 
  'ISM Services', 'Crude Oil Inventories', 'Consumer Confidence', 'JOLTs'
];

const MEDIUM_IMPACT_KEYWORDS = [
  'Durable Goods', 'Housing Starts', 'Existing Home Sales', 'New Home Sales',
  'ADP Nonfarm', 'Initial Jobless Claims', 'Trade Balance', 'Factory Orders',
  'Building Permits', 'Michigan Consumer Sentiment', 'PCE'
];

const IGNORED_KEYWORDS = [
  'Bill Auction', 'Note Auction', 'Bond Auction', 'Tips Auction', 
  'Mortgage Market Index', 'MBA Mortgage', 'Redbook', 'API Weekly',
  'Weekly Economic', 'Atlanta Fed', 'Dallas Fed', 'Richmond Fed'
];

function calculateImpact(title: string): 'High' | 'Medium' | 'Low' {
  const t = title.toLowerCase();
  
  if (HIGH_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) {
    return 'High';
  }
  
  if (MEDIUM_IMPACT_KEYWORDS.some(k => t.includes(k.toLowerCase()))) {
    return 'Medium';
  }
  
  return 'Low';
}

function shouldFilterOut(title: string): boolean {
  const t = title.toLowerCase();
  return IGNORED_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}

export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  const results: Record<string, EconomicEvent[]> = {};
  const datesToFetch: string[] = [];

  // Check cache first
  for (const date of dates) {
    const cached = CACHE[date];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      results[date] = cached.data;
    } else {
      datesToFetch.push(date);
    }
  }

  if (datesToFetch.length === 0) {
    return results;
  }

  // Fetch missing dates in parallel
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

export async function fetchEconomicCalendar(dateStr?: string): Promise<EconomicEvent[]> {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const batch = await fetchEconomicCalendarBatch([date]);
    return batch[date] || [];
}

async function fetchEventsForDate(dateStr: string): Promise<EconomicEvent[]> {
  try {
    // NASDAQ Economic Calendar API usually returns ET
    const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${dateStr}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.warn(`NASDAQ API error: ${response.status} for ${dateStr}`);
      return [];
    }

    const json = await response.json();
    
    if (!json.data || !json.data.rows || !Array.isArray(json.data.rows)) {
      return [];
    }

    return json.data.rows
      .filter((row: any) => {
        if (!row.eventName) return false;
        // Filter out low impact junk
        return !shouldFilterOut(row.eventName);
      })
      .map((row: any, i: number) => {
        // NASDAQ gives us 'gmt' property but it is actually EST/EDT usually.
        // We will append ' ET' to time to make it clear in UI.
        const rawTime = row.gmt || 'All Day';
        const displayTime = rawTime === 'All Day' ? rawTime : `${rawTime} ET`;

        // Clean values
        const actual = row.actual ? row.actual.toString().trim() : '-';
        const forecast = row.consensus ? row.consensus.toString().trim() : '-';
        const previous = row.previous ? row.previous.toString().trim() : '-';
        
        // Calculate impact based on keywords since API doesn't provide it
        const impact = calculateImpact(row.eventName || '');

        // Calculate surprise if numeric
        let surprise = null;
        try {
          const actNum = parseFloat(actual.replace(/[^0-9.-]/g, ''));
          const forNum = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
          if (!isNaN(actNum) && !isNaN(forNum) && forNum !== 0) {
            surprise = ((actNum - forNum) / Math.abs(forNum)) * 100;
          }
        } catch {}

        return {
          id: `${dateStr}-${i}`,
          date: dateStr,
          time: displayTime,
          country: row.country || 'Global',
          currency: row.country === 'United States' ? 'USD' : 
                   row.country === 'Euro Zone' ? 'EUR' : 
                   row.country === 'United Kingdom' ? 'GBP' : 
                   row.country === 'Japan' ? 'JPY' : 
                   row.country === 'Canada' ? 'CAD' : 
                   row.country === 'Australia' ? 'AUD' : '-',
          impact: impact, 
          title: row.eventName || 'Economic Event',
          actual,
          forecast,
          previous,
          surprise,
          timestamp: new Date(`${dateStr}T${rawTime || '00:00'}:00`).getTime() // Approximate for sorting
        };
      })
      .sort((a: any, b: any) => {
        // Sort High impact first, then by time
        const impactScore = { High: 3, Medium: 2, Low: 1 };
        // @ts-ignore
        const scoreA = impactScore[a.impact] || 0;
        // @ts-ignore
        const scoreB = impactScore[b.impact] || 0;
        
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.timestamp - b.timestamp;
      });

  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}