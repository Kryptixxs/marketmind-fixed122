import { BlotterRow, IntradayBar, MicrostructureStats, Quote, RiskSnapshot, VolatilityRegime } from '../types';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

function std(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(variance, 0));
}

function returnsFromBars(bars: IntradayBar[]) {
  const out: number[] = [];
  for (let i = 1; i < bars.length; i += 1) {
    if (bars[i - 1].close === 0) continue;
    out.push((bars[i].close - bars[i - 1].close) / bars[i - 1].close);
  }
  return out;
}

function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 4) return 0;
  const aa = a.slice(-n);
  const bb = b.slice(-n);
  const meanA = aa.reduce((s, v) => s + v, 0) / n;
  const meanB = bb.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = aa[i] - meanA;
    const db = bb[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

function classifyRegime(realizedVol: number, spread: number, imbalance: number): VolatilityRegime {
  if (realizedVol > 1.35 || spread > 2.4 || Math.abs(imbalance) > 0.28) return 'VOL_EXPANSION';
  if (realizedVol < 0.7 && spread < 1.2) return 'MEAN_REVERT';
  return 'TREND';
}

export function deriveRiskSnapshot(params: {
  quotes: Quote[];
  blotter: BlotterRow[];
  barsBySymbol: Record<string, IntradayBar[]>;
  micro: MicrostructureStats;
  activeSymbol: string;
}): RiskSnapshot {
  const { quotes, blotter, barsBySymbol, micro, activeSymbol } = params;
  const grossExposure = blotter.reduce((acc, b) => acc + Math.abs(b.last * b.qty), 0);
  const netExposure = blotter.reduce((acc, b) => acc + (b.side === 'BUY' ? 1 : -1) * b.last * b.qty, 0);
  const top3 = [...blotter]
    .sort((a, b) => Math.abs(b.last * b.qty) - Math.abs(a.last * a.qty))
    .slice(0, 3)
    .reduce((acc, b) => acc + Math.abs(b.last * b.qty), 0);
  const concentration = grossExposure > 0 ? (top3 / grossExposure) * 100 : 0;

  const activeBars = barsBySymbol[activeSymbol] ?? [];
  const activeRets = returnsFromBars(activeBars);
  const spxRets = returnsFromBars(barsBySymbol['SPX Index'] ?? []);
  const ndxRets = returnsFromBars(barsBySymbol['NDX Index'] ?? []);

  const retVol = std(activeRets);
  const realizedVol = retVol * Math.sqrt(252 * 6.5 * 60);
  const corrSPX = correlation(activeRets, spxRets);
  const corrNDX = correlation(activeRets, ndxRets);
  const beta = corrSPX * (std(activeRets) / Math.max(0.000001, std(spxRets)));
  const impliedVolProxy = realizedVol * (1.06 + Math.abs(micro.insideSpreadBps) / 60);
  const regime = classifyRegime(realizedVol, micro.insideSpreadBps, micro.imbalance);
  const intradayVar = grossExposure * (realizedVol / 100) * 1.65;

  const sectors = ['Tech', 'Comm', 'Auto', 'Index', 'Rates', 'FX', 'Cmdty'];
  const symbolSector = new Map<string, string>([
    ['AAPL US', 'Tech'],
    ['MSFT US', 'Tech'],
    ['NVDA US', 'Tech'],
    ['META US', 'Comm'],
    ['AMZN US', 'Comm'],
    ['TSLA US', 'Auto'],
    ['SPX Index', 'Index'],
    ['NDX Index', 'Index'],
    ['US10Y Govt', 'Rates'],
    ['EURUSD Curncy', 'FX'],
    ['USDJPY Curncy', 'FX'],
    ['XAUUSD Cmdty', 'Cmdty'],
  ]);

  const exposureBySector = sectors.map((sector) => {
    const value = blotter
      .filter((b) => symbolSector.get(b.symbol) === sector)
      .reduce((acc, b) => acc + (b.side === 'BUY' ? 1 : -1) * b.last * b.qty, 0);
    const sectorQuotes = quotes.filter((q) => symbolSector.get(q.symbol) === sector);
    const pctChange =
      sectorQuotes.length > 0
        ? sectorQuotes.reduce((s, q) => s + q.pct, 0) / sectorQuotes.length
        : (hash(sector) % 61 - 30) / 10;
    return { sector, value: Number(value.toFixed(0)), pctChange };
  });

  return {
    intradayVar: Number(intradayVar.toFixed(0)),
    grossExposure: Number(grossExposure.toFixed(0)),
    netExposure: Number(netExposure.toFixed(0)),
    concentration: Number(concentration.toFixed(1)),
    beta: Number(clamp(beta, -3.5, 3.5).toFixed(2)),
    corrToBenchmark: Number(clamp((corrSPX + corrNDX) / 2, -0.99, 0.99).toFixed(2)),
    realizedVol: Number(clamp(realizedVol, 0.1, 250).toFixed(2)),
    impliedVolProxy: Number(clamp(impliedVolProxy, 0.1, 300).toFixed(2)),
    regime,
    exposureBySector,
  };
}
