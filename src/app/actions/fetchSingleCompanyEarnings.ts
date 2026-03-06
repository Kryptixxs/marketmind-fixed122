'use server';

import { EarningsEvent } from '@/lib/types';
import { makePrototypeEarnings } from '@/lib/prototype-data';

export async function fetchSingleCompanyEarnings(symbol: string): Promise<EarningsEvent | null> {
  const safeSymbol = symbol.toUpperCase().trim();
  if (!safeSymbol) return null;

  const today = new Date().toISOString().slice(0, 10);
  const match = makePrototypeEarnings(today).find((row) => row.ticker === safeSymbol);
  if (match) return match;

  return {
    id: `sim-single-${safeSymbol}-${today}`,
    ticker: safeSymbol,
    name: safeSymbol,
    date: today,
    time: 'tbd',
    epsEst: 1.05,
    epsAct: null,
    revEst: 18.4,
    revAct: null,
    surprise: null,
    sector: 'Technology',
    marketCap: '120B',
  };
}
