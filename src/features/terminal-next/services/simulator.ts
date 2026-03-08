import {
  BlotterRow,
  ExecutionEvent,
  FunctionCode,
  IntradayBar,
  MicrostructureStats,
  OrderBookLevel,
  Quote,
  ReferenceSecurityProfile,
  TapePrint,
  TerminalState,
  VolatilityRegime,
} from '../types';

const hash = (x: string) => Array.from(x).reduce((a, c) => a + c.charCodeAt(0), 0);

const CORE_UNIVERSE: Array<{ symbol: string; name: string; base: number; sector: string; benchmark: 'SPX' | 'NDX' | 'NONE' }> = [
  { symbol: 'AAPL US', name: 'Apple Inc', base: 196.5, sector: 'Tech', benchmark: 'NDX' },
  { symbol: 'MSFT US', name: 'Microsoft Corp', base: 430.4, sector: 'Tech', benchmark: 'NDX' },
  { symbol: 'NVDA US', name: 'NVIDIA Corp', base: 914.1, sector: 'Tech', benchmark: 'NDX' },
  { symbol: 'META US', name: 'Meta Platforms', base: 511.1, sector: 'Comm', benchmark: 'NDX' },
  { symbol: 'AMZN US', name: 'Amazon.com', base: 183.2, sector: 'Comm', benchmark: 'SPX' },
  { symbol: 'TSLA US', name: 'Tesla Inc', base: 214.7, sector: 'Auto', benchmark: 'SPX' },
  { symbol: 'SPX Index', name: 'S&P 500 Index', base: 5284.1, sector: 'Index', benchmark: 'SPX' },
  { symbol: 'NDX Index', name: 'Nasdaq 100', base: 18645.4, sector: 'Index', benchmark: 'NDX' },
  { symbol: 'US10Y Govt', name: 'US 10Y Yield', base: 4.31, sector: 'Rates', benchmark: 'NONE' },
  { symbol: 'EURUSD Curncy', name: 'Euro / Dollar', base: 1.0841, sector: 'FX', benchmark: 'NONE' },
  { symbol: 'USDJPY Curncy', name: 'Dollar / Yen', base: 150.52, sector: 'FX', benchmark: 'NONE' },
  { symbol: 'XAUUSD Cmdty', name: 'Gold Spot', base: 2325.7, sector: 'Cmdty', benchmark: 'NONE' },
  { symbol: 'CL1 Cmdty', name: 'WTI Crude Front', base: 79.42, sector: 'Cmdty', benchmark: 'NONE' },
  { symbol: 'NG1 Cmdty', name: 'Nat Gas Front', base: 2.74, sector: 'Cmdty', benchmark: 'NONE' },
  { symbol: 'BTCUSD Curncy', name: 'Bitcoin / Dollar', base: 67210.0, sector: 'FX', benchmark: 'NONE' },
  { symbol: 'ETHUSD Curncy', name: 'Ether / Dollar', base: 3525.4, sector: 'FX', benchmark: 'NONE' },
  { symbol: 'DAX Index', name: 'DAX 40 Index', base: 18502.2, sector: 'Index', benchmark: 'NONE' },
  { symbol: 'FTSE Index', name: 'FTSE 100 Index', base: 8114.9, sector: 'Index', benchmark: 'NONE' },
  { symbol: 'CAC Index', name: 'CAC 40 Index', base: 7972.8, sector: 'Index', benchmark: 'NONE' },
  { symbol: 'US30 Index', name: 'Dow Jones 30', base: 39384.4, sector: 'Index', benchmark: 'SPX' },
];

const EQUITY_TICKERS = [
  'GOOGL', 'GOOG', 'BRK.B', 'JPM', 'V', 'JNJ', 'WMT', 'XOM', 'PG', 'UNH', 'MA', 'HD', 'LLY', 'BAC', 'ABBV', 'AVGO',
  'KO', 'PEP', 'COST', 'MRK', 'ORCL', 'CSCO', 'ADBE', 'CRM', 'NFLX', 'AMD', 'INTC', 'QCOM', 'TXN', 'AMAT', 'MU', 'SHOP',
  'UBER', 'SNOW', 'PANW', 'CRWD', 'NOW', 'PLTR', 'SQ', 'PYPL', 'DIS', 'NKE', 'SBUX', 'MCD', 'T', 'VZ', 'CMCSA', 'TMUS',
  'CVX', 'COP', 'SLB', 'CAT', 'DE', 'GE', 'HON', 'MMM', 'BA', 'LMT', 'RTX', 'NOC', 'GD', 'F', 'GM', 'RIVN', 'LCID',
  'PFE', 'BMY', 'TMO', 'DHR', 'ABT', 'GILD', 'BIIB', 'ISRG', 'REGN', 'VRTX', 'AMGN', 'MDT', 'SYK', 'ELV', 'CI', 'HUM',
  'GS', 'MS', 'BLK', 'SPGI', 'ICE', 'CME', 'SCHW', 'CB', 'AIG', 'PGR', 'TRV', 'AON', 'BK', 'USB', 'WFC', 'C',
  'PLD', 'AMT', 'EQIX', 'SPG', 'O', 'PSA', 'DLR', 'CCI', 'EQR', 'VICI', 'WY', 'EXR', 'NEM', 'FCX', 'LIN', 'APD',
  'UPS', 'FDX', 'UNP', 'CSX', 'NSC', 'DAL', 'UAL', 'AAL', 'LUV', 'MAR', 'HLT', 'BKNG', 'ABNB', 'RCL', 'CCL', 'NCLH',
  'IBM', 'SAP', 'ASML', 'TSM', 'SONY', 'BABA', 'PDD', 'JD', 'TCEHY', 'BIDU', 'SE', 'MELI', 'NU', 'RIO', 'BHP', 'SHEL',
];

const ETF_TICKERS = [
  'SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLK', 'XLE', 'XLI', 'XLV', 'XLP', 'XLY', 'XLU', 'XLB', 'XLRE', 'TLT', 'IEF',
  'HYG', 'LQD', 'GLD', 'SLV', 'USO', 'UNG', 'EEM', 'EWJ', 'EFA', 'FXI', 'ARKK', 'SOXX', 'SMH', 'XBI',
];

const GENERATED_UNIVERSE = [...EQUITY_TICKERS, ...ETF_TICKERS].map((ticker, idx) => {
  const seed = hash(ticker) + idx * 17;
  const base = Number((12 + (seed % 780) + ((seed % 37) / 100)).toFixed(2));
  const sectorCycle = ['Tech', 'Fin', 'Health', 'Energy', 'Industrial', 'Consumer', 'Comm', 'Materials', 'Utilities'];
  const sector = sectorCycle[seed % sectorCycle.length];
  const benchmark: 'SPX' | 'NDX' | 'NONE' = sector === 'Tech' || sector === 'Comm' ? 'NDX' : 'SPX';
  return {
    symbol: `${ticker} US`,
    name: `${ticker} Holdings`,
    base,
    sector,
    benchmark,
  };
});

const FULL_UNIVERSE: Array<{ symbol: string; name: string; base: number; sector: string; benchmark: 'SPX' | 'NDX' | 'NONE' }> = [
  ...CORE_UNIVERSE,
  ...GENERATED_UNIVERSE.filter((g) => !CORE_UNIVERSE.some((c) => c.symbol === g.symbol)),
];

/** Golden Source: 140 tickers for dense terminal flow */
const UNIVERSE = FULL_UNIVERSE.slice(0, 140);

const HEADLINES = [
  'ECB SPEAKERS MAINTAIN DATA-DEPENDENT GUIDANCE INTO CPI WINDOW',
  'US TECH OUTPERFORMS AS INDEX BREADTH IMPROVES ACROSS GROWTH BASKETS',
  'RATES VOL REMAINS ELEVATED WHILE FRONT-END EXPECTATIONS STABILIZE',
  'SYSTEMATIC FLOWS TURN MODESTLY PRO-RISK AFTER VOLATILITY COMPRESSION',
  'ENERGY HOLDS BID AS DOLLAR SOFTENS DURING EUROPEAN SESSION',
  'CREDIT SPREADS TIGHTEN AS PRIMARY ISSUANCE PRICES STRONGLY',
  'INDEX OPTION GAMMA POSITIONING TILTS TOWARD UPSIDE HEDGING',
  'CTA POSITIONING TURNS NET-LONG AS TREND SIGNALS REACCELERATE',
  'REAL-MONEY ACCOUNTS EXTEND DURATION HEDGES INTO DATA VOL WINDOW',
  'PRIMARY DEAL CALENDAR STAYS HEAVY AS SPREADS ABSORB SUPPLY',
  'SYSTEMATIC VOL TARGETING MODELS RE-RISK AFTER DRAWDOWN STABILIZATION',
  'EUROPE OPEN MIXED WHILE US FUTURES HOLD NARROW OVERNIGHT RANGE',
  'FX OPTIONS DESKS REPORT STRONG DEMAND FOR UPSIDE DOLLAR STRUCTURES',
  'EMERGING-MARKET EQUITIES REBOUND AS DOLLAR MOMENTUM EASES INTO CLOSE',
  'SHORT-DATED INDEX HEDGING INCREASES AHEAD OF WEEKLY OPTIONS EXPIRATION',
  'SEMICONDUCTOR SUPPLY CHAIN NAMES OUTPERFORM ON CAPEX UPGRADE CYCLE',
  'HEALTHCARE DEFENSIVES ATTRACT INFLOWS DURING AFTERNOON VOLATILITY SPIKE',
  'EU SOVEREIGN SPREADS TIGHTEN AS PERIPHERY AUCTION DEMAND IMPROVES',
  'CREDIT ETF VOLUMES RISE WITH RISK-ON ROTATION INTO HIGH BETA SEGMENTS',
  'LARGE-CAP QUALITY FACTOR LEADS AS SMALL-CAP BREADTH REMAINS MIXED',
  'CROSS-CURRENCY BASIS NORMALIZES WHILE FRONT-END RATE DIFFERENTIALS HOLD',
  'SYSTEMATIC EQUITY REBALANCERS BUY INTO CLOSE ON POSITIVE TREND SIGNALS',
  'INDEX FUTURES BASIS NARROWS AS CASH-FUTURES ARBITRAGE FLOWS STABILIZE',
  'COMMODITY COMPLEX SEES BROAD BID WITH METALS AND ENERGY MOVING TOGETHER',
];

const ALERTS = [
  'VOL CLUSTER IN US TECH BASKET',
  'CROSS-ASSET CORRELATION SHIFT > 0.80',
  'RATES VOL RISING INTO DATA WINDOW',
  'LIQUIDITY THINNING AROUND MACRO EVENT WINDOW',
  'SWEEP ACTIVITY DETECTED AT INSIDE OFFER',
  'ORDER FLOW IMBALANCE EXCEEDS THRESHOLD',
  'SECTOR CONCENTRATION DRIFT BREACH',
  'LIQUIDITY GAP DETECTED BETWEEN LIT AND DARK VENUES',
  'OPTIONS SKEW SHIFTS TOWARD DOWNSIDE PROTECTION',
  'SYSTEM PULSE THRESHOLD EXCEEDED IN CROSS-ASSET MONITOR',
  'ETF PRIMARY FLOW DIVERGES FROM UNDERLYING BASKET MOMENTUM',
  'EVENT RISK WINDOW ENTERED FOR HIGH-IMPACT MACRO RELEASE',
  'EXECUTION SLIPPAGE TREND ELEVATED AGAINST BASELINE',
];

const PROFILE_BASE: Record<string, Omit<ReferenceSecurityProfile, 'symbol' | 'dailyBars'>> = {
  'AAPL US': {
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCapBn: 3012,
    floatBn: 15.6,
    country: 'US',
    exchange: 'NASDAQ',
    ratings: { sp: 'AA+', moodys: 'Aa1', fitch: 'AA+' },
    earningsDates: ['2026-04-30', '2026-07-29'],
  },
  'MSFT US': {
    sector: 'Technology',
    industry: 'Software Infrastructure',
    marketCapBn: 3228,
    floatBn: 7.4,
    country: 'US',
    exchange: 'NASDAQ',
    ratings: { sp: 'AAA', moodys: 'Aaa', fitch: 'AAA' },
    earningsDates: ['2026-04-24', '2026-07-23'],
  },
  'NVDA US': {
    sector: 'Technology',
    industry: 'Semiconductors',
    marketCapBn: 2254,
    floatBn: 2.5,
    country: 'US',
    exchange: 'NASDAQ',
    ratings: { sp: 'A+', moodys: 'A1', fitch: 'A+' },
    earningsDates: ['2026-05-21', '2026-08-20'],
  },
  'META US': {
    sector: 'Communication Services',
    industry: 'Internet Content',
    marketCapBn: 1284,
    floatBn: 2.2,
    country: 'US',
    exchange: 'NASDAQ',
    ratings: { sp: 'AA-', moodys: 'Aa3', fitch: 'AA-' },
    earningsDates: ['2026-04-23', '2026-07-30'],
  },
  'AMZN US': {
    sector: 'Consumer Discretionary',
    industry: 'Internet Retail',
    marketCapBn: 1914,
    floatBn: 9.9,
    country: 'US',
    exchange: 'NASDAQ',
    ratings: { sp: 'AA', moodys: 'A1', fitch: 'AA' },
    earningsDates: ['2026-04-25', '2026-07-31'],
  },
  'TSLA US': {
    sector: 'Consumer Discretionary',
    industry: 'Automobiles',
    marketCapBn: 684,
    floatBn: 2.9,
    country: 'US',
    exchange: 'NASDAQ',
    ratings: { sp: 'BBB', moodys: 'Baa3', fitch: 'BBB' },
    earningsDates: ['2026-04-22', '2026-07-24'],
  },
  'SPX Index': {
    sector: 'Index',
    industry: 'Equity Benchmark',
    marketCapBn: 45600,
    floatBn: 35.2,
    country: 'US',
    exchange: 'INDEX',
    ratings: { sp: 'N/A', moodys: 'N/A', fitch: 'N/A' },
    earningsDates: ['2026-04-15', '2026-07-15'],
  },
  'NDX Index': {
    sector: 'Index',
    industry: 'Tech Benchmark',
    marketCapBn: 21400,
    floatBn: 18.5,
    country: 'US',
    exchange: 'INDEX',
    ratings: { sp: 'N/A', moodys: 'N/A', fitch: 'N/A' },
    earningsDates: ['2026-04-16', '2026-07-16'],
  },
  'US10Y Govt': {
    sector: 'Rates',
    industry: 'Sovereign Bond',
    marketCapBn: 0,
    floatBn: 0,
    country: 'US',
    exchange: 'OTC',
    ratings: { sp: 'AA+', moodys: 'Aaa', fitch: 'AA+' },
    earningsDates: ['2026-04-01', '2026-07-01'],
  },
  'EURUSD Curncy': {
    sector: 'FX',
    industry: 'Spot FX',
    marketCapBn: 0,
    floatBn: 0,
    country: 'EU/US',
    exchange: 'OTC',
    ratings: { sp: 'N/A', moodys: 'N/A', fitch: 'N/A' },
    earningsDates: ['2026-04-10', '2026-07-10'],
  },
  'USDJPY Curncy': {
    sector: 'FX',
    industry: 'Spot FX',
    marketCapBn: 0,
    floatBn: 0,
    country: 'US/JP',
    exchange: 'OTC',
    ratings: { sp: 'N/A', moodys: 'N/A', fitch: 'N/A' },
    earningsDates: ['2026-04-11', '2026-07-11'],
  },
  'XAUUSD Cmdty': {
    sector: 'Commodities',
    industry: 'Precious Metals',
    marketCapBn: 0,
    floatBn: 0,
    country: 'Global',
    exchange: 'OTC',
    ratings: { sp: 'N/A', moodys: 'N/A', fitch: 'N/A' },
    earningsDates: ['2026-04-05', '2026-07-05'],
  },
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function mulberry32(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let s = Math.imul(t ^ (t >>> 15), 1 | t);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function regimeFromTick(tick: number): VolatilityRegime {
  const phase = tick % 180;
  if (phase < 70) return 'TREND';
  if (phase < 130) return 'MEAN_REVERT';
  return 'VOL_EXPANSION';
}

function driftByRegime(regime: VolatilityRegime, x: number) {
  if (regime === 'TREND') return Math.sin(x) * 1.25 + Math.sin(x * 0.21) * 0.55;
  if (regime === 'MEAN_REVERT') return Math.sin(x) * 0.42 + Math.sin(x * 0.37) * 0.25;
  return Math.sin(x) * 1.75 + Math.cos(x * 0.19) * 0.9;
}

export function getUniverseSymbols() {
  return UNIVERSE.map((u) => u.symbol);
}

export function seedQuotes(): Quote[] {
  return UNIVERSE.map((u) => ({
    symbol: u.symbol,
    name: u.name,
    last: u.base,
    pct: 0,
    abs: 0,
    high: u.base,
    low: u.base,
    volumeM: 1,
    betaToSPX: 1,
    corrToSPX: u.benchmark === 'SPX' ? 1 : 0.45,
    corrToNDX: u.benchmark === 'NDX' ? 1 : 0.4,
    liquidityScore: 50,
    momentum: 0,
  }));
}

export function seedReferenceProfiles(seed: number): Record<string, ReferenceSecurityProfile> {
  const out: Record<string, ReferenceSecurityProfile> = {};
  for (const u of UNIVERSE) {
    const base = PROFILE_BASE[u.symbol];
    const rand = mulberry32(seed + hash(u.symbol));
    const dailyBars = Array.from({ length: 45 }, (_, i) => {
      const drift = Math.sin((i + 1) * 0.2 + hash(u.symbol) * 0.001) * 0.8;
      const noise = (rand() - 0.5) * 0.6;
      const pct = (drift + noise) / 100;
      const close = Number((u.base * (1 + pct)).toFixed(4));
      return {
        date: `2026-02-${String(i + 1).padStart(2, '0')}`,
        close,
        volume: Math.round(100_000 + rand() * 2_000_000),
      };
    });
    out[u.symbol] = {
      symbol: u.symbol,
      sector: base?.sector ?? 'Unknown',
      industry: base?.industry ?? 'Unknown',
      marketCapBn: base?.marketCapBn ?? 0,
      floatBn: base?.floatBn ?? 0,
      country: base?.country ?? 'N/A',
      exchange: base?.exchange ?? 'N/A',
      ratings: base?.ratings ?? { sp: 'N/A', moodys: 'N/A', fitch: 'N/A' },
      earningsDates: base?.earningsDates ?? ['2026-04-01', '2026-07-01'],
      dailyBars,
    };
  }
  return out;
}

function seededNoise(seed: number, symbol: string, tick: number) {
  const rand = mulberry32(seed + hash(symbol) + tick * 7919);
  return (rand() - 0.5) * 0.22;
}

export function nextQuotes(seed: number, tick: number): Quote[] {
  const regime = regimeFromTick(tick);
  return UNIVERSE.map((u, index) => {
    const k = hash(u.symbol);
    const x = (tick + index * 3) * 0.17 + k * 0.0009;
    const regimeDrift = driftByRegime(regime, x);
    const noise = seededNoise(seed, u.symbol, tick);
    const drift = regimeDrift + noise;
    const pct = Number(drift.toFixed(2));
    const last = u.base * (1 + pct / 100);
    const abs = last - u.base;
    const rangeFactor = regime === 'VOL_EXPANSION' ? 1.8 : regime === 'TREND' ? 1.25 : 0.8;
    const range = Math.abs(Math.cos((tick + index) * 0.22 + k * 0.002)) * rangeFactor * (u.base > 1000 ? 22 : u.base > 100 ? 2.4 : 0.015);
    const volumeM = 1.2 + Math.abs(Math.cos((tick + index) * 0.11 + k * 0.003)) * (regime === 'VOL_EXPANSION' ? 12 : 8.7);
    const corrBase = u.benchmark === 'SPX' ? 0.82 : u.benchmark === 'NDX' ? 0.86 : 0.35;
    const corrShift = Math.sin((tick + index) * 0.09) * 0.12;
    const corrToSPX = clamp(corrBase + corrShift, -0.95, 0.99);
    const corrToNDX = clamp(corrBase + Math.cos((tick + index) * 0.11) * 0.13, -0.95, 0.99);
    const betaToSPX = clamp(0.6 + Math.abs(Math.sin((tick + index) * 0.07)) * 1.1, 0.35, 2.2);
    const liquidityScore = clamp(Math.round(40 + Math.abs(Math.cos((tick + index) * 0.1)) * 55), 10, 99);
    const momentum = Number((Math.sin((tick + index) * 0.3) * (regime === 'MEAN_REVERT' ? 0.6 : 1.2)).toFixed(2));
    return {
      symbol: u.symbol,
      name: u.name,
      last,
      pct,
      abs,
      high: last + range,
      low: last - range,
      volumeM,
      betaToSPX,
      corrToSPX,
      corrToNDX,
      liquidityScore,
      momentum,
    };
  });
}

export function buildOrderBook(price: number, tick: number, seed: number): OrderBookLevel[] {
  const step = price > 1000 ? 0.5 : price > 100 ? 0.05 : 0.01;
  let runningBid = 0;
  let runningAsk = 0;
  return Array.from({ length: 40 }, (_, i) => {
    const bias = Math.sin(tick * 0.18) > 0 ? 1.08 : 0.92;
    const n = mulberry32(seed + tick * 199 + i * 17)();
    const bidSize = Math.round((95 + Math.abs(Math.sin((tick + i) * 0.27)) * 1500) * bias * (0.9 + n * 0.25));
    const askSize = Math.round((95 + Math.abs(Math.cos((tick + i) * 0.29)) * 1500) * (2 - bias) * (0.9 + n * 0.25));
    runningBid += bidSize;
    runningAsk += askSize;
    const bidHeat = clamp(Math.round((bidSize / 1800) * 100), 8, 100);
    const askHeat = clamp(Math.round((askSize / 1800) * 100), 8, 100);
    return {
      level: i + 1,
      bid: Number((price - step * (i + 1)).toFixed(4)),
      ask: Number((price + step * (i + 1)).toFixed(4)),
      bidSize,
      askSize,
      cumBidSize: runningBid,
      cumAskSize: runningAsk,
      bidHeat,
      askHeat,
    };
  });
}

export function buildTape(book: OrderBookLevel[], hhmmss: string, tick: number, seed: number): TapePrint[] {
  const prints: TapePrint[] = [];
  const rand = mulberry32(seed + tick * 4099);
  const printCount = 40 + Math.floor(rand() * 22);
  for (let i = 0; i < printCount; i += 1) {
    const level = book[i % Math.min(8, book.length)];
    const buyBias = Math.sin(tick * 0.16) > 0;
    const side = rand() > (buyBias ? 0.38 : 0.62) ? 'BUY' : 'SELL';
    const baseSize = Math.round((level.bidSize + level.askSize) / 6);
    const size = Math.max(18, Math.round(baseSize * (0.55 + rand() * 1.45)));
    const isSweep = size > 420 && i < 3;
    prints.push({
      id: `t-${tick}-${i}`,
      time: hhmmss,
      price: side === 'BUY' ? level.ask : level.bid,
      size,
      side,
      aggressive: side === 'BUY',
      isSweep,
    });
  }
  return prints;
}

export function buildBarsForSymbol(existing: IntradayBar[] | undefined, quote: Quote, tick: number, tickMs: number): IntradayBar[] {
  const bars = existing ? [...existing] : [];
  const barSize = 8;
  if (!bars.length) {
    const base = quote.last;
    bars.push({
      ts: tickMs,
      open: base,
      high: base,
      low: base,
      close: base,
      volume: Math.round(quote.volumeM * 100_000),
      vwap: base,
      ma9: base,
      ma21: base,
    });
  } else {
    const updateCurrent = tick % barSize !== 0;
    if (updateCurrent) {
      const last = { ...bars[bars.length - 1] };
      last.high = Math.max(last.high, quote.last);
      last.low = Math.min(last.low, quote.last);
      last.close = quote.last;
      last.volume += Math.round(quote.volumeM * 5_000);
      bars[bars.length - 1] = last;
    } else {
      const prevClose = bars[bars.length - 1].close;
      bars.push({
        ts: tickMs,
        open: prevClose,
        high: Math.max(prevClose, quote.last),
        low: Math.min(prevClose, quote.last),
        close: quote.last,
        volume: Math.round(quote.volumeM * 120_000),
        vwap: quote.last,
        ma9: quote.last,
        ma21: quote.last,
      });
    }
  }

  const trimmed = bars;
  let cumPv = 0;
  let cumVol = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    const typical = (trimmed[i].high + trimmed[i].low + trimmed[i].close) / 3;
    cumPv += typical * trimmed[i].volume;
    cumVol += trimmed[i].volume;
    trimmed[i].vwap = cumVol > 0 ? cumPv / cumVol : trimmed[i].close;
    const closes9 = trimmed.slice(Math.max(0, i - 8), i + 1).map((b) => b.close);
    const closes21 = trimmed.slice(Math.max(0, i - 20), i + 1).map((b) => b.close);
    trimmed[i].ma9 = closes9.reduce((a, v) => a + v, 0) / closes9.length;
    trimmed[i].ma21 = closes21.reduce((a, v) => a + v, 0) / closes21.length;
  }
  return trimmed;
}

export function buildBlotter(quotes: Quote[], previous: BlotterRow[] | undefined, tape: TapePrint[], tick: number): BlotterRow[] {
  const prevMap = new Map((previous ?? []).map((r) => [r.symbol, r]));
  return quotes.map((q, i) => {
    const side: 'BUY' | 'SELL' = i % 2 === 0 ? 'BUY' : 'SELL';
    const qty = 50 + i * 25;
    const prior = prevMap.get(q.symbol);
    const avg = prior?.avg ?? q.last * (1 - q.pct / 100 / 2.8);
    const sweepBoost = tape.some((t) => t.isSweep && t.side === side) ? 1.16 : 1;
    const pnl = (q.last - avg) * qty * (side === 'BUY' ? 1 : -1) * sweepBoost;
    const cycle = (tick + i) % 9;
    const status: BlotterRow['status'] = cycle < 3 ? 'WORKING' : cycle < 6 ? 'PARTIAL' : 'FILLED';
    return {
      id: `${q.symbol}-${i}`,
      symbol: q.symbol,
      side,
      qty,
      avg,
      last: q.last,
      pnl,
      status,
    };
  });
}

export function buildExecutionEvents(
  blotter: BlotterRow[],
  previous: BlotterRow[] | undefined,
  tape: TapePrint[],
  tickMs: number,
  policy?: ExecutionPolicyInput,
): ExecutionEvent[] {
  const prevMap = new Map((previous ?? []).map((r) => [r.id, r.status]));
  const events: ExecutionEvent[] = [];
  for (const row of blotter) {
    const prevStatus = prevMap.get(row.id);
    if (prevStatus !== row.status) {
      const topTape = tape.find((t) => t.side === row.side) ?? tape[0];
      const fillQty = row.status === 'WORKING' ? Math.max(1, Math.round(row.qty * 0.05)) : row.status === 'PARTIAL' ? Math.max(1, Math.round(row.qty * 0.4)) : row.qty;
      events.push({
        id: `${row.id}-${row.status}-${tickMs}`,
        symbol: row.symbol,
        status: row.status,
        fillQty,
        fillPrice: topTape?.price ?? row.last,
        source: topTape?.isSweep ? 'DEPTH' : 'TAPE',
        ts: tickMs,
        mode: policy?.symbol === row.symbol ? policy.mode : 'MACRO_CONTROLLED',
        reasonCode: policy?.symbol === row.symbol ? (policy.reasonCode as ExecutionEvent['reasonCode']) : undefined,
      });
    }
  }
  return events;
}

export function rotateHeadlines(tick: number): string[] {
  const start = tick % HEADLINES.length;
  return Array.from({ length: 72 }, (_, i) => HEADLINES[(start + i) % HEADLINES.length]);
}

export function activeAlerts(tick: number, sweepActive: boolean): string[] {
  return ALERTS.map((a, i) => {
    if (i === 0 && sweepActive) return `${a} [SWEEP]`;
    if (i === tick % ALERTS.length) return `${a} [ACTIVE]`;
    if ((tick + i) % 5 === 0) return `${a} [WATCH]`;
    return `${a} [MONITOR]`;
  });
}

export function buildMicrostructure(orderBook: OrderBookLevel[], tape: TapePrint[], tick: number): MicrostructureStats {
  const top = orderBook[0];
  const spread = top ? ((top.ask - top.bid) / Math.max(0.0001, (top.ask + top.bid) / 2)) * 10_000 : 0;
  const totalBid = orderBook.reduce((acc, l) => acc + l.bidSize, 0);
  const totalAsk = orderBook.reduce((acc, l) => acc + l.askSize, 0);
  const imbalance = totalBid + totalAsk > 0 ? (totalBid - totalAsk) / (totalBid + totalAsk) : 0;
  const buyFlow = tape.filter((t) => t.side === 'BUY').reduce((acc, t) => acc + t.size, 0);
  const sellFlow = tape.filter((t) => t.side === 'SELL').reduce((acc, t) => acc + t.size, 0);
  const orderFlowImbalance = buyFlow + sellFlow > 0 ? (buyFlow - sellFlow) / (buyFlow + sellFlow) : 0;
  const sweep = tape.find((t) => t.isSweep);
  return {
    insideSpreadBps: Number(spread.toFixed(3)),
    imbalance: Number(imbalance.toFixed(3)),
    orderFlowImbalance: Number(orderFlowImbalance.toFixed(3)),
    sweep: sweep
      ? {
          active: true,
          side: sweep.side,
          intensity: clamp(Math.round((sweep.size / 600) * 100), 20, 100),
          text: `${sweep.side} SWEEP ${sweep.size}`,
        }
      : {
          active: tick % 17 === 0,
          side: 'NONE',
          intensity: 0,
          text: 'NONE',
        },
  };
}

export function functionDeck(functionCode: FunctionCode, risk: TerminalState['risk'], micro: MicrostructureStats): Array<[string, string]> {
  if (functionCode === 'DES') return [['Sector', 'Technology'], ['MktCap', '$3.1T'], ['52W', '144.8 - 213.2'], ['Beta', `${risk.beta.toFixed(2)}`], ['RevTTM', '$389.5B'], ['Float', '15.6B'], ['Index', 'SPX NDX'], ['Venue', 'NASDAQ']];
  if (functionCode === 'FA') return [['GrossMgn', '45.6%'], ['OpMgn', '30.3%'], ['ROE', '152.7%'], ['Debt/EBITDA', '1.8x'], ['FCFYield', '3.6%'], ['P/E', '31.2'], ['EV/EBITDA', '22.4'], ['PEG', '1.8']];
  if (functionCode === 'WEI') return [['RV', `${risk.realizedVol}%`], ['IVx', `${risk.impliedVolProxy}%`], ['CorrSPX', `${risk.corrToBenchmark}`], ['Spread', `${micro.insideSpreadBps}bp`], ['Regime', risk.regime], ['OFI', `${(micro.orderFlowImbalance * 100).toFixed(1)}%`], ['Imb', `${(micro.imbalance * 100).toFixed(1)}%`]];
  if (functionCode === 'YAS') return [['YTW', '4.91%'], ['Duration', '7.18'], ['Convexity', '0.90'], ['Spread', `${micro.insideSpreadBps}bp`], ['ZSpread', '172 bps'], ['DV01', '$18.3k'], ['OAS', '186 bps']];
  if (functionCode === 'ECO') return [['CPI', 'Tue 08:30'], ['FOMC', 'Wed 14:00'], ['NFP', 'Fri 08:30'], ['ECB', 'Thu 13:15'], ['BoJ', 'Fri 03:00'], ['Retail', 'Wed 08:30'], ['PMI', 'Mon 09:45']];
  if (functionCode === 'TOP') return [['LeadTheme', 'Rates + Growth'], ['OFI', `${(micro.orderFlowImbalance * 100).toFixed(1)}%`], ['Imbalance', `${(micro.imbalance * 100).toFixed(1)}%`], ['Sweep', micro.sweep.text], ['Regime', risk.regime], ['Beta', risk.beta.toFixed(2)], ['Corr', `${risk.corrToBenchmark}`]];
  if (functionCode === 'HP') return [['Headline', 'Risk assets firmer'], ['Sentiment', 'Constructive'], ['Catalyst', 'Macro data'], ['Impact', 'Moderate'], ['DeskFocus', 'Index tech'], ['Breadth', '62% adv'], ['Vol', `${risk.realizedVol}%`]];
  return [['Query', 'Ticker + topic'], ['Ranking', 'Relevance'], ['Sources', 'Cross-wire'], ['Recency', 'High'], ['Priority', 'Desk'], ['OFI', `${(micro.orderFlowImbalance * 100).toFixed(1)}%`]];
}

export type TickBatch = {
  tick: number;
  tickMs: number;
  regime: VolatilityRegime;
  quotes: Quote[];
  orderBook: OrderBookLevel[];
  tape: TapePrint[];
  blotter: BlotterRow[];
  executionEvents: ExecutionEvent[];
  headlines: string[];
  alerts: string[];
  barsBySymbol: Record<string, IntradayBar[]>;
  micro: MicrostructureStats;
};

export type QuotesStreamBatch = {
  streamTick: number;
  tickMs: number;
  regime: VolatilityRegime;
  quotes: Quote[];
};

export type DepthTapeStreamBatch = {
  streamTick: number;
  tickMs: number;
  orderBook: OrderBookLevel[];
  tape: TapePrint[];
  micro: MicrostructureStats;
};

export type ExecutionStreamBatch = {
  streamTick: number;
  blotter: BlotterRow[];
  executionEvents: ExecutionEvent[];
  barsBySymbol: Record<string, IntradayBar[]>;
};

export type ExecutionPolicyInput = {
  mode: 'MACRO_CONTROLLED' | 'MANUAL_OVERRIDE';
  symbol: string;
  urgencyMultiplier: number;
  participationRate: number;
  routingAggressiveness: number;
  maxNotional: number;
  maxSlippageBps: number;
  killSwitch: boolean;
  reasonCode?: string;
};

export type FeedStreamBatch = {
  streamTick: number;
  headlines: string[];
  alerts: string[];
};

export function streamTickMs(streamTick: number, intervalMs: number) {
  return 1_711_800_000_000 + streamTick * intervalMs;
}

export function buildQuotesStream(seed: number, streamTick: number, intervalMs: number): QuotesStreamBatch {
  return {
    streamTick,
    tickMs: streamTickMs(streamTick, intervalMs),
    regime: regimeFromTick(streamTick),
    quotes: nextQuotes(seed, streamTick),
  };
}

export function buildDepthTapeStream(seed: number, streamTick: number, tickMs: number, activePrice: number): DepthTapeStreamBatch {
  const orderBook = buildOrderBook(activePrice, streamTick, seed);
  const hhmmss = new Date(tickMs).toISOString().slice(11, 19);
  const tape = buildTape(orderBook, hhmmss, streamTick, seed);
  return {
    streamTick,
    tickMs,
    orderBook,
    tape,
    micro: buildMicrostructure(orderBook, tape, streamTick),
  };
}

export function buildExecutionStream(
  streamTick: number,
  tickMs: number,
  quotes: Quote[],
  previousBlotter: BlotterRow[],
  tape: TapePrint[],
  previousBarsBySymbol: Record<string, IntradayBar[]>,
  executionPolicy?: ExecutionPolicyInput,
): ExecutionStreamBatch {
  const baseBlotter = buildBlotter(quotes, previousBlotter, tape, streamTick);
  const blotter = baseBlotter.map((row) => {
    if (!executionPolicy || row.symbol !== executionPolicy.symbol) return row;
    const baseQty = Math.max(1, row.qty);
    const targetQty = Math.max(1, Math.round(baseQty * executionPolicy.participationRate * executionPolicy.urgencyMultiplier));
    const cappedQty = Math.max(1, Math.min(targetQty, Math.floor(executionPolicy.maxNotional / Math.max(0.01, row.last))));
    const slippageBps = (Math.abs(row.last - row.avg) / Math.max(0.01, row.avg)) * 10_000;
    const blocked = executionPolicy.killSwitch || slippageBps > executionPolicy.maxSlippageBps;
    return {
      ...row,
      qty: cappedQty,
      status: blocked ? 'WORKING' : row.status,
    };
  });
  const executionEvents = buildExecutionEvents(blotter, previousBlotter, tape, tickMs, executionPolicy);
  const barsBySymbol: Record<string, IntradayBar[]> = {};
  for (const q of quotes) {
    barsBySymbol[q.symbol] = buildBarsForSymbol(previousBarsBySymbol[q.symbol], q, streamTick, tickMs);
  }
  return { streamTick, blotter, executionEvents, barsBySymbol };
}

export function buildFeedStream(streamTick: number, sweepActive: boolean): FeedStreamBatch {
  return {
    streamTick,
    headlines: rotateHeadlines(streamTick),
    alerts: activeAlerts(streamTick, sweepActive),
  };
}

export function buildTickBatch(prev: TerminalState, nextTick: number): TickBatch {
  const tickMs = 1_711_800_000_000 + nextTick * 900;
  const regime = regimeFromTick(nextTick);
  const quotes = nextQuotes(prev.seed, nextTick);
  const symbolPrefix = `${prev.security.ticker}${prev.security.market ? ` ${prev.security.market}` : ''}`;
  const active = quotes.find((q) => q.symbol.startsWith(symbolPrefix)) ?? quotes[0];
  const orderBook = buildOrderBook(active.last, nextTick, prev.seed);
  const hhmmss = new Date(tickMs).toISOString().slice(11, 19);
  const tape = buildTape(orderBook, hhmmss, nextTick, prev.seed);
  const blotter = buildBlotter(quotes, prev.blotter, tape, nextTick);
  const executionEvents = buildExecutionEvents(blotter, prev.blotter, tape, tickMs);
  const micro = buildMicrostructure(orderBook, tape, nextTick);

  const barsBySymbol: Record<string, IntradayBar[]> = {};
  for (const q of quotes) {
    barsBySymbol[q.symbol] = buildBarsForSymbol(prev.barsBySymbol[q.symbol], q, nextTick, tickMs);
  }

  return {
    tick: nextTick,
    tickMs,
    regime,
    quotes,
    orderBook,
    tape,
    blotter,
    executionEvents,
    headlines: rotateHeadlines(nextTick),
    alerts: activeAlerts(nextTick, micro.sweep.active),
    barsBySymbol,
    micro,
  };
}
