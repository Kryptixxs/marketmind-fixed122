'use server';

export interface CalendarEvent {
  date: string;
  time: string;
  currency: string;
  impact: string;
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  country: string;
}

function getCalendarUrlForWeek(weekOffset: number): string {
  const base = 'https://nfs.faireconomy.media/ff_calendar_';
  if (weekOffset === 1) return `${base}nextweek.json`;
  if (weekOffset === -1) return `${base}lastweek.json`;
  return `${base}thisweek.json`;
}

async function fetchCalendarFromUrl(url: string): Promise<CalendarEvent[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(url, {
    next: { revalidate: 1800 },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    date: item.date ?? '',
    time: item.date ? formatEventTime(item.date) : 'All Day',
    currency: item.currency ?? '',
    impact: normalizeImpact(item.impact),
    title: item.title ?? 'Unknown Event',
    forecast: item.forecast ?? '',
    previous: item.previous ?? '',
    actual: item.actual ?? '',
    country: item.country ?? item.currency ?? '',
  }));
}

/** Map API event dates (which may be wrong year) to the actual target week. Keeps time-of-day in source timezone (Eastern). */
function normalizeEventDatesToWeek(events: CalendarEvent[], weekOffset: number): CalendarEvent[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());
  const targetWeekStart = new Date(currentSunday);
  targetWeekStart.setDate(currentSunday.getDate() + weekOffset * 7);

  return events.map((event) => {
    if (!event.date) return event;
    try {
      const d = new Date(event.date);
      if (isNaN(d.getTime())) return event;
      const weekday = d.getDay();
      const timePart = event.date.includes('T') ? event.date.split('T')[1] ?? '' : '';
      const timeMatch = /^(\d{1,2}):(\d{2})/.exec(timePart);
      const hours = timeMatch ? parseInt(timeMatch[1], 10) : d.getUTCHours();
      const minutes = timeMatch ? parseInt(timeMatch[2], 10) : d.getUTCMinutes();
      const tzPart = timePart.includes('-') ? timePart.slice(timePart.indexOf('-')) : timePart.includes('+') ? timePart.slice(timePart.indexOf('+')) : '-05:00';

      const targetDate = new Date(targetWeekStart);
      targetDate.setDate(targetWeekStart.getDate() + weekday);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const normalizedDate = `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00${tzPart}`;
      return {
        ...event,
        date: normalizedDate,
        time: formatEventTime(normalizedDate),
      };
    } catch {
      return event;
    }
  });
}

// Fetch calendar for a given week offset: 0 = this week, 1 = next, -1 = last
export async function fetchEconomicCalendarForWeek(weekOffset: number): Promise<CalendarEvent[]> {
  try {
    const url = getCalendarUrlForWeek(weekOffset);
    const raw = await fetchCalendarFromUrl(url);
    return normalizeEventDatesToWeek(raw, weekOffset);
  } catch (error) {
    if (weekOffset !== 0) return [];
    console.error('Error fetching economic calendar:', error);
    return [];
  }
}

// Fetch this week's events from ForexFactory free calendar JSON
export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  return fetchEconomicCalendarForWeek(0);
}

// Filter events for today using local timezone
export async function filterTodayEvents(events: CalendarEvent[]): Promise<CalendarEvent[]> {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  return events.filter(event => {
    if (!event.date) return false;
    // The FF calendar dates are in format "2025-01-15T..." in EST/EDT
    // We compare the date portion directly
    return event.date.startsWith(todayStr) || 
           // Also handle MM-DD-YYYY format
           parseFFDate(event.date) === todayStr;
  });
}

function parseFFDate(dateStr: string): string {
  try {
    // ForexFactory dates look like "01-15-2025T14:30:00-0500"
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function formatEventTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'All Day';
    // Check if it's midnight (all day event)
    const hours = d.getHours();
    const mins = d.getMinutes();
    if (hours === 0 && mins === 0) return 'All Day';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return 'All Day';
  }
}

function normalizeImpact(impact: string): string {
  if (!impact) return 'Low';
  const lower = impact.toLowerCase();
  if (lower.includes('high') || lower === 'red') return 'High';
  if (lower.includes('medium') || lower.includes('med') || lower === 'orange') return 'Medium';
  return 'Low';
}
