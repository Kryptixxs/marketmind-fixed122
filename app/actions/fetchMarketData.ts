'use server';

import yahooFinance from 'yahoo-finance2';
import { OHLCV } from '@/lib/marketdata/types';

yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  history: OHLCV[];
  name?: string;
}

export async function fetchMarketDataBatch(symbols: string[], interval: "1m"|"2m"|"5m"|"15m"|"30m"|"60m"|"1d" = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  try {
    const results = await Promise.all(symbols.map(async (sym) => {
      try {
        // Fetch REAL historical candles so the AI has actual data to look at
        const chart = await yahooFinance.chart(sym, { interval: interval as any, range: '5d' });
        
        if (!chart || !chart.quotes || chart.quotes.length === 0) return null;

        const meta = chart.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || price;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        // Map real Yahoo Finance quotes to our internal OHLCV format
        const history: OHLCV[] = chart.quotes
          .filter(q => q.open !== null && q.close !== null)
          .map(q => ({
            timestamp: q.date.getTime(),
            open: q.open as number,
            high: q.high as number,
            low: q.low as number,
            close: q.close as number,
            volume: q.volume || 0
          }));

        return {
          symbol: sym,
          name: meta.shortName || meta.symbol || sym,
          price,
          change,
          changePercent,
          currency: meta.currency || 'USD',
          marketState: 'REGULAR',
          history
        };
      } catch (e) {
        console.error(`[MarketData] Failed to fetch real data for ${sym}:`, e);
        return null;
      }
    }));

    return results;
  } catch (error) {
    console.error("[MarketData] Batch quote fetch failed", error);
    return [];
  }
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval as any);
  return batch.length > 0 ? batch[0] : null;
}