'use server';

import { EarningsEvent } from '@/lib/types';
import { fetchEarnings } from './fetchEarnings';

export async function fetchEarningsBatch(dates: string[]): Promise<Record<string, EarningsEvent[]>> {
  const results: Record<string, EarningsEvent[]> = {};
  
  // Fetch in parallel
  const promises = dates.map(async (date) => {
    try {
      const data = await fetchEarnings(date);
      results[date] = data;
    } catch (error) {
      console.error(`Failed to fetch earnings for ${date}`, error);
      results[date] = [];
    }
  });
  
  await Promise.all(promises);
  return results;
}