import { MarketData } from '@/app/actions/fetchMarketData';

interface CacheEntry {
  data: MarketData;
  timestamp: number;
  historyTimestamp: number;
}

const DEFAULT_QUOTE_TTL = 5_000;
const DEFAULT_HISTORY_TTL = 60_000;

class PriceCache {
  private cache = new Map<string, CacheEntry>();
  private quoteTtl: number;
  private historyTtl: number;

  constructor(quoteTtl = DEFAULT_QUOTE_TTL, historyTtl = DEFAULT_HISTORY_TTL) {
    this.quoteTtl = quoteTtl;
    this.historyTtl = historyTtl;
  }

  get(symbol: string, interval: string): { data: MarketData; needsQuote: boolean; needsHistory: boolean } | null {
    const key = `${symbol}:${interval}`;
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const needsQuote = now - entry.timestamp > this.quoteTtl;
    const needsHistory = now - entry.historyTimestamp > this.historyTtl;

    return { data: entry.data, needsQuote, needsHistory };
  }

  set(symbol: string, interval: string, data: MarketData, includesHistory: boolean) {
    const key = `${symbol}:${interval}`;
    const existing = this.cache.get(key);
    const now = Date.now();

    this.cache.set(key, {
      data: {
        ...data,
        history: includesHistory ? data.history : (existing?.data.history || []),
      },
      timestamp: now,
      historyTimestamp: includesHistory ? now : (existing?.historyTimestamp || 0),
    });
  }

  updatePrice(symbol: string, interval: string, price: number, change: number, changePercent: number) {
    const key = `${symbol}:${interval}`;
    const entry = this.cache.get(key);
    if (!entry) return;

    entry.data.price = price;
    entry.data.change = change;
    entry.data.changePercent = changePercent;
    entry.timestamp = Date.now();
  }

  getStale(symbol: string, interval: string): MarketData | null {
    const key = `${symbol}:${interval}`;
    return this.cache.get(key)?.data || null;
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

let instance: PriceCache | null = null;

export function getPriceCache(): PriceCache {
  if (!instance) {
    instance = new PriceCache();
  }
  return instance;
}

export type { PriceCache };
