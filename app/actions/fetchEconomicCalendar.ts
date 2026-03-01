'use server';

export interface CalendarEvent {
  date: string;       // ISO string
  time: string;       // Formatted time or "All Day"
  currency: string;
  impact: string;     // Inferred
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

// Map country names to currencies
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'United States': 'USD', 'USA': 'USD', 'US': 'USD',
  'Euro Zone': 'EUR', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR',
  'United Kingdom': 'GBP', 'Great Britain': 'GBP', 'UK': 'GBP',
  'Japan': 'JPY',
  'China': 'CNY',
  'Australia': 'AUD',
  'Canada': 'CAD',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'India': 'INR',
  'Brazil': 'BRL',
  'South Korea': 'KRW',
  'Russia': 'RUB',
};

// Heuristic to guess impact based on event title keywords
function inferImpact(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('rate decision') || t.includes('interest rate') || t.includes('non-farm') || t.includes('gdp') || t.includes('cpi') || t.includes('fomc') || t.includes('payroll') || t.includes('meeting')) {
    return 'High';
  }
  if (t.includes('pmi') || t.includes('sales') || t.includes('unemployment') || t.includes('sentiment') || t.includes('inventory') || t.includes('confidence') || t.includes('claims')) {
    return 'Medium';
  }
  return 'Low';
}

// In-Memory Cache
let cachedData: { weekKey: string, events: CalendarEvent[] } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 mins

async function fetchNasdaqDay(dateStr: string): Promise<CalendarEvent[]> {
  // dateStr format: YYYY-MM-DD
  const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${dateStr}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      console.warn(`Nasdaq API failed for ${dateStr}: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rows = data?.data?.rows;

    if (!Array.isArray(rows)) return [];

    return rows.map((item: any) => {
      // Nasdaq fields: "gmt", "country", "eventName", "actual", "consensus", "previous"
      const country = item.country || 'Global';
      const title = item.eventName || 'Economic Event';
      const timeText = item.gmt || 'All Day'; // usually HH:mm or 'Tentative'

      // Construct ISO date if time is available
      // Nasdaq provides time in GMT. We append 'Z' to treat it as UTC.
      let fullDateStr = dateStr;
      if (timeText.includes(':')) {
        fullDateStr = `${dateStr}T${timeText}:00Z`;
      }

      return {
        date: fullDateStr,
        time: timeText,
        currency: COUNTRY_TO_CURRENCY[country] || 'USD',
        impact: inferImpact(title),
        title,
        forecast: item.consensus || '',
        previous: item.previous || '',
        actual: item.actual || '',
        country
      };
    });

  } catch (err) {
    console.error(`Error fetching Nasdaq for ${dateStr}:`, err);
    return [];
  }
}

function getWeekDates(offset: number) {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun
  const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  
  // Apply week offset
  monday.setDate(monday.getDate() + (offset * 7));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export async function fetchEconomicCalendarForWeek(weekOffset: number): Promise<CalendarEvent[]> {
  const weekDates = getWeekDates(weekOffset);
  const weekKey = weekDates[0]; // cache key by monday date

  const now = Date.now();
  if (cachedData && cachedData.weekKey === weekKey && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData.events;
  }

  // Fetch all 7 days in parallel
  console.log(`Fetching Nasdaq Calendar for week of ${weekKey}...`);
  const promises = weekDates.map(date => fetchNasdaqDay(date));
  const results = await Promise.all(promises);
  
  const allEvents = results.flat();
  
  // Sort by date/time
  allEvents.sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  cachedData = { weekKey, events: allEvents };
  lastFetchTime = now;

  return allEvents;
}

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  return fetchEconomicCalendarForWeek(0);
}

export async function isEconomicCalendarConfigured(): Promise<boolean> {
  return true;
}