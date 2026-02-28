'use server';

import * as cheerio from 'cheerio';

export interface CalendarEvent {
  date: string;       // ISO string
  time: string;       // Formatted time or "All Day"
  currency: string;
  impact: string;     // Inferred for Yahoo
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

// Map Yahoo country codes to currencies
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'US': 'USD', 'United States': 'USD',
  'EMU': 'EUR', 'Eurozone': 'EUR', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR',
  'UK': 'GBP', 'United Kingdom': 'GBP', 'Great Britain': 'GBP',
  'Japan': 'JPY',
  'China': 'CNY',
  'Australia': 'AUD',
  'Canada': 'CAD',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'India': 'INR',
  'Brazil': 'BRL',
  'South Korea': 'KRW',
};

// Heuristic to guess impact based on event title keywords
function inferImpact(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('interest rate') || t.includes('non-farm') || t.includes('gdp') || t.includes('cpi') || t.includes('fomc') || t.includes('payroll')) {
    return 'High';
  }
  if (t.includes('pmi') || t.includes('sales') || t.includes('unemployment') || t.includes('sentiment') || t.includes('inventory')) {
    return 'Medium';
  }
  return 'Low';
}

// In-Memory Cache
let cachedData: { weekKey: string, events: CalendarEvent[] } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 mins

async function fetchYahooDay(dateStr: string): Promise<CalendarEvent[]> {
  // dateStr format: YYYY-MM-DD
  const url = `https://finance.yahoo.com/calendar/economic?day=${dateStr}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.warn(`Yahoo fetch failed for ${dateStr}: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const events: CalendarEvent[] = [];

    // Yahoo table rows are usually inside a <tbody>
    $('table tbody tr').each((_, el) => {
      const cols = $(el).find('td');
      if (cols.length < 5) return;

      const timeText = $(cols[0]).text().trim();
      const country = $(cols[1]).text().trim();
      const title = $(cols[2]).text().trim();
      const actual = $(cols[3]).text().trim(); // "Actual" column index varies sometimes, usually 3
      const forecast = $(cols[4]).text().trim(); // "Market Expectation"
      const previous = $(cols[5]).text().trim(); // "Prior"

      if (!title) return;

      // Construct a rough ISO date
      // timeText is usually "12:30 PM" or "Tentative"
      let fullDateStr = dateStr;
      if (timeText.includes(':')) {
        // Simple append, actual timezone handling ideally requires offset parsing
        // We'll treat it as EST/EDT usually for Yahoo US site, but let's just keep it simple string for UI
        fullDateStr = `${dateStr}T${convertTo24Hour(timeText)}`;
      }

      const currency = COUNTRY_TO_CURRENCY[country] || 'USD'; // Default fallback

      events.push({
        date: fullDateStr,
        time: timeText,
        currency,
        impact: inferImpact(title),
        title,
        forecast: forecast !== '-' ? forecast : '',
        previous: previous !== '-' ? previous : '',
        actual: actual !== '-' ? actual : '',
        country
      });
    });

    return events;

  } catch (err) {
    console.error(`Error scraping Yahoo for ${dateStr}:`, err);
    return [];
  }
}

function convertTo24Hour(time12h: string) {
  const [time, modifier] = time12h.split(' ');
  if (!time || !modifier) return '00:00:00';
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12);
  }
  return `${hours.padStart(2, '0')}:${minutes}:00`;
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

  // Check cache
  const now = Date.now();
  if (cachedData && cachedData.weekKey === weekKey && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedData.events;
  }

  // Fetch all 7 days in parallel
  console.log(`Fetching Yahoo Calendar for week of ${weekKey}...`);
  const promises = weekDates.map(date => fetchYahooDay(date));
  const results = await Promise.all(promises);
  
  const allEvents = results.flat();
  
  // Sort by date/time
  allEvents.sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  // Update Cache
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