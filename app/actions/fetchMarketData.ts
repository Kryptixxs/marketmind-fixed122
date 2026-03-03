'use server';

import { OHLCV } from '@/lib/marketdata/types';
import yahooFinance from 'yahoo-finance2';

// Configure yahoo-finance2 to suppress non-critical warnings
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

// Map our clean UI symbols to Yahoo Finance specific tickers
// Using Futures (=F) for indices/commodities to ensure 24/5 real-time data
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
  
  // Yahoo Finance accepts standard intervals: 1m, 5m, 15m, 60m, 1d
  const yfInterval = interval.toLowerCase() === '1h' ? '60m' : interval.toLowerCase();
  
  // Set appropriate range based on interval to avoid Yahoo API limits
  // (e.g., 1m data is only available for the last 7 days)
  let range = '5d';
  if (yfInterval === '1d') range = '1mo';
  if (yfInterval === '1m') range = '3d';

  try {
    const results = await Promise.all(symbols.map(async (sym) => {
      try {
        const yfSym = YF_MAP[sym] || sym;
        
        const queryOptions: any = { 
          interval: yfInterval, 
          range: range 
        };

        const chart = await yahooFinance.chart(yfSym, queryOptions);
        
        if (!chart || !chart.quotes || chart.quotes.length === 0) {
          console.warn(`[Yahoo] No data returned for ${yfSym}`);
          return null;
        }

        const meta = chart.meta;
        const quotes = chart.quotes.filter(q => q.close !== null && q.close !== undefined);
        
        if (quotes.length === 0) return null;

        // Determine current price and change
        // Prefer meta.regularMarketPrice, fallback to the last candle's close
        const currentPrice = meta.regularMarketPrice || quotes[quotes.length - 1].close;
        const prevClose = meta.chartPreviousClose || quotes[0].close || currentPrice;
        
        const change = currentPrice - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        // Map Yahoo quotes to our internal OHLCV format
        const history: OHLCV[] = quotes.map(q => ({
          timestamp: q.date.getTime(),
          open: q.open as number,
          high: q.high as number,
          low: q.low as number,
          close: q.close as number,
          volume: q.volume || 0
        }));

        return {
          symbol: sym, // Return the clean UI symbol
          name: meta.shortName || meta.longName || sym,
          price: currentPrice,
          change,
          changePercent,
          currency: meta.currency || 'USD',
          marketState: meta.currentTradingPeriod?.pre?.hasEvents ? 'PRE' : 'REGULAR',
          history
        };
      } catch (e) {
        console.error(`[MarketData] Exception fetching ${sym} from Yahoo:`, (e as Error).message);
        return null;
      }
    }));

    return results;
  } catch (error) {
    console.error("[MarketData] Batch quote fetch failed", error);
    return [];
  }
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}