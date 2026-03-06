'use server';

import { makePrototypeHistoricalPrints } from '@/lib/prototype-data';

export interface HistoricalPrint {
  date: string;
  actual: string;
  forecast: string;
}

export async function fetchEventHistory(eventName: string, country: string): Promise<HistoricalPrint[]> {
  return makePrototypeHistoricalPrints(`${eventName}:${country}`);
}
