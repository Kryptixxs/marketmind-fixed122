'use server';

import yahooFinance from 'yahoo-finance2';
import { resolveYahooSymbol } from '@/lib/instruments';

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistoricalBars(
  instrumentId: string, 
  range: string = '1y',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d'
): Promise<Bar[]> {
  const symbol = resolveYahooSymbol(instrumentId);
  
  try {
    const now = new Date();
    let period1 = new Date();
    
    // Adjust range based on interval to avoid requesting too much data for small timeframes
    if (interval === '1m') {
      period1.setDate(now.getDate() - 7); // Max 7 days for 1m
    } else if (interval === '5m' || interval === '15m') {
      period1.setDate(now.getDate() - 30); // Max 30 days for 5m/15m
    } else if (interval === '1h') {
      period1.setMonth(now.getMonth() - 3);
    } else {
      if (range === '1y') period1.setFullYear(now.getFullYear() - 1);
      else if (range === '2y') period1.setFullYear(now.getFullYear() - 2);
      else if (range === '5y') period1.setFullYear(now.getFullYear() - 5);
      else if (range === '6m') period1.setMonth(now.getMonth() - 6);
      else period1.setMonth(now.getMonth() - 1);
    }

    const result = await yahooFinance.chart(symbol, {
      period1,
      interval: interval as any,
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter(q => q.date && q.open !== undefined && q.high !== undefined && q.low !== undefined && q.close !== undefined)
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