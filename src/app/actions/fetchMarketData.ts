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

// Map internal symbols to their exact Yahoo Finance Index/Futures equivalents
const YF_MAP: Record<string, string> = {
  // Indices
  'NAS100': '^NDX', 
  'SPX500': '^GSPC', 
  'US30': '^DJI', 
  'RUSSELL': '^RUT',
  'DAX40': '^GDAXI',
  'FTSE100': '^FTSE',
  'NIKKEI': '^N225',
  
  // Commodities
  'CRUDE': 'CL=F', 
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'NATGAS': 'NG=F',
  
  // Forex
  'EURUSD': 'EURUSD=X', 
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'JPY=X',
  'AUDUSD': 'AUDUSD=X',
  'USDCAD': 'CAD=X',
  
  // Crypto
  'BTCUSD': 'BTC-USD', 
  'ETHUSD': 'ETH-USD', 
  'SOLUSD': 'SOL-USD',
  
  // Vitals
  'VIX': '^VIX', 
  'DXY': 'DX-Y.NYB',
  'US10Y': '^TNX',
  
  // Equities
  'AAPL': 'AAPL', 
  'TSLA': 'TSLA', 
  'NVDA': 'NVDA', 
  'MSFT': 'MSFT'
};

/**
 * Returns the maximum valid range for a given interval to maximize candle count.
 */
function getRangeForInterval(interval: string) {
  switch (interval) {
    case '1m': return '7d';
    case '2m': return '60d';
    case '5m': return '60d';
    case '15m': return '60d';
    case '30m': return '60d';
    case '60m': return '730d';
    case '120m': return '730d';
    case '240m': return '730d';
    case '1d': return 'max';
    case '1wk': return 'max';
    case '1mo': return 'max';
    default: return '1mo';
  }
}

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  
  const results = await Promise.all(symbols.map(async (sym) => {
    try {
      const yfSym = YF_MAP[sym] || sym;
      const range = getRangeForInterval(interval);
      const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=${interval}&range=${range}`;
      
      const yfRes = await fetch(yfUrl, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        },
        next: { revalidate: 10 }
      });
      
      if (yfRes.ok) {
        const yfData = await yfRes.json();
        const result = yfData?.chart?.result?.[0];
        if (result && result.meta) {
          const meta = result.meta;
          const price = meta.regularMarketPrice;
          
          if (price == null) return null;
          
          const prevClose = meta.previousClose || price;
          const change = price - prevClose;
          const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

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