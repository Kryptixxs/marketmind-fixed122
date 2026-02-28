'use server';

export interface CalendarEvent {
  date: string;       // ISO string e.g. 2026-02-27T08:30:00-05:00
  time: string;       // Formatted time or "All Day"
  currency: string;
  impact: string;
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

// ---------- Forex Factory - Real, free data ----------
// Feed URL: https://nfs.faireconomy.media/ff_calendar_thisweek.json

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', 'United States': 'USD', USA: 'USD',
  EU: 'EUR', Eurozone: 'EUR', Germany: 'EUR', France: 'EUR', Italy: 'EUR', Spain: 'EUR',
  UK: 'GBP', 'United Kingdom': 'GBP', Britain: 'GBP',
  Japan: 'JPY', China: 'CNY', Australia: 'AUD', Canada: 'CAD', 'New Zealand': 'NZD',
  Switzerland: 'CHF', 'Hong Kong': 'HKD', 'South Korea': 'KRW', India: 'INR',
  Mexico: 'MXN', Brazil: 'BRL', 'South Africa': 'ZAR',
};

function normalizeImpact(impact: string): string {
  if (!impact) return 'Low';
  const lower = impact.toLowerCase();
  if (lower.includes('high') || lower === 'red') return 'High';
  if (lower.includes('medium') || lower.includes('med') || lower === 'orange') return 'Medium';
  return 'Low';
}

function formatEventTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'All Day';
    const hours = d.getHours();
    const mins = d.getMinutes();
    if (hours === 0 && mins === 0) return 'All Day';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return 'All Day';
  }
}

async function fetchForexFactoryCalendar(): Promise<CalendarEvent[]> {
  const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketMind/1.0)',
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const body = await response.json();
    if (!Array.isArray(body)) return [];

    return body.map((item: any) => {
      const dateStr = String(item.date ?? '').trim();
      const country = String(item.country ?? '');
      const currency = COUNTRY_TO_CURRENCY[country] ?? (String(item.currency ?? '').toUpperCase() || country);

      return {
        date: dateStr,
        time: dateStr ? formatEventTime(dateStr) : 'All Day',
        currency: currency || 'USD',
        impact: normalizeImpact(String(item.impact ?? '')),
        title: String(item.title ?? 'Economic Event'),
        forecast: String(item.forecast ?? ''),
        previous: String(item.previous ?? ''),
        actual: String(item.actual ?? ''),
        country: country || currency,
      };
    });
  } catch (error) {
    console.error('Forex Factory fetch error:', error);
    return [];
  }
}

export async function fetchEconomicCalendarForWeek(weekOffset: number): Promise<CalendarEvent[]> {
  // Forex Factory's "thisweek" JSON only covers the current week.
  if (weekOffset !== 0) {
    return [];
  }

  return await fetchForexFactoryCalendar();
}

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  return fetchEconomicCalendarForWeek(0);
}

export async function isEconomicCalendarConfigured(): Promise<boolean> {
  return true;
}

export async function filterTodayEvents(events: CalendarEvent[]): Promise<CalendarEvent[]> {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return events.filter((event) => {
    if (!event.date) return false;
    return event.date.startsWith(todayStr);
  });
}