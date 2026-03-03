'use server';

import yahooFinance from 'yahoo-finance2';
import { resolveYahooSymbol } from '@/lib/instruments';

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
    // We fetch the quote without global config to avoid module errors
    const quote = await yahooFinance.quote(symbol);
    
    if (!quote) return null;

    // Validate change percent
    let cp = quote.regularMarketChangePercent || 0;
    
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