'use server';

export interface CalendarEvent {
  date: string;       // ISO string for time display
  originalDate: string; // YYYY-MM-DD for column placement
  time: string;       // Formatted time or "All Day"
  currency: string;
  impact: string;     // Inferred
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'United States': 'USD', 'USA': 'USD', 'US': 'USD',
  'Euro Zone': 'EUR', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR',
  'United Kingdom': 'GBP', 'Great Britain': 'GBP', 'UK': 'GBP',
  'Japan': 'JPY', 'China': 'CNY', 'Australia': 'AUD', 'Canada': 'CAD',
  'New Zealand': 'NZD', 'Switzerland': 'CHF', 'India': 'INR', 'Brazil': 'BRL',
  'South Korea': 'KRW', 'Russia': 'RUB',
};

function inferImpact(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('rate decision') || t.includes('interest rate') || t.includes('non-farm') || t.includes('gdp') || t.includes('cpi') || t.includes('fomc') || t.includes('payroll')) return 'High';
  if (t.includes('pmi') || t.includes('sales') || t.includes('unemployment') || t.includes('sentiment') || t.includes('inventory') || t.includes('claims')) return 'Medium';
  return 'Low';
}

let cachedData: { weekKey: string, events: CalendarEvent[] } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000;

async function fetchNasdaqDay(dateStr: string): Promise<CalendarEvent[]> {
  const url = `https://api.nasdaq.com/api/calendar/economicevents?date=${dateStr}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
      },
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data?.data?.rows;
    if (!Array.isArray(rows)) return [];

    return rows.map((item: any) => {
      const country = item.country || 'Global';
      const timeText = item.gmt || 'All Day';
      let fullDateStr = dateStr;
      if (timeText.includes(':')) fullDateStr = `${dateStr}T${timeText}:00-05:00`;

      return {
        date: fullDateStr,
        originalDate: dateStr,
        time: timeText,
        currency: COUNTRY_TO_CURRENCY[country] || 'USD',
        impact: inferImpact(item.eventName || ''),
        title: item.eventName || 'Event',
        forecast: item.consensus || '',
        previous: item.previous || '',
        actual: item.actual || '',
        country
      };
    });
  } catch { return []; }
}

// Robust function to get the Monday of the current week (UTC based to avoid local shifts)
function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

function getWeekDates(offset: number) {
  const now = new Date();
  const monday = getMonday(now);
  monday.setDate(monday.getDate() + (offset * 7));
  
  const dates = [];
  for (let i = 0; i < 5; i++) { // Mon-Fri
    const temp = new Date(monday);
    temp.setDate(monday.getDate() + i);
    // Format YYYY-MM-DD manually to avoid timezone issues
    const y = temp.getFullYear();
    const m = String(temp.getMonth() + 1).padStart(2, '0');
    const d = String(temp.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
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
  const allEvents = results.flat().sort((a, b) => a.date.localeCompare(b.date));

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