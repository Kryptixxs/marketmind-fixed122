'use server';

import yahooFinance from 'yahoo-finance2';

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistoricalBars(symbol: string, range: string = '1y'): Promise<Bar[]> {
  try {
    // Map range to period1
    const now = new Date();
    let period1 = new Date();
    
    if (range === '1y') period1.setFullYear(now.getFullYear() - 1);
    else if (range === '2y') period1.setFullYear(now.getFullYear() - 2);
    else if (range === '5y') period1.setFullYear(now.getFullYear() - 5);
    else period1.setMonth(now.getMonth() - 6);

    const result = await yahooFinance.chart(symbol, {
      period1,
      interval: '1d',
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter(q => q.date && q.open && q.high && q.low && q.close)
      .map(q => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume || 0,
      }));
  } catch (error) {
    console.error(`Failed to fetch historical bars for ${symbol}:`, error);
    return [];
  }
}