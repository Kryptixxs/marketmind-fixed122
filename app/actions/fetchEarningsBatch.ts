'use server';

import { EarningsEvent } from '@/lib/types';

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'AMD', 'NFLX', 'INTC', 'JPM', 'BAC', 'GS', 'C', 'WMT', 'TGT', 'COST', 'KO', 'PEP', 'MCD'];
const SECTORS: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Communication', AMZN: 'Consumer Cyclical',
  NVDA: 'Technology', TSLA: 'Consumer Cyclical', META: 'Communication', AMD: 'Technology',
  NFLX: 'Communication', INTC: 'Technology', JPM: 'Financial', BAC: 'Financial',
  GS: 'Financial', C: 'Financial', WMT: 'Consumer Defensive', TGT: 'Consumer Defensive',
  COST: 'Consumer Defensive', KO: 'Consumer Defensive', PEP: 'Consumer Defensive', MCD: 'Consumer Cyclical'
};

function generateMockEarnings(dateStr: string): EarningsEvent[] {
  const seed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = 3 + (seed % 5);
  
  return Array.from({ length: count }).map((_, i) => {
    const ticker = TICKERS[(seed + i) % TICKERS.length];
    const epsEst = 2 + (seed % 50) / 10;
    const epsAct = Math.random() > 0.5 ? epsEst + (Math.random() - 0.4) : null;
    
    let surprise = null;
    if (epsAct !== null) {
      surprise = ((epsAct - epsEst) / Math.abs(epsEst)) * 100;
    }

    return {
      id: `${dateStr}-${ticker}`,
      ticker,
      name: `${ticker} Corp`,
      date: dateStr,
      time: i % 2 === 0 ? 'bmo' : 'amc',
      epsEst: parseFloat(epsEst.toFixed(2)),
      epsAct: epsAct ? parseFloat(epsAct.toFixed(2)) : null,
      revEst: parseFloat((10 + (seed % 100)).toFixed(2)),
      revAct: epsAct ? parseFloat((10 + (seed % 100) + (Math.random() - 0.5) * 5).toFixed(2)) : null,
      surprise: surprise ? parseFloat(surprise.toFixed(2)) : null,
      sector: SECTORS[ticker] || 'Unknown',
      marketCap: (100 + (seed % 900)).toString() + 'B'
    };
  });
}

export async function fetchEarningsBatch(dates: string[]): Promise<Record<string, EarningsEvent[]>> {
  const results: Record<string, EarningsEvent[]> = {};
  for (const date of dates) {
    results[date] = generateMockEarnings(date);
  }
  return results;
}