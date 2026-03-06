'use server';

import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { makeSimHistory, makeSimQuote } from '@/lib/prototype-data';

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

function isForex(sym: string): boolean {
  return ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'].includes(sym);
}

function toOHLCV(history: ReturnType<typeof makeSimHistory>): OHLCV[] {
  return history.map((b) => ({
    timestamp: b.timestamp,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));
}

export async function fetchSymbolCandles(symbol: string): Promise<OHLCV[]> {
  return toOHLCV(makeSimHistory(symbol, '15m', 180));
}

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols?.length) return [];

  return symbols.map((symbol) => {
    const q = makeSimQuote(symbol);
    return {
      symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      currency: isForex(symbol) ? symbol.slice(3) : 'USD',
      marketState: 'REGULAR',
      history: toOHLCV(makeSimHistory(symbol, interval, 180)),
    };
  });
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  if (!symbol) return null;
  const q = makeSimQuote(symbol);
  return {
    symbol,
    name: q.name,
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
    currency: isForex(symbol) ? symbol.slice(3) : 'USD',
    marketState: 'REGULAR',
    history: toOHLCV(makeSimHistory(symbol, interval, 220)),
  };
}
