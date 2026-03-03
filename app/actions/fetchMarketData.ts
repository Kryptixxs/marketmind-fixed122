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

// Map our internal symbols EXACTLY to the TradingView CFD/Forex symbols you see on the charts
const TV_MAP: Record<string, string> = {
  '^NDX': 'PEPPERSTONE:NAS100',
  '^GSPC': 'BLACKBULL:SPX500',
  '^DJI': 'PEPPERSTONE:US30',
  '^RUT': 'IG:RUSSELL',
  'CL=F': 'TVC:USOIL',
  'GC=F': 'PEPPERSTONE:XAUUSD',
  'EURUSD=X': 'FX:EURUSD',
  'BTC-USD': 'BINANCE:BTCUSDT',
  'ETH-USD': 'BINANCE:ETHUSDT',
  'AAPL': 'NASDAQ:AAPL',
  'MSFT': 'NASDAQ:MSFT',
  'NVDA': 'NASDAQ:NVDA',
  'TSLA': 'NASDAQ:TSLA',
  '^VIX': 'CBOE:VIX',
  'DX-Y.NYB': 'TVC:DXY',
  '^TNX': 'TVC:US10Y',
  '^IRX': 'TVC:US03MY'
};

// TradingView requires querying different scanner endpoints based on the asset class
function getScannerType(ticker: string) {
  if (ticker.startsWith('BINANCE:') || ticker.startsWith('CRYPTO:')) return 'crypto';
  if (ticker.startsWith('FX:')) return 'forex';
  if (ticker.startsWith('PEPPERSTONE:') || ticker.startsWith('BLACKBULL:') || ticker.startsWith('TVC:') || ticker.startsWith('IG:')) return 'cfd';
  return 'america';
}

const BASE_PRICES: Record<string, number> = {
  '^NDX': 21050.25,
  '^GSPC': 5985.50,
  '^DJI': 44100.00,
  '^RUT': 2215.69,
  'CL=F': 75.45,
  'GC=F': 2715.80,
  'EURUSD=X': 1.0550,
  'BTC-USD': 95240.00,
  'ETH-USD': 3550.50,
  'AAPL': 225.52,
  'MSFT': 415.06,
  'NVDA': 135.13,
  'TSLA': 320.64,
  '^VIX': 14.52,
  'DX-Y.NYB': 106.20,
  '^TNX': 4.35,
  '^IRX': 4.53
};

function generateAnchoredHistory(currentPrice: number, prevClose: number, steps: number = 50): OHLCV[] {
  const history: OHLCV[] = [];
  const now = Date.now();
  const totalChange = currentPrice - prevClose;
  
  let cur = prevClose;
  for (let i = 0; i < steps; i++) {
    const stepDrift = totalChange / steps;
    const noise = (Math.random() - 0.5) * (currentPrice * 0.001);
    cur += stepDrift + noise;
    
    if (i === steps - 1) cur = currentPrice;
    
    history.push({
      timestamp: now - ((steps - 1 - i) * 15 * 60000),
      open: cur - noise,
      high: cur + Math.abs(noise),
      low: cur - Math.abs(noise),
      close: cur,
      volume: Math.floor(Math.random() * 10000)
    });
  }
  return history;
}

function generateFallbackData(symbol: string): MarketData {
  let basePrice = BASE_PRICES[symbol] || 150.00;
  return {
    symbol,
    name: `${symbol}`,
    price: basePrice,
    change: 0,
    changePercent: 0,
    currency: 'USD',
    marketState: 'SYNTHETIC',
    history: generateAnchoredHistory(basePrice, basePrice * 0.99, 50)
  };
}

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];

  const groups: Record<string, string[]> = { cfd: [], crypto: [], america: [], forex: [] };
  
  // Group the tickers so we query the correct TradingView databases
  symbols.forEach(sym => {
    const tvTicker = TV_MAP[sym] || (sym.includes('-') ? `CRYPTO:${sym.replace('-', '')}` : `NASDAQ:${sym}`);
    const scanner = getScannerType(tvTicker);
    groups[scanner].push(tvTicker);
  });

  try {
    // Fetch directly from TradingView's undocumented scanner API (No API keys needed, handles massive volume)
    const fetchPromises = Object.entries(groups).map(async ([scanner, tickers]) => {
      if (tickers.length === 0) return [];
      const res = await fetch(`https://scanner.tradingview.com/${scanner}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: { tickers },
          columns: ["name", "close", "change"]
        }),
        next: { revalidate: 0 } // Always bypass Next.js cache for live prices
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    });

    const resultsArray = await Promise.all(fetchPromises);
    const tvDataMap = new Map();

    // Flatten results and map them
    resultsArray.flat().forEach((item: any) => {
      const ticker = item.s;
      const [name, close, changePct] = item.d;
      tvDataMap.set(ticker, { name, close, changePct });
    });

    return symbols.map(sym => {
      const tvTicker = TV_MAP[sym] || (sym.includes('-') ? `CRYPTO:${sym.replace('-', '')}` : `NASDAQ:${sym}`);
      const tvData = tvDataMap.get(tvTicker);

      if (!tvData || !tvData.close) {
         return generateFallbackData(sym);
      }

      // Convert TradingView percentage change back to an absolute change value
      const price = tvData.close;
      const changePercent = tvData.changePct || 0;
      const prevClose = price / (1 + (changePercent / 100));
      const change = price - prevClose;

      return {
        symbol: sym,
        name: tvData.name || sym,
        price,
        change,
        changePercent,
        currency: 'USD',
        marketState: 'REGULAR',
        history: generateAnchoredHistory(price, prevClose, 50)
      };
    });

  } catch (error) {
    console.error("[MarketData] TV Scanner fetch failed", error);
    return symbols.map(sym => generateFallbackData(sym));
  }
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  const batch = await fetchMarketDataBatch([symbol], interval);
  return batch.length > 0 ? batch[0] : null;
}