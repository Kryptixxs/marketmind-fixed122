export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns a date string in YYYY-MM-DD format using local time.
 * This is crucial for matching the UI's perception of "today".
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Monday of the week for the given date.
 * Adjusts so that if it's Sunday, we show the week that is ending (or starting, depending on pref).
 * Standard business logic: Monday is start of week.
 */
export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

/**
 * Generates an array of 5 dates (Mon-Fri) starting from the provided reference date.
 */
export function getBusinessWeek(referenceDate: Date = new Date()): { date: Date; dateStr: string; dayName: string }[] {
  const monday = getMonday(referenceDate);
  const week = [];
  
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push({
      date: d,
      dateStr: toISODateString(d),
      dayName: DAYS[d.getDay()]
    });
  }
  return week;
}

/**
 * Formats a time string (e.g., "14:30") to a more readable format (e.g., "2:30 PM").
 */
export function formatTime(timeStr: string): string {
  if (!timeStr || timeStr === 'All Day') return 'All Day';
  
  // Check if it's already 12h format
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return timeStr;

  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}