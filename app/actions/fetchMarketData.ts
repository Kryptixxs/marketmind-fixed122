'use server';

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export async function fetchMarketData(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol) as any;
    
    if (!quote || typeof quote.regularMarketPrice === 'undefined') {
      console.warn(`No quote data for ${symbol}`);
      return null;
    }

    // Fetch 30-day history for sparkline
    let history: number[] = [];
    try {
      const queryOptions = { 
        period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        interval: '1d' as const 
      };
      const result = await yahooFinance.chart(symbol, queryOptions) as any;
      if (result?.quotes && Array.isArray(result.quotes)) {
        history = result.quotes
          .slice(-20)
          .map((item: any) => item.close)
          .filter((val: any) => typeof val === 'number' && !isNaN(val));
      }
    } catch (histError) {
      console.warn(`Could not fetch history for ${symbol}`);
    }
    
    const price = quote.regularMarketPrice ?? 0;
    const changePercent = quote.regularMarketChangePercent ?? 0;

    return {
      price,
      change: quote.regularMarketChange ?? 0,
      changePercent,
      history: history.length >= 2 ? history : [price, price],
      // Extra metadata
      currency: quote.currency ?? 'USD',
      marketState: quote.marketState ?? 'REGULAR',
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return null;
  }
}
