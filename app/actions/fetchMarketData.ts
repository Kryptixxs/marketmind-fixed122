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

export async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  if (!symbol) return null;

  try {
    const quotePromise = yahooFinance.quote(symbol);
    
    // Fetching 300 days to properly calculate the 200 EMA/SMA and deep market structure
    const historyPromise = yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
      interval: '1d' 
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