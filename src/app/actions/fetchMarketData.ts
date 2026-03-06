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

const FINNHUB_MAP: Record<string, string> = {
  AAPL: 'AAPL', NVDA: 'NVDA', MSFT: 'MSFT', TSLA: 'TSLA', GOOGL: 'GOOGL', AMZN: 'AMZN', META: 'META', AMD: 'AMD',
  NFLX: 'NFLX', DIS: 'DIS', PYPL: 'PYPL', INTC: 'INTC', UBER: 'UBER', CRM: 'CRM', ORCL: 'ORCL', ADBE: 'ADBE',
  CSCO: 'CSCO', QCOM: 'QCOM', AVGO: 'AVGO', TXN: 'TXN',

  NAS100: 'QQQ', SPX500: 'SPY', US30: 'DIA', RUSSELL: 'IWM',
  DAX40: 'EWG', FTSE100: 'EWU', NIKKEI: 'EWJ', HSI: 'EWH', AS51: 'EWA',
  GOLD: 'GLD', SILVER: 'SLV', CRUDE: 'USO', NATGAS: 'UNG', COPPER: 'CPER', PLATINUM: 'PPLT',
  DXY: 'UUP', VIX: 'VIXY', US10Y: 'IEF', US2Y: 'SHY', MOVE: 'TLT',

  EURUSD: 'OANDA:EUR_USD',
  GBPUSD: 'OANDA:GBP_USD',
  USDJPY: 'OANDA:USD_JPY',
  AUDUSD: 'OANDA:AUD_USD',
  USDCAD: 'OANDA:USD_CAD',
  USDCHF: 'OANDA:USD_CHF',
  NZDUSD: 'OANDA:NZD_USD',

  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  SOLUSD: 'BINANCE:SOLUSDT',
  BNBUSD: 'BINANCE:BNBUSDT',
  XRPUSD: 'BINANCE:XRPUSDT',
  ADAUSD: 'BINANCE:ADAUSDT',
};

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';
const ALPHA_VANTAGE_KEY =
  process.env.ALPHA_VANTAGE_API_KEY ||
  process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ||
  'OJE4VGF4TELGHJF9';
const FMP_KEY =
  process.env.FMP_API_KEY ||
  process.env.NEXT_PUBLIC_FMP_API_KEY ||
  'dFov0xmsRSPiWM4wl5A1FcYe6ubsB8vH';

// --- Quote-only cache (lightweight, no history) ---
interface QuoteCache { price: number; change: number; changePercent: number; ts: number; }
const QUOTE_CACHE = new Map<string, QuoteCache>();
const QUOTE_TTL = 6_000;

// --- Candle cache (per-symbol, longer TTL) ---
interface CandleCache { history: OHLCV[]; ts: number; }
const CANDLE_CACHE = new Map<string, CandleCache>();
const CANDLE_TTL = 90_000;

let activeReqs = 0;
const MAX_CONCURRENT = 4;
const queue: Array<() => void> = [];

async function withConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (activeReqs >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => queue.push(resolve));
  }
  activeReqs++;
  try { return await fn(); }
  finally { activeReqs--; queue.shift()?.(); }
}

function isForex(sym: string) {
  return ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'].includes(sym);
}

function isCrypto(sym: string) {
  return ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD'].includes(sym);
}

function stockSymbol(sym: string): string | null {
  const mapped = FINNHUB_MAP[sym];
  if (!mapped) return sym;
  if (mapped.includes(':')) return null;
  return mapped;
}

const YAHOO_QUOTE_MAP: Record<string, string> = {
  NAS100: 'QQQ', SPX500: 'SPY', US30: 'DIA', RUSSELL: 'IWM',
  DAX40: 'EWG', FTSE100: 'EWU', NIKKEI: 'EWJ', HSI: 'EWH', AS51: 'EWA',
  GOLD: 'GLD', SILVER: 'SLV', CRUDE: 'USO', NATGAS: 'UNG', COPPER: 'CPER', PLATINUM: 'PPLT',
  DXY: 'UUP', VIX: 'VIXY', US10Y: 'IEF', US2Y: 'SHY', MOVE: 'TLT',
  BTCUSD: 'BTC-USD', ETHUSD: 'ETH-USD', SOLUSD: 'SOL-USD',
  BNBUSD: 'BNB-USD', XRPUSD: 'XRP-USD', ADAUSD: 'ADA-USD',
  EURUSD: 'EURUSD=X', GBPUSD: 'GBPUSD=X', USDJPY: 'JPY=X',
  AUDUSD: 'AUDUSD=X', USDCAD: 'USDCAD=X', USDCHF: 'USDCHF=X', NZDUSD: 'NZDUSD=X',
};

async function fetchYahooQuote(sym: string, now: number, cached?: QuoteCache): Promise<QuoteCache | null> {
  const ySym = YAHOO_QUOTE_MAP[sym] || sym;
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ySym)}`;
    const res = await withConcurrency(() => fetch(url).then(r => r.ok ? r.json() : null));
    const q = res?.quoteResponse?.result?.[0];
    if (!q || !Number.isFinite(q.regularMarketPrice) || q.regularMarketPrice <= 0) {
      return cached || null;
    }

    const entry: QuoteCache = {
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      ts: now,
    };
    QUOTE_CACHE.set(sym, entry);
    return entry;
  } catch {
    return cached || null;
  }
}

async function fetchAlphaVantageQuote(sym: string, now: number, cached?: QuoteCache): Promise<QuoteCache | null> {
  if (!ALPHA_VANTAGE_KEY) return cached || null;

  // AV GLOBAL_QUOTE works best for stock/ETF style symbols.
  const mapped = FINNHUB_MAP[sym] || sym;
  if (!/^[A-Z.]{1,12}$/.test(mapped)) return cached || null;

  try {
    const url =
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(mapped)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await withConcurrency(() => fetch(url).then(r => r.ok ? r.json() : null));
    const q = res?.['Global Quote'];

    const price = Number(q?.['05. price'] ?? 0);
    if (!Number.isFinite(price) || price <= 0) return cached || null;

    const change = Number(q?.['09. change'] ?? 0);
    const changePercentRaw = String(q?.['10. change percent'] ?? '').replace('%', '');
    const changePercent = Number(changePercentRaw || 0);

    const entry: QuoteCache = {
      price,
      change: Number.isFinite(change) ? change : 0,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
      ts: now,
    };
    QUOTE_CACHE.set(sym, entry);
    return entry;
  } catch {
    return cached || null;
  }
}

async function fetchFmpQuote(sym: string, now: number, cached?: QuoteCache): Promise<QuoteCache | null> {
  if (!FMP_KEY) return cached || null;

  const mapped = FINNHUB_MAP[sym] || sym;
  if (mapped.includes(':') || !/^[A-Z.]{1,12}$/.test(mapped)) return cached || null;

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(mapped)}?apikey=${FMP_KEY}`;
    const res = await withConcurrency(() => fetch(url).then(r => r.ok ? r.json() : null));
    const q = Array.isArray(res) ? res[0] : null;

    const price = Number(q?.price ?? 0);
    if (!Number.isFinite(price) || price <= 0) return cached || null;

    const change = Number(q?.change ?? 0);
    const changePercent = Number(q?.changesPercentage ?? 0);

    const entry: QuoteCache = {
      price,
      change: Number.isFinite(change) ? change : 0,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
      ts: now,
    };
    QUOTE_CACHE.set(sym, entry);
    return entry;
  } catch {
    return cached || null;
  }
}

async function fetchQuote(sym: string): Promise<QuoteCache | null> {
  const now = Date.now();
  const cached = QUOTE_CACHE.get(sym);
  if (cached && now - cached.ts < QUOTE_TTL) return cached;

  if (!FINNHUB_KEY) {
    const fmpQuote = await fetchFmpQuote(sym, now, cached);
    if (fmpQuote) return fmpQuote;
    const alphaQuote = await fetchAlphaVantageQuote(sym, now, cached);
    if (alphaQuote) return alphaQuote;
    return fetchYahooQuote(sym, now, cached);
  }

  const finnhubSym = FINNHUB_MAP[sym] || sym;
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${FINNHUB_KEY}`;
    const res = await withConcurrency(() => fetch(url).then(r => r.ok ? r.json() : null));
    if (!res || res.c === 0) {
      const fmpQuote = await fetchFmpQuote(sym, now, cached);
      if (fmpQuote) return fmpQuote;
      const alphaQuote = await fetchAlphaVantageQuote(sym, now, cached);
      if (alphaQuote) return alphaQuote;
      return fetchYahooQuote(sym, now, cached);
    }

    const entry: QuoteCache = {
      price: res.c ?? 0,
      change: res.d ?? 0,
      changePercent: res.dp ?? 0,
      ts: now,
    };
    QUOTE_CACHE.set(sym, entry);
    return entry;
  } catch {
    const fmpQuote = await fetchFmpQuote(sym, now, cached);
    if (fmpQuote) return fmpQuote;
    const alphaQuote = await fetchAlphaVantageQuote(sym, now, cached);
    if (alphaQuote) return alphaQuote;
    return fetchYahooQuote(sym, now, cached);
  }
}

const YAHOO_CHART_MAP: Record<string, string> = {
  NAS100: 'QQQ', SPX500: 'SPY', US30: 'DIA', RUSSELL: 'IWM',
  DAX40: 'EWG', FTSE100: 'EWU', NIKKEI: 'EWJ', HSI: 'EWH', AS51: 'EWA',
  GOLD: 'GLD', SILVER: 'SLV', CRUDE: 'USO', NATGAS: 'UNG', COPPER: 'CPER', PLATINUM: 'PPLT',
  DXY: 'UUP', VIX: 'VIXY', US10Y: 'IEF', US2Y: 'SHY', MOVE: 'TLT',
  BTCUSD: 'BTC-USD', ETHUSD: 'ETH-USD', SOLUSD: 'SOL-USD',
  BNBUSD: 'BNB-USD', XRPUSD: 'XRP-USD', ADAUSD: 'ADA-USD',
  EURUSD: 'EURUSD=X', GBPUSD: 'GBPUSD=X', USDJPY: 'JPY=X',
  AUDUSD: 'AUDUSD=X', USDCAD: 'USDCAD=X', USDCHF: 'USDCHF=X', NZDUSD: 'NZDUSD=X',
};

export async function fetchSymbolCandles(symbol: string): Promise<OHLCV[]> {
  const now = Date.now();
  const cached = CANDLE_CACHE.get(symbol);
  if (cached && now - cached.ts < CANDLE_TTL) return cached.history;

  const ySym = YAHOO_CHART_MAP[symbol] || symbol;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=15m&range=5d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return cached?.history || [];

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result?.timestamp?.length) return cached?.history || [];

    const ts: number[] = result.timestamp;
    const q = result.indicators?.quote?.[0];
    if (!q) return cached?.history || [];

    const history: OHLCV[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = q.close?.[i];
      if (c == null || c === 0) continue;
      history.push({
        timestamp: ts[i] * 1000,
        open: q.open?.[i] ?? c,
        high: q.high?.[i] ?? c,
        low: q.low?.[i] ?? c,
        close: c,
        volume: q.volume?.[i] ?? 0,
      });
    }

    if (history.length > 0) {
      CANDLE_CACHE.set(symbol, { history, ts: now });
    }
    return history;
  } catch {
    return cached?.history || [];
  }
}

async function fetchSingle(sym: string): Promise<MarketData | null> {
  const quote = await fetchQuote(sym);
  if (!quote) return null;

  return {
    symbol: sym,
    name: sym,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    currency: isForex(sym) ? sym.slice(3) : 'USD',
    marketState: 'REGULAR',
    history: [],
  };
}

export async function fetchMarketDataBatch(symbols: string[], interval: string = '15m'): Promise<(MarketData | null)[]> {
  if (!symbols || symbols.length === 0) return [];
  return Promise.all(symbols.map(sym => fetchSingle(sym)));
}

export async function fetchMarketData(symbol: string, interval: string = '15m'): Promise<MarketData | null> {
  return fetchSingle(symbol);
}
