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
  let range = '5d';
  if (yfInterval === '1d') range = '1mo';
  if (yfInterval === '1m') range = '3d';

  // Extract unique Yahoo symbols to fetch
  const yfSyms = Array.from(new Set(symbols.map(sym => YF_MAP[sym] || sym)));
  
  // 1. BULK QUOTE FETCH
  // This grabs the live price for all 10+ symbols in exactly ONE network request.
  // This bypasses rate limits and guarantees the UI never shows "---"
  let quotesMap: Record<string, any> = {};
  try {
    const quotes = await yahooFinance.quoteCombine(yfSyms);
    quotes.forEach(q => { 
      quotesMap[q.symbol] = q; 
    });
  } catch (err) {
    console.warn('[MarketData] quoteCombine failed', err);
  }

  const results: (MarketData | null)[] = [];

  // 2. SEQUENTIAL HISTORY FETCH
  // We fetch history one by one so Yahoo doesn't block us.
  for (const sym of symbols) {
    const yfSym = YF_MAP[sym] || sym;
    const quote = quotesMap[yfSym];

    let history: OHLCV[] = [];
    let marketState = 'REGULAR';
    
    try {
      const chart = await yahooFinance.chart(yfSym, { interval: yfInterval as any, range });
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
          
        if (chart.meta?.currentTradingPeriod?.pre?.hasEvents) marketState = 'PRE';
        else if (chart.meta?.currentTradingPeriod?.post?.hasEvents) marketState = 'POST';
      }
    } catch (chartErr) {
      // Graceful degradation: History failed (rate limit), but we STILL have the live quote!
      console.warn(`[MarketData] History skipped for ${yfSym}`);
    }

    if (quote || history.length > 0) {
      // Safe fallback logic if one data source failed
      const price = quote?.regularMarketPrice || (history.length > 0 ? history[history.length - 1].close : 0);
      const prevClose = quote?.regularMarketPreviousClose || (history.length > 0 ? history[0].close : price);
      const change = quote?.regularMarketChange || (price - prevClose);
      const changePercent = quote?.regularMarketChangePercent || (prevClose > 0 ? (change / prevClose) * 100 : 0);

      results.push({
        symbol: sym,
        name: quote?.shortName || quote?.longName || sym,
        price,
        change,
        changePercent,
        currency: quote?.currency || 'USD',
        marketState: quote?.marketState || marketState,
        history
      });
    } else {
      results.push(null);
    }
    
    // 50ms micro-delay between history calls to prevent spiking the rate limiter
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return results;
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}