'use server';

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

// Internal app symbols to Yahoo chart symbols
const YF_MAP: Record<string, string> = {
  'NAS100': 'NQ=F', 'SPX500': 'ES=F', 'US30': 'YM=F', 'CRUDE': 'CL=F', 'GOLD': 'GC=F',
  'EURUSD': 'EURUSD=X', 'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'VIX': '^VIX', 'DXY': 'DX-Y.NYB',
  'AAPL': 'AAPL', 'TSLA': 'TSLA', 'NVDA': 'NVDA', 'MSFT': 'MSFT'
};

function getRangeForInterval(interval: string) {
  switch (interval) {
    case '1m': return '1d';
    case '5m': return '5d';
    case '15m': return '5d';
    case '60m': return '1mo';
    case '1d': return '6mo';
    case '1wk': return '2y';
    case '1mo': return '5y';
    default: return '1mo';
  }
}

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  const results = await Promise.all(symbols.map(async (sym) => {
    try {
      // ---------------------------------------------------------
      // RAW OHLCV CHART INGESTION
      // We bypass the npm package to pull raw json arrays directly 
      // from the HTTP endpoint to feed our custom canvas charts.
      // ---------------------------------------------------------
      const yfSym = YF_MAP[sym] || sym;
      const range = getRangeForInterval(interval);
      const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=${interval}&range=${range}`;
      
      const yfRes = await fetch(yfUrl, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        next: { revalidate: 15 }
      });
      
      if (yfRes.ok) {
        const yfData = await yfRes.json();
        const result = yfData?.chart?.result?.[0];
        if (result && result.meta) {
          const meta = result.meta;
          const price = meta.regularMarketPrice;
          const prevClose = meta.previousClose;
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;

          let history: OHLCV[] = [];
          if (result.timestamp && result.indicators?.quote?.[0]) {
            const q = result.indicators.quote[0];
            history = result.timestamp.map((t: number, idx: number) => ({
              timestamp: t * 1000,
              open: q.open[idx] !== null ? q.open[idx] : price,
              high: q.high[idx] !== null ? q.high[idx] : price,
              low: q.low[idx] !== null ? q.low[idx] : price,
              close: q.close[idx] !== null ? q.close[idx] : price,
              volume: q.volume?.[idx] || 0
            })).filter((h: OHLCV) => h.close !== null);
          }

          return {
            symbol: sym,
            name: meta.shortName || sym,
            price,
            change,
            changePercent,
            currency: meta.currency || 'USD',
            marketState: meta.instrumentType === 'CRYPTOCURRENCY' ? '24/7' : 'REGULAR',
            history
          };
        }
      }

      return null;

    } catch (error) {
      console.warn(`[MarketData] Failed fetching ${sym}`);
      return null;
    }
  }));

  return results;
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}