'use server';

import { OHLCV } from '@/lib/marketdata/types';
import yahooFinance from 'yahoo-finance2';

// Suppress the survey notice in server logs
yahooFinance.suppressNotices(['yahooSurvey']);

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

const YF_MAP: Record<string, string> = {
  'NAS100': 'NQ=F', 'SPX500': 'ES=F', 'US30': 'YM=F', 'CRUDE': 'CL=F', 'GOLD': 'GC=F',
  'EURUSD': 'EURUSD=X', 'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'VIX': '^VIX', 'DXY': 'DX-Y.NYB',
  'AAPL': 'AAPL', 'TSLA': 'TSLA', 'NVDA': 'NVDA',
};

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  const yfInterval = interval.toLowerCase() === '1h' ? '60m' : interval.toLowerCase();
  const yfSyms = symbols.map(sym => YF_MAP[sym] || sym);
  
  const quotesMap: Record<string, any> = {};

  try {
    // 1. SAFE BULK FETCH: Get all live prices in exactly ONE request to avoid rate limits
    const quotes = await yahooFinance.quoteCombine(yfSyms);
    quotes.forEach(q => {
      quotesMap[q.symbol] = q;
    });
  } catch (bulkErr) {
    console.warn('[MarketData] Bulk fetch failed, attempting sequential fallback...', (bulkErr as Error).message);
    
    // 2. SEQUENTIAL FALLBACK: If bulk fails, try one-by-one to salvage whatever data we can
    for (const yfSym of yfSyms) {
      try {
        const q = await yahooFinance.quote(yfSym);
        quotesMap[q.symbol] = q;
      } catch (e) {
        console.error(`[MarketData] Failed to fetch quote for ${yfSym}`);
      }
    }
  }

  const results: (MarketData | null)[] = [];

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    const yfSym = yfSyms[i];
    const quote = quotesMap[yfSym];

    // STRICT RULE: If we don't have a real quote, return null. NO FAKE DATA.
    if (!quote || !quote.regularMarketPrice) {
      results.push(null);
      continue;
    }

    let history: OHLCV[] = [];
    
    // Safely attempt to fetch chart history for the sparklines
    try {
      const chart = await yahooFinance.chart(yfSym, { interval: yfInterval as any, range: '5d' });
      if (chart?.quotes) {
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
      // If history fails (rate limit), we ignore it. 
      // The UI will still render the live price perfectly, just without the squiggly line.
    }

    results.push({
      symbol: sym,
      name: quote.shortName || quote.longName || sym,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      currency: quote.currency || 'USD',
      marketState: quote.marketState || 'REGULAR',
      history
    });
  }

  return results;
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}