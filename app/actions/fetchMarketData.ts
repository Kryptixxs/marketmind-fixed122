'use server';

import YahooFinance from 'yahoo-finance2';
import { resolveYahooSymbol } from '@/lib/instruments';

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
  history: number[];
  name?: string;
}

export async function fetchMarketData(instrumentId: string): Promise<MarketData | null> {
  if (!instrumentId) return null;
  const symbol = resolveYahooSymbol(instrumentId);

  try {
    const quotePromise = yahooFinance.quote(symbol);
    
    const historyPromise = yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      interval: '1d' 
    }).catch(() => null);

    const [quote, chartData] = await Promise.all([quotePromise, historyPromise]);
    
    if (!quote) return null;

    let history: number[] = [];
    if (chartData?.quotes && Array.isArray(chartData.quotes)) {
      history = chartData.quotes
        .slice(-20)
        .map((q: any) => q.close)
        .filter((c: any) => typeof c === 'number');
    }
    
    if (history.length === 0 && quote.regularMarketPrice) {
      history = [quote.regularMarketPrice, quote.regularMarketPrice];
    }

    return {
      symbol: instrumentId, // Return the ID as the symbol for UI consistency
      name: quote.shortName || quote.longName || instrumentId,
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