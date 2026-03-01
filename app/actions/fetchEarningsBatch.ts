'use server';

import { fetchEarnings } from './fetchEarnings';

export interface EarningEvent {
  ticker: string;
  name: string;
  time: string;
  est: string;
  act: string;
  revenue_est?: string;
  revenue_act?: string;
  impact: number;
  date: string; // YYYY-MM-DD
}

export async function fetchEarningsBatch(dates: string[]): Promise<Record<string, EarningEvent[]>> {
  const results: Record<string, EarningEvent[]> = {};

  // Fetch in parallel
  const promises = dates.map(async (date) => {
    try {
      const data = await fetchEarnings(date);
      // Augment with the date so we can track it
      results[date] = data.map((item: any) => ({
        ...item,
        date,
        // Mocking revenue for now as the base fetcher didn't include it, 
        // in a real app this would come from the provider.
        revenue_est: (Math.random() * 10).toFixed(1) + 'B',
        revenue_act: Math.random() > 0.5 ? (Math.random() * 10).toFixed(1) + 'B' : '-',
      }));
    } catch (error) {
      console.error(`Error batch fetching earnings for ${date}`, error);
      results[date] = [];
    }
  });

  await Promise.all(promises);
  return results;
}