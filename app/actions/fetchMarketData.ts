'use server';

import { OHLCV } from '@/lib/marketdata/types';
import yahooFinance from 'yahoo-finance2';

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

// Map our clean UI symbols to Yahoo Finance specific tickers
const YF_MAP: Record<string, string> = {
  'NAS100': 'NQ=F',     // Nasdaq 100 Futures
  'SPX500': 'ES=F',     // S&P 500 Futures
  'US30': 'YM=F',       // Dow Jones Futures
  'CRUDE': 'CL=F',      // Crude Oil Futures
  'GOLD': 'GC=F',       // Gold Futures
  'EURUSD': 'EURUSD=X',
  'BTCUSD': 'BTC-USD',
  'ETHUSD': 'ETH-USD',
  'VIX': '^VIX',
  'DXY': 'DX-Y.NYB',
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
};

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  const yfInterval = interval.toLowerCase() === '1h' ? '60m' : interval.toLowerCase();
  const results: (MarketData | null)[] = [];

  // Process sequentially to completely avoid Yahoo Finance 429 Too Many Requests
  for (const sym of symbols) {
    const yfSym = YF_MAP[sym] || sym;
    
    try {
      // 1. Fetch the lightweight, ultra-fast quote first.
      // This ensures the dashboard ALWAYS has a price, even if the history chart fails.
      const quote = await yahooFinance.quote(yfSym);
      
      let history: OHLCV[] = [];
      
      // 2. Safely attempt to fetch the history chart for the sparklines
      try {
        let period1 = new Date();
        if (yfInterval === '1mo') period1.setFullYear(period1.getFullYear() - 2);
        else if (yfInterval === '1d') period1.setMonth(period1.getMonth() - 2);
        else period1.setDate(period1.getDate() - 5);

        const chart = await yahooFinance.chart(yfSym, { 
          interval: yfInterval as any, 
          period1: Math.floor(period1.getTime() / 1000)
        });

        if (chart && chart.quotes) {
          history = chart.quotes
            .filter(q => q.close !== null && q.close !== undefined)
            .map(q => ({
              timestamp: q.date.getTime(),
              open: q.open as number,
              high: q.high as number,
              low: q.low as number,
              close: q.close as number,
              volume: q.volume || 0
            }));
        }
      } catch (chartErr) {
        console.warn(`[MarketData] Chart history rate-limited for ${yfSym}. Defaulting to quote-only.`);
      }

      results.push({
        symbol: sym,
        name: quote.shortName || quote.longName || sym,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        currency: quote.currency || 'USD',
        marketState: quote.marketState || 'REGULAR',
        history
      });

    } catch (quoteErr) {
      console.error(`[MarketData] Complete failure fetching ${sym}:`, (quoteErr as Error).message);
      results.push(null);
    }
    
    // Artificial 250ms delay between requests to appease Yahoo's rate limiter
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  return results;
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}