'use server';

import { EconomicEvent } from '@/lib/types';

// Simple in-memory cache
const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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
    // NASDAQ Economic Calendar API
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
    
    // Validate structure
    if (!json.data || !json.data.rows || !Array.isArray(json.data.rows)) {
      return [];
    }

    return json.data.rows.map((row: any, i: number) => {
      // Clean values
      const actual = row.actual ? row.actual.toString().trim() : '-';
      const forecast = row.consensus ? row.consensus.toString().trim() : '-';
      const previous = row.previous ? row.previous.toString().trim() : '-';
      
      // Determine impact (NASDAQ doesn't always provide this explicitly in this endpoint, 
      // so we might default to 'Medium' or try to infer, but let's default to Medium/Low if missing)
      // Some rows might have star ratings or importance.
      // For now, we map everything to a safe default if missing.
      const impact = 'Medium'; 

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
        time: row.gmt || 'All Day',
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
        timestamp: new Date(`${dateStr}T${row.gmt || '00:00'}:00`).getTime()
      };
    });

  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}