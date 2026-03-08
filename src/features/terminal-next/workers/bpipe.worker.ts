/**
 * B-PIPE Web Worker – unified market snapshot generator off main thread.
 * Emits MARKET_SNAPSHOT every intervalMs with quotes + analytics.
 */

const hash = (x: string) => Array.from(x).reduce((a, c) => a + c.charCodeAt(0), 0);

const BASE = [
  { s: 'AAPL US', n: 'Apple Inc', b: 196.5 },
  { s: 'MSFT US', n: 'Microsoft', b: 430.4 },
  { s: 'NVDA US', n: 'NVIDIA', b: 914.1 },
  { s: 'META US', n: 'Meta', b: 511.1 },
  { s: 'AMZN US', n: 'Amazon', b: 183.2 },
  { s: 'TSLA US', n: 'Tesla', b: 214.7 },
  { s: 'GOOGL US', n: 'Alphabet', b: 178.5 },
  { s: 'BRK.B US', n: 'Berkshire', b: 398.2 },
  { s: 'JPM US', n: 'JPMorgan', b: 198.6 },
  { s: 'V US', n: 'Visa', b: 285.3 },
];

const EXTRA = [
  'JNJ', 'WMT', 'XOM', 'PG', 'UNH', 'MA', 'HD', 'LLY', 'BAC', 'ABBV', 'AVGO', 'KO', 'PEP', 'COST', 'MRK',
  'ORCL', 'CSCO', 'ADBE', 'CRM', 'NFLX', 'AMD', 'INTC', 'QCOM', 'TXN', 'AMAT', 'MU', 'SHOP', 'UBER', 'SNOW',
  'PANW', 'CRWD', 'NOW', 'PLTR', 'SQ', 'PYPL', 'DIS', 'NKE', 'SBUX', 'MCD', 'T', 'VZ', 'CMCSA', 'TMUS',
  'CVX', 'COP', 'SLB', 'CAT', 'DE', 'GE', 'HON', 'MMM', 'BA', 'LMT', 'RTX', 'NOC', 'GD', 'F', 'GM', 'RIVN',
  'PFE', 'BMY', 'TMO', 'DHR', 'ABT', 'GILD', 'GS', 'MS', 'BLK', 'SPGI', 'ICE', 'CME', 'SCHW', 'CB', 'AIG',
  'SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLK', 'XLE', 'XLI', 'XLV', 'GLD', 'SLV', 'TLT', 'HYG', 'EEM', 'ARKK',
];

function buildUniverse500() {
  const out: Array<{ symbol: string; name: string; base: number }> = [];
  for (const b of BASE) out.push({ symbol: b.s, name: b.n, base: b.b });
  let idx = 0;
  while (out.length < 500) {
    const t = EXTRA[idx % EXTRA.length]!;
    const seed = hash(t) + idx * 17;
    const base = Number((12 + (seed % 780) + (seed % 37) / 100).toFixed(2));
    out.push({ symbol: `${t} US`, name: `${t} Holdings`, base });
    idx++;
  }
  return out.slice(0, 500);
}

const UNIVERSE_500 = buildUniverse500();

function mulberry32(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let s = Math.imul(t ^ (t >>> 15), 1 | t);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function regimeFromTick(tick: number) {
  const phase = tick % 180;
  if (phase < 70) return 'TREND';
  if (phase < 130) return 'MEAN_REVERT';
  return 'VOL_EXPANSION';
}

function driftByRegime(regime: string, x: number) {
  if (regime === 'TREND') return Math.sin(x) * 1.25 + Math.sin(x * 0.21) * 0.55;
  if (regime === 'MEAN_REVERT') return Math.sin(x) * 0.42 + Math.sin(x * 0.37) * 0.25;
  return Math.sin(x) * 1.75 + Math.cos(x * 0.19) * 0.9;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function seededNoise(seed: number, symbol: string, tick: number) {
  const rand = mulberry32(seed + hash(symbol) + tick * 7919);
  return (rand() - 0.5) * 0.22;
}

function streamTickMs(streamTick: number, intervalMs: number) {
  return 1_711_800_000_000 + streamTick * intervalMs;
}

function nextQuotes(seed: number, tick: number) {
  const regime = regimeFromTick(tick);
  return UNIVERSE_500.map((u, index) => {
    const k = hash(u.symbol);
    const x = (tick + index * 3) * 0.17 + k * 0.0009;
    const regimeDrift = driftByRegime(regime, x);
    const noise = seededNoise(seed, u.symbol, tick);
    const drift = regimeDrift + noise;
    const pct = Number(drift.toFixed(2));
    const last = u.base * (1 + pct / 100);
    const abs = last - u.base;
    const rangeFactor = regime === 'VOL_EXPANSION' ? 1.8 : regime === 'TREND' ? 1.25 : 0.8;
    const range = Math.abs(Math.cos((tick + index) * 0.22 + k * 0.002)) * rangeFactor * (u.base > 100 ? 2.4 : 0.015);
    const volumeM = 1.2 + Math.abs(Math.cos((tick + index) * 0.11 + k * 0.003)) * 8;
    const corrBase = 0.7;
    const corrShift = Math.sin((tick + index) * 0.09) * 0.12;
    const corrToSPX = clamp(corrBase + corrShift, -0.95, 0.99);
    const corrToNDX = clamp(corrBase + 0.05, -0.95, 0.99);
    const betaToSPX = clamp(0.6 + Math.abs(Math.sin((tick + index) * 0.07)) * 1.1, 0.35, 2.2);
    const liquidityScore = clamp(Math.round(40 + Math.abs(Math.cos((tick + index) * 0.1)) * 55), 10, 99);
    const momentum = Number((Math.sin((tick + index) * 0.3) * 1).toFixed(2));
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

type StartMessage = {
  type: 'START';
  seed: number;
  intervalMs: number;
  activeSymbols?: string[];
};

type StopMessage = { type: 'STOP' };

let timer: number | null = null;
let activeSeed = 31051990;
let activeIntervalMs = 100;
let streamTick = 0;
let activeSymbols: string[] = ['AAPL US', 'MSFT US', 'NVDA US'];
const closeHistory = new Map<string, number[]>();

function ema(values: number[], period: number) {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let prev = values[0]!;
  for (let i = 1; i < values.length; i++) prev = values[i]! * k + prev * (1 - k);
  return prev;
}

function computeMacd(series: number[]) {
  if (series.length < 10) return 0;
  return ema(series, 12) - ema(series, 26);
}

function computeAnalytics(quotes: ReturnType<typeof nextQuotes>) {
  const vwapBySymbol: Record<string, number> = {};
  const macdBySymbol: Record<string, number> = {};
  for (const q of quotes) {
    const h = closeHistory.get(q.symbol) ?? [];
    h.push(q.last);
    if (h.length > 120) h.shift();
    closeHistory.set(q.symbol, h);
    const vwap = h.reduce((acc, v, i) => acc + v * (i + 1), 0) / h.reduce((acc, _, i) => acc + (i + 1), 0);
    vwapBySymbol[q.symbol] = Number(vwap.toFixed(4));
    macdBySymbol[q.symbol] = Number(computeMacd(h).toFixed(4));
  }

  const arbitrageSpreads: Array<{ left: string; right: string; spread: number }> = [];
  for (let i = 0; i < activeSymbols.length - 1; i++) {
    const left = quotes.find((q) => q.symbol === activeSymbols[i]);
    const right = quotes.find((q) => q.symbol === activeSymbols[i + 1]);
    if (!left || !right) continue;
    arbitrageSpreads.push({
      left: left.symbol,
      right: right.symbol,
      spread: Number((left.last - right.last).toFixed(4)),
    });
  }
  return { vwapBySymbol, macdBySymbol, arbitrageSpreads };
}

function emitSnapshot() {
  streamTick += 1;
  const tickMs = streamTickMs(streamTick, activeIntervalMs);
  const quotes = nextQuotes(activeSeed, streamTick);
  const regime = regimeFromTick(streamTick);
  const analytics = computeAnalytics(quotes);
  self.postMessage({
    type: 'MARKET_SNAPSHOT',
    payload: {
      streamTick,
      tickMs,
      quotes,
      regime,
      analytics,
      emittedAt: Date.now(),
    },
  });
}

self.onmessage = (e: MessageEvent<StartMessage | StopMessage>) => {
  if (e.data?.type === 'STOP') {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
    return;
  }

  if (e.data?.type === 'START') {
    activeSeed = e.data.seed;
    activeIntervalMs = Math.max(50, e.data.intervalMs);
    activeSymbols = (e.data.activeSymbols ?? activeSymbols).slice(0, 12);
    streamTick = 0;
    if (timer != null) clearInterval(timer);
    emitSnapshot();
    timer = self.setInterval(emitSnapshot, activeIntervalMs);
  }
};
