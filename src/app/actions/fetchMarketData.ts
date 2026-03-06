'use server';

import yahooFinance from 'yahoo-finance2';
import { OHLCV } from '@/features/MarketData/services/marketdata/types';

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
  'NAS100': '^NDX', 
  'SPX500': '^GSPC', 
  'US30': '^DJI', 
  'RUSSELL': '^RUT',
  'DAX40': '^GDAXI',
  'FTSE100': '^FTSE',
  'NIKKEI': '^N225',
  'CRUDE': 'CL=F', 
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'NATGAS': 'NG=F',
  'EURUSD': 'EURUSD=X', 
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'JPY=X',
  'BTCUSD': 'BTC-USD', 
  'ETHUSD': 'ETH-USD', 
  'VIX': '^VIX', 
  'DXY': 'DX-Y.NYB',
  'US10Y': '^TNX',
  'AAPL': 'AAPL', 
  'TSLA': 'TSLA', 
  'NVDA': 'NVDA', 
  'MSFT': 'MSFT'
};

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  const results = await Promise.all(symbols.map(async (sym) => {
    try {
      const yfSym = YF_MAP[sym] || sym;
      
      // Fetch both quote (for real-time price) and chart (for history)
      const [quote, chart] = await Promise.all([
        yahooFinance.quote(yfSym),
        yahooFinance.chart(yfSym, { interval: interval as any, period1: '1mo' })
      ]);

      if (!quote) return null;

      const price = quote.regularMarketPrice || quote.postMarketPrice || 0;
      const change = quote.regularMarketChange || 0;
      const changePercent = quote.regularMarketChangePercent || 0;

      let history: OHLCV[] = [];
      if (chart && chart.quotes) {
        history = chart.quotes.map((q: any) => ({
          timestamp: q.date.getTime(),
          open: q.open ?? price,
          high: q.high ?? price,
          low: q.low ?? price,
          close: q.close ?? price,
          volume: q.volume ?? 0
        })).filter((h: OHLCV) => h.close !== null);
      }

      return {
        symbol: sym,
        name: quote.shortName || quote.longName || sym,
        price,
        change,
        changePercent,
        currency: quote.currency || 'USD',
        marketState: quote.marketState || 'REGULAR',
        history
      };

    } catch (error) {
      console.warn(`[MarketData] Failed fetching ${sym}`, error);
      return null;
    }
  }));

  return results;
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}