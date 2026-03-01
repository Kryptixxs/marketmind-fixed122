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
    
    if (!res.ok) return [];

    const data = await res.json();
    const rows = data?.data?.rows;
    if (!Array.isArray(rows)) return [];

    return rows.map((item: any) => {
      const country = item.country || 'Global';
      const title = item.eventName || 'Economic Event';
      const timeText = item.gmt || 'All Day';

      let fullDateStr = dateStr;
      if (timeText.includes(':')) {
        // Nasdaq uses ET. We use -05:00 to represent Eastern Standard Time.
        fullDateStr = `${dateStr}T${timeText}:00-05:00`;
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
    return [];
  }
}

function getWeekDates(offset: number) {
  const d = new Date();
  const day = d.getDay();
  // Calculate distance to Sunday (Sunday is 0)
  const diff = d.getDate() - day;
  d.setDate(diff + (offset * 7));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const temp = new Date(d);
    temp.setDate(d.getDate() + i);
    dates.push(temp.toISOString().split('T')[0]);
  }
  return dates;
}

export async function fetchEconomicCalendarForWeek(weekOffset: number): Promise<CalendarEvent[]> {
  const weekDates = getWeekDates(weekOffset);
  const weekKey = weekDates[0];

  const now = Date.now();
  if (cachedData && cachedData.weekKey === weekKey && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData.events;
  }

  const promises = weekDates.map(date => fetchNasdaqDay(date));
  const results = await Promise.all(promises);
  const allEvents = results.flat();
  
  allEvents.sort((a, b) => a.date.localeCompare(b.date));

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