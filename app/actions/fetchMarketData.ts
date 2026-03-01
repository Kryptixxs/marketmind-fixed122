'use server';

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
  // Add a queue or delay if needed in a real high-volume app
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

export async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  if (!symbol) return null;

  try {
    const quotePromise = yahooFinance.quote(symbol);
    
    // We only need history for the sparkline, don't fail the whole request if this fails
    const historyPromise = yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      interval: '1d' 
    }).catch(() => null);

    const [quote, chartData] = await Promise.all([quotePromise, historyPromise]);
    
    if (!quote) return null;

    let history: number[] = [];
    if (chartData?.quotes && Array.isArray(chartData.quotes)) {
      history = chartData.quotes
        .slice(-20) // Last 20 days for sparkline
        .map((q: any) => q.close)
        .filter((c: any) => typeof c === 'number');
    }
    
    // Fill gaps if history is empty
    if (history.length === 0 && quote.regularMarketPrice) {
      history = [quote.regularMarketPrice, quote.regularMarketPrice];
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