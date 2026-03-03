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

  // Determine lookback period based on interval to ensure we get enough candles for math
  let days = 10;
  let yfInterval: any = '15m';

  switch(interval) {
    case '1m': days = 2; yfInterval = '1m'; break;
    case '5m': days = 5; yfInterval = '5m'; break;
    case '15m': days = 10; yfInterval = '15m'; break;
    case '60m': days = 30; yfInterval = '60m'; break;
    case '1d': days = 300; yfInterval = '1d'; break;
    default: days = 10; yfInterval = '15m'; break;
  }

  try {
    const quotePromise = yahooFinance.quote(symbol);
    
    const historyPromise = yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      interval: yfInterval 
    }).catch(() => null);

    const [quote, chartData] = await Promise.all([quotePromise, historyPromise]);
    
    if (!quote) return null;

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

    return {
      symbol,
      name: quote.shortName || quote.longName || symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      currency: quote.currency || 'USD',
      marketState: quote.marketState || 'REGULAR',
      history
    };

  } catch (error) {
    console.warn(`[MarketData] Failed to fetch ${symbol}:`, error);
    return null;
  }
}