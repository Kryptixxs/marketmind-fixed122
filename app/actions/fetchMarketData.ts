'use server';

import yahooFinance from 'yahoo-finance2';
import { resolveYahooSymbol } from '@/lib/instruments';

// Configure yahoo-finance2 globally for server actions
yahooFinance.setGlobalConfig({
  queue: { concurrency: 4 },
  validation: { logErrors: false }
});

export interface MarketData {
  id: string;
  yahooSymbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  history: number[];
  name?: string;
  timestamp: number;
  stale: boolean;
  source: 'YAHOO' | 'SIMULATED';
}

export async function fetchMarketData(instrumentId: string): Promise<MarketData | null> {
  if (!instrumentId) return null;
  const symbol = resolveYahooSymbol(instrumentId);

  try {
    // Use a standard browser user-agent to avoid blocks
    const quote = await yahooFinance.quote(symbol, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!quote) return null;

    // Handle potential array response (though usually single object for string input)
    const q = Array.isArray(quote) ? quote[0] : quote;
    if (!q) return null;

    // Validate change percent
    let cp = q.regularMarketChangePercent || 0;
    
    if (Math.abs(cp) < 0.0001 && Math.abs(q.regularMarketChange || 0) > 0.01) {
       cp = ((q.regularMarketChange || 0) / (q.regularMarketPreviousClose || 1)) * 100;
    }

    return {
      id: instrumentId,
      yahooSymbol: symbol,
      name: q.shortName || q.longName || instrumentId,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: cp,
      currency: q.currency || 'USD',
      marketState: q.marketState || 'REGULAR',
      history: [], 
      timestamp: Date.now(),
      stale: false,
      source: 'YAHOO'
    };

  } catch (error) {
    console.warn(`[MarketData] Failed to fetch ${symbol}:`, error);
    return null;
  }
}