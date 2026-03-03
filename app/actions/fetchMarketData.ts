'use server';

import YahooFinance from 'yahoo-finance2';
import { OHLCV } from '@/lib/marketdata/types';

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

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

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  if (!symbol) return null;

  // Safe lookback windows to prevent YF API rejections on intraday data
  let days = 5;
  let yfInterval: any = '15m';

  switch(interval) {
    case '1m': days = 2; yfInterval = '1m'; break; // strictly under 7 days
    case '5m': days = 5; yfInterval = '5m'; break;
    case '15m': days = 10; yfInterval = '15m'; break;
    case '60m': days = 20; yfInterval = '60m'; break;
    case '1d': days = 300; yfInterval = '1d'; break;
    default: days = 10; yfInterval = '15m'; break;
  }

  try {
    // Fetch concurrently, but catch errors individually
    const quotePromise = yahooFinance.quote(symbol).catch(() => null);
    const historyPromise = yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      interval: yfInterval 
    }).catch((err) => {
      console.warn(`[Chart Error for ${symbol}]:`, err.message);
      return null;
    });

    const [quote, chartData] = await Promise.all([quotePromise, historyPromise]);
    
    if (!quote && !chartData) return null; // Complete failure

    let history: OHLCV[] = [];
    if (chartData?.quotes && Array.isArray(chartData.quotes)) {
      history = chartData.quotes
        .filter((q: any) => q.close !== null)
        .map((q: any) => ({
          timestamp: new Date(q.date).getTime(),
          open: q.open || q.close,
          high: q.high || q.close,
          low: q.low || q.close,
          close: q.close,
          volume: q.volume || 0
        }));
    }

    // Safely extract price
    const lastCandle = history.length > 0 ? history[history.length - 1] : null;
    const price = quote?.regularMarketPrice || chartData?.meta?.regularMarketPrice || lastCandle?.close || 0;
    
    // Calculate change safely
    const prevClose = chartData?.meta?.chartPreviousClose || (price * 0.99); // absolute fallback
    const change = quote?.regularMarketChange || (price - prevClose);
    const changePercent = quote?.regularMarketChangePercent || ((change / prevClose) * 100);

    return {
      symbol,
      name: quote?.shortName || quote?.longName || symbol,
      price,
      change,
      changePercent,
      currency: quote?.currency || chartData?.meta?.currency || 'USD',
      marketState: quote?.marketState || 'REGULAR',
      history
    };

  } catch (error) {
    console.warn(`[MarketData] Failed to fetch ${symbol}:`, error);
    return null;
  }
}

// Batch function to prevent front-end network queue flooding
export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  // Execute sequentially to be extra gentle to Yahoo Finance, or concurrently with Promise.all
  // We use Promise.all here for speed, but the server handles the pooling.
  return Promise.all(symbols.map(sym => fetchMarketData(sym, interval)));
}