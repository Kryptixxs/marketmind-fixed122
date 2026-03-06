'use server';

import { EconomicEvent } from '@/lib/types';
import { makePrototypeEconomicEvents } from '@/lib/prototype-data';

export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  return dates.reduce<Record<string, EconomicEvent[]>>((acc, date) => {
    acc[date] = makePrototypeEconomicEvents(date);
    return acc;
  }, {});
}

export type CalendarEvent = EconomicEvent;

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const batch = await fetchEconomicCalendarBatch(dates);
  return Object.values(batch).flat();
}
