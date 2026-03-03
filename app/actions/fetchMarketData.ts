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

  // Guarantee we request enough days to fill the math engine arrays (min 20 candles needed)
  let days = 10;
  let yfInterval: any = '15m';

  switch(interval) {
    case '1m': days = 5; yfInterval = '1m'; break; // max 7 days allowed by Yahoo
    case '5m': days = 15; yfInterval = '5m'; break;
    case '15m': days = 30; yfInterval = '15m'; break;
    case '60m': days = 50; yfInterval = '60m'; break;
    case '1d': days = 300; yfInterval = '1d'; break;
    default: days = 30; yfInterval = '15m'; break;
  }

  try {
    // Fetch concurrently, but catch errors individually so one failure doesn't kill the other
    const quotePromise = yahooFinance.quote(symbol).catch(() => null);
    const historyPromise = yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      interval: yfInterval 
    }).catch(() => null);

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

    // Safely extract price from quote, or fallback to the last chart candle
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