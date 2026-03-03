'use server';

import yahooFinance from 'yahoo-finance2';
import { resolveYahooSymbol } from '@/lib/instruments';

const yahooFinanceClient = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
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
    const quote = await yahooFinanceClient.quote(symbol);
    
    if (!quote) return null;

    // Validate change percent (Yahoo usually returns it as a percentage, e.g., 1.23 for 1.23%)
    // If it's a tiny fraction like 0.00123, we might need to normalize, but Yahoo is usually consistent.
    let cp = quote.regularMarketChangePercent || 0;
    
    // Basic sanity check: if change is huge but percent is tiny, or vice versa
    if (Math.abs(cp) < 0.0001 && Math.abs(quote.regularMarketChange || 0) > 0.01) {
       cp = ((quote.regularMarketChange || 0) / (quote.regularMarketPreviousClose || 1)) * 100;
    }

    return {
      id: instrumentId,
      yahooSymbol: symbol,
      name: quote.shortName || quote.longName || instrumentId,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: cp,
      currency: quote.currency || 'USD',
      marketState: quote.marketState || 'REGULAR',
      history: [], // History is fetched separately for charts
      timestamp: Date.now(),
      stale: false,
      source: 'YAHOO'
    };

  } catch (error) {
    console.warn(`[MarketData] Failed to fetch ${symbol}:`, error);
    return null;
  }
}