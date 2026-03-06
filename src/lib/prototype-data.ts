import { EarningsEvent, EconomicEvent } from '@/lib/types';

type SymbolProfile = {
  base: number;
  vol: number;
  drift: number;
  type: 'equity' | 'index' | 'commodity' | 'crypto' | 'forex' | 'macro';
  name: string;
};

const PROFILES: Record<string, SymbolProfile> = {
  AAPL: { base: 205, vol: 0.018, drift: 0.00004, type: 'equity', name: 'Apple Inc.' },
  NVDA: { base: 920, vol: 0.028, drift: 0.00008, type: 'equity', name: 'NVIDIA Corp.' },
  MSFT: { base: 430, vol: 0.014, drift: 0.00005, type: 'equity', name: 'Microsoft Corp.' },
  TSLA: { base: 210, vol: 0.03, drift: 0.00002, type: 'equity', name: 'Tesla Inc.' },
  GOOGL: { base: 170, vol: 0.017, drift: 0.00004, type: 'equity', name: 'Alphabet Inc.' },
  AMZN: { base: 190, vol: 0.016, drift: 0.00004, type: 'equity', name: 'Amazon.com Inc.' },
  META: { base: 505, vol: 0.02, drift: 0.00005, type: 'equity', name: 'Meta Platforms' },
  AMD: { base: 185, vol: 0.026, drift: 0.00005, type: 'equity', name: 'Advanced Micro Devices' },
  NFLX: { base: 625, vol: 0.019, drift: 0.00004, type: 'equity', name: 'Netflix Inc.' },
  DIS: { base: 113, vol: 0.015, drift: 0.00002, type: 'equity', name: 'Walt Disney Co.' },
  PYPL: { base: 78, vol: 0.02, drift: 0.00001, type: 'equity', name: 'PayPal Holdings' },
  INTC: { base: 44, vol: 0.018, drift: 0.00001, type: 'equity', name: 'Intel Corp.' },
  UBER: { base: 86, vol: 0.02, drift: 0.00005, type: 'equity', name: 'Uber Technologies' },
  CRM: { base: 302, vol: 0.015, drift: 0.00003, type: 'equity', name: 'Salesforce Inc.' },
  ORCL: { base: 158, vol: 0.012, drift: 0.00003, type: 'equity', name: 'Oracle Corp.' },
  ADBE: { base: 520, vol: 0.017, drift: 0.00002, type: 'equity', name: 'Adobe Inc.' },
  CSCO: { base: 53, vol: 0.011, drift: 0.00001, type: 'equity', name: 'Cisco Systems' },
  QCOM: { base: 165, vol: 0.017, drift: 0.00003, type: 'equity', name: 'Qualcomm Inc.' },
  AVGO: { base: 1580, vol: 0.023, drift: 0.00005, type: 'equity', name: 'Broadcom Inc.' },
  TXN: { base: 185, vol: 0.014, drift: 0.00002, type: 'equity', name: 'Texas Instruments' },
  NAS100: { base: 18350, vol: 0.01, drift: 0.00003, type: 'index', name: 'Nasdaq 100' },
  SPX500: { base: 5230, vol: 0.008, drift: 0.00003, type: 'index', name: 'S&P 500' },
  US30: { base: 39250, vol: 0.007, drift: 0.00003, type: 'index', name: 'Dow Jones' },
  RUSSELL: { base: 2080, vol: 0.011, drift: 0.00003, type: 'index', name: 'Russell 2000' },
  DAX40: { base: 18220, vol: 0.01, drift: 0.00003, type: 'index', name: 'DAX 40' },
  FTSE100: { base: 8260, vol: 0.007, drift: 0.00002, type: 'index', name: 'FTSE 100' },
  NIKKEI: { base: 38950, vol: 0.009, drift: 0.00002, type: 'index', name: 'Nikkei 225' },
  HSI: { base: 16800, vol: 0.011, drift: 0.00001, type: 'index', name: 'Hang Seng' },
  AS51: { base: 7820, vol: 0.008, drift: 0.00002, type: 'index', name: 'ASX 200' },
  GOLD: { base: 2350, vol: 0.006, drift: 0.00002, type: 'commodity', name: 'Gold' },
  SILVER: { base: 27.6, vol: 0.009, drift: 0.00001, type: 'commodity', name: 'Silver' },
  CRUDE: { base: 79, vol: 0.014, drift: 0.00001, type: 'commodity', name: 'Crude Oil' },
  NATGAS: { base: 2.3, vol: 0.03, drift: -0.00001, type: 'commodity', name: 'Natural Gas' },
  COPPER: { base: 4.3, vol: 0.012, drift: 0.00001, type: 'commodity', name: 'Copper' },
  PLATINUM: { base: 975, vol: 0.01, drift: 0.00001, type: 'commodity', name: 'Platinum' },
  BTCUSD: { base: 90500, vol: 0.02, drift: 0.00008, type: 'crypto', name: 'Bitcoin' },
  ETHUSD: { base: 4900, vol: 0.024, drift: 0.00008, type: 'crypto', name: 'Ethereum' },
  SOLUSD: { base: 220, vol: 0.03, drift: 0.00009, type: 'crypto', name: 'Solana' },
  BNBUSD: { base: 720, vol: 0.018, drift: 0.00006, type: 'crypto', name: 'BNB' },
  XRPUSD: { base: 0.82, vol: 0.026, drift: 0.00004, type: 'crypto', name: 'XRP' },
  ADAUSD: { base: 0.95, vol: 0.024, drift: 0.00004, type: 'crypto', name: 'Cardano' },
  EURUSD: { base: 1.086, vol: 0.003, drift: 0.0, type: 'forex', name: 'EUR/USD' },
  GBPUSD: { base: 1.274, vol: 0.0034, drift: 0.0, type: 'forex', name: 'GBP/USD' },
  USDJPY: { base: 151.4, vol: 0.0028, drift: 0.0, type: 'forex', name: 'USD/JPY' },
  AUDUSD: { base: 0.662, vol: 0.0032, drift: 0.0, type: 'forex', name: 'AUD/USD' },
  USDCAD: { base: 1.352, vol: 0.0025, drift: 0.0, type: 'forex', name: 'USD/CAD' },
  USDCHF: { base: 0.889, vol: 0.0026, drift: 0.0, type: 'forex', name: 'USD/CHF' },
  NZDUSD: { base: 0.611, vol: 0.0032, drift: 0.0, type: 'forex', name: 'NZD/USD' },
  DXY: { base: 104.2, vol: 0.0025, drift: 0.0, type: 'macro', name: 'Dollar Index' },
  VIX: { base: 16.8, vol: 0.02, drift: 0.0, type: 'macro', name: 'VIX' },
  US10Y: { base: 4.22, vol: 0.003, drift: 0.0, type: 'macro', name: 'US 10Y Yield' },
  US2Y: { base: 4.63, vol: 0.0034, drift: 0.0, type: 'macro', name: 'US 2Y Yield' },
  MOVE: { base: 102, vol: 0.007, drift: 0.0, type: 'macro', name: 'MOVE Index' },
};

type SymbolSearchItem = { symbol: string; name: string; type: string; exchange: string };

export type SimBar = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function noise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function defaultProfile(symbol: string): SymbolProfile {
  const seed = hashString(symbol);
  const base = 20 + (seed % 500);
  return { base, vol: 0.015, drift: 0.00002, type: 'equity', name: symbol };
}

function resolveProfile(symbol: string): SymbolProfile {
  return PROFILES[symbol] || defaultProfile(symbol);
}

function intervalToMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60_000,
    '5m': 300_000,
    '15m': 900_000,
    '30m': 1_800_000,
    '60m': 3_600_000,
    '240m': 14_400_000,
    '1d': 86_400_000,
    '1wk': 604_800_000,
  };
  return map[interval] || 900_000;
}

function roundForSymbol(value: number, symbol: string): number {
  const p = resolveProfile(symbol);
  if (p.type === 'forex') return Number(value.toFixed(4));
  if (p.type === 'crypto' && p.base < 5) return Number(value.toFixed(4));
  return Number(value.toFixed(2));
}

function priceAt(symbol: string, timestamp: number): number {
  const profile = resolveProfile(symbol);
  const seed = hashString(symbol);
  const t = timestamp / 1000;
  const wave1 = Math.sin(t / 2100 + (seed % 17)) * profile.vol * 0.8;
  const wave2 = Math.cos(t / 5800 + (seed % 23)) * profile.vol * 0.45;
  const jitter = (noise(seed + Math.floor(t / 43)) - 0.5) * profile.vol * 0.18;
  const trend = profile.drift * (t / 90);
  const raw = profile.base * (1 + wave1 + wave2 + jitter + trend);
  return Math.max(0.0001, roundForSymbol(raw, symbol));
}

export function makeSymbolSearchUniverse(): SymbolSearchItem[] {
  return Object.entries(PROFILES).map(([symbol, profile]) => ({
    symbol,
    name: profile.name,
    type: profile.type.toUpperCase(),
    exchange: profile.type === 'crypto' ? 'SIM-CRYPTO' : 'SIM-MARKET',
  }));
}

export function searchPrototypeSymbols(query: string): SymbolSearchItem[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return makeSymbolSearchUniverse()
    .filter((item) => item.symbol.includes(q) || item.name.toUpperCase().includes(q))
    .slice(0, 8);
}

export function makeSimHistory(symbol: string, interval = '15m', points = 160, endTs = Date.now()): SimBar[] {
  const step = intervalToMs(interval);
  const endAligned = Math.floor(endTs / step) * step;
  const bars: SimBar[] = [];

  for (let i = points - 1; i >= 0; i--) {
    const ts = endAligned - i * step;
    const open = priceAt(symbol, ts - step);
    const close = priceAt(symbol, ts);
    const mid = (open + close) / 2;
    const amp = Math.max(mid * resolveProfile(symbol).vol * 0.35, 0.0001);
    const local = noise(hashString(symbol) + Math.floor(ts / step));
    const high = Math.max(open, close) + amp * (0.4 + local * 0.6);
    const low = Math.min(open, close) - amp * (0.4 + (1 - local) * 0.6);
    const baseVol = resolveProfile(symbol).type === 'forex' ? 80_000 : resolveProfile(symbol).type === 'crypto' ? 40_000 : 1_200_000;
    const volume = Math.floor(baseVol * (0.7 + local * 0.8));
    bars.push({
      timestamp: ts,
      open: roundForSymbol(open, symbol),
      high: roundForSymbol(high, symbol),
      low: roundForSymbol(Math.max(low, 0.0001), symbol),
      close: roundForSymbol(close, symbol),
      volume,
    });
  }

  return bars;
}

export function makeSimQuote(symbol: string, now = Date.now()) {
  const price = priceAt(symbol, now);
  const prev = priceAt(symbol, now - 86_400_000);
  const change = price - prev;
  const changePercent = prev > 0 ? (change / prev) * 100 : 0;
  return {
    symbol,
    name: resolveProfile(symbol).name,
    price: roundForSymbol(price, symbol),
    change: roundForSymbol(change, symbol),
    changePercent: Number(changePercent.toFixed(2)),
    marketState: 'REGULAR',
    history: makeSimHistory(symbol, '15m', 180, now),
  };
}

export function makePrototypeNews(category: string, symbolHint?: string) {
  const topics = {
    General: ['Macro positioning shifts', 'Liquidity conditions tighten', 'Cross-asset risk repricing', 'Systematic flows rebalance'],
    Stock: ['Earnings revision cycle', 'AI capex narrative', 'Margin expansion watch', 'Buyback window focus'],
    Crypto: ['On-chain activity rises', 'ETF flow imbalance', 'Derivatives funding reset', 'Layer-1 throughput race'],
    Forex: ['Rate differential repricing', 'Central bank tone divergence', 'Carry trade unwind', 'Dollar breadth rotation'],
  } as const;
  const key = (['General', 'Stock', 'Crypto', 'Forex'].includes(category) ? category : 'General') as keyof typeof topics;
  const list = topics[key];
  const seed = hashString(`${key}:${symbolHint || ''}`);
  const now = Date.now();

  return Array.from({ length: 20 }, (_, i) => {
    const phrase = list[(seed + i) % list.length];
    const ticker = symbolHint || ['SPX500', 'NAS100', 'BTCUSD', 'EURUSD'][i % 4];
    const minsAgo = i * 18 + (seed % 12);
    return {
      title: `${phrase} as ${ticker} tests key levels`,
      source: ['MarketMind Research', 'Prototype Desk', 'Sim Wire'][i % 3],
      time: minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`,
      category: key,
      link: '#',
      imageUrl: null,
      contentSnippet: 'Simulated prototype headline for UI testing, ranking logic, and sentiment layout.',
      pubDate: now - minsAgo * 60_000,
    };
  });
}

export function makePrototypeEconomicEvents(date: string): EconomicEvent[] {
  const seed = hashString(date);
  const base = [
    { title: 'Consumer Price Index', country: 'US', currency: 'USD', impact: 'High' as const, time: '08:30' },
    { title: 'Retail Sales', country: 'US', currency: 'USD', impact: 'Medium' as const, time: '08:30' },
    { title: 'FOMC Minutes', country: 'US', currency: 'USD', impact: 'High' as const, time: '14:00' },
    { title: 'ECB Rate Decision', country: 'EU', currency: 'EUR', impact: 'High' as const, time: '07:45' },
    { title: 'BOE Policy Statement', country: 'GB', currency: 'GBP', impact: 'High' as const, time: '07:00' },
    { title: 'US Initial Jobless Claims', country: 'US', currency: 'USD', impact: 'Medium' as const, time: '08:30' },
  ];

  return base.map((b, i) => {
    const n = noise(seed + i * 11);
    const forecast = (2 + n * 3).toFixed(1);
    const actual = i % 2 === 0 ? (2 + noise(seed + i * 31) * 3).toFixed(1) : null;
    return {
      id: `sim-${date}-${i}`,
      date,
      time: b.time,
      country: b.country,
      currency: b.currency,
      impact: b.impact,
      title: b.title,
      actual: actual ? `${actual}%` : null,
      forecast: `${forecast}%`,
      previous: `${(Number(forecast) - 0.2).toFixed(1)}%`,
      timestamp: 0,
    };
  });
}

export function makePrototypeEarnings(date: string): EarningsEvent[] {
  const list = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD'];
  return list.map((ticker, i) => {
    const seed = hashString(`${date}:${ticker}`);
    const epsEst = Number((0.8 + noise(seed) * 4).toFixed(2));
    const beat = noise(seed + 17) > 0.55;
    const epsAct = beat ? Number((epsEst * (1 + noise(seed + 9) * 0.12)).toFixed(2)) : Number((epsEst * (1 - noise(seed + 9) * 0.08)).toFixed(2));
    return {
      id: `sim-earn-${date}-${ticker}`,
      ticker,
      name: resolveProfile(ticker).name,
      date,
      time: i % 2 === 0 ? 'amc' : 'bmo',
      epsEst,
      epsAct,
      revEst: Number((20 + noise(seed + 3) * 80).toFixed(2)),
      revAct: Number((20 + noise(seed + 5) * 82).toFixed(2)),
      surprise: Number((((epsAct - epsEst) / Math.max(epsEst, 0.01)) * 100).toFixed(2)),
      sector: 'Technology',
      marketCap: i < 3 ? '2.10T' : i < 6 ? '980B' : '420B',
    };
  });
}

export function makePrototypeHistoricalPrints(eventName: string): Array<{ date: string; actual: string; forecast: string }> {
  const seed = hashString(eventName);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (i + 1));
    const value = (2 + noise(seed + i * 3) * 3).toFixed(1);
    const est = (2 + noise(seed + i * 3 + 9) * 3).toFixed(1);
    return { date: d.toISOString().split('T')[0], actual: `${value}%`, forecast: `${est}%` };
  });
}

