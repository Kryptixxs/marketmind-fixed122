'use server';

import { EarningsEvent } from '@/lib/types';
import { makePrototypeEarnings } from '@/lib/prototype-data';

export async function fetchEarnings(dateStr: string): Promise<EarningsEvent[]> {
  return makePrototypeEarnings(dateStr);
}
