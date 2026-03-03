'use server';

import { OHLCV } from '@/lib/marketdata/types';

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

// Provided Institutional API Key
const POLYGON_API_KEY = 'Educ3tK6ue_eC33G_3ERTMb0qc7wd3K6';

// Mapping our clean UI symbols to Polygon.io strict ticker formats
const POLY_MAP: Record<string, string> = {
  'NAS100': 'I:NDX',
  'SPX500': 'SPY',    // S&P 500 ETF proxy (avoids premium index restrictions)
  'US30': 'DIA',      // Dow Jones ETF proxy (avoids premium index restrictions)
  'CRUDE': 'USO',     // Oil ETF proxy
  'GOLD': 'GLD',      // Gold ETF proxy
  'EURUSD': 'C:EURUSD',
  'BTCUSD': 'X:BTCUSD',
  'ETHUSD': 'X:ETHUSD',
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'VIX': 'I:VIX',
  'DXY': 'UUP',       // USD Index proxy
};

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  // Convert standard intervals to Polygon format (multiplier + timespan)
  let multiplier = 15;
  let timespan = 'minute';
  if (interval === '1m') { multiplier = 1; timespan = 'minute'; }
  if (interval === '5m') { multiplier = 5; timespan = 'minute'; }
  if (interval === '60m' || interval === '1h') { multiplier = 1; timespan = 'hour'; }
  if (interval === '1d' || interval === '1D') { multiplier = 1; timespan = 'day'; }

  // Look back 5 days to ensure we have enough data to calculate changes and render charts
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 5);

  const fromStr = fromDate.toISOString().split('T')[0];
  const toStr = toDate.toISOString().split('T')[0];

  try {
    const results = await Promise.all(symbols.map(async (sym) => {
      try {
        const polySym = POLY_MAP[sym] || sym;
        
        // Fetch Aggregates (OHLCV) from Polygon.io
        const url = `https://api.polygon.io/v2/aggs/ticker/${polySym}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;
        
        const res = await fetch(url, { next: { revalidate: 0 } });
        
        if (!res.ok) {
          console.warn(`[Polygon] API rejected ${polySym}: ${res.status}`);
          return null;
        }

        const data = await res.json();
        
        if (!data.results || data.results.length === 0) return null;

        // If we used an ETF proxy for an index, scale the price back up so the UI looks correct
        let priceMultiplier = 1;
        if (sym === 'SPX500') priceMultiplier = 10;  // SPY is ~1/10th of SPX
        if (sym === 'US30') priceMultiplier = 100;   // DIA is ~1/100th of DJI

        const quotes = data.results;
        const currentCandle = quotes[quotes.length - 1];
        const currentPrice = currentCandle.c * priceMultiplier;

        // Calculate change against a candle roughly 24 hours ago
        const lookbackBars = Math.floor((24 * 60) / multiplier);
        const prevIndex = Math.max(0, quotes.length - lookbackBars);
        const prevClose = quotes[prevIndex].c * priceMultiplier;
        
        const change = currentPrice - prevClose;
        const changePercent = (change / prevClose) * 100;

        const history: OHLCV[] = quotes.map((q: any) => ({
          timestamp: q.t,
          open: q.o * priceMultiplier,
          high: q.h * priceMultiplier,
          low: q.l * priceMultiplier,
          close: q.c * priceMultiplier,
          volume: q.v || 0
        }));

        return {
          symbol: sym,
          name: sym,
          price: currentPrice,
          change,
          changePercent,
          currency: 'USD',
          marketState: 'REGULAR',
          history
        };
      } catch (e) {
        console.error(`[MarketData] Exception fetching ${sym}:`, e);
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