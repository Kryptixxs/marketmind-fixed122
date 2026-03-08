import type { MnemonicCategory } from '../mnemonics/catalog';
import { makeCountry, makeField, makeFunction, makeHolder, makeNews, makeSecurity, makeSector, type EntityRef } from '../runtime/entities/types';
import { makeFieldValueEntity } from './fieldRuntime';

export interface FabricInstrument {
  id: string;
  sym: string;
  name: string;
  assetClass: 'EQUITY' | 'ETF' | 'INDEX' | 'FX' | 'RATE' | 'FUTURE' | 'OPTION';
  sector: string;
  industry: string;
  country: string;
  exchange: string;
}

export interface FabricRelationshipEdge {
  id: string;
  from: string;
  to: string;
  type: 'SUPPLY' | 'CUSTOMER' | 'SECTOR' | 'CORRELATION' | 'OWNERSHIP';
  strength: number;
}

export interface FabricNewsItem {
  id: string;
  headline: string;
  ts: string;
  source: 'SIM' | 'LIVE';
  geo: string;
  entities: string[];
}

export interface FabricOwnershipRow {
  id: string;
  holder: string;
  stakePct: number;
  sharesM: number;
  valueBn: number;
}

export interface FabricPositionRow {
  id: string;
  symbol: string;
  qty: number;
  px: number;
  pnl: number;
  beta: number;
}

export interface FabricRatesPoint {
  tenor: string;
  yld: number;
  spread: number;
}

const SECTORS = ['Technology', 'Financials', 'Healthcare', 'Industrials', 'Energy', 'Consumer', 'Materials', 'Utilities', 'Real Estate'];
const INDUSTRIES = ['Software', 'Banks', 'Biotech', 'Aerospace', 'Oil&Gas', 'Retail', 'Chemicals', 'Power', 'REIT'];
const COUNTRIES = ['US', 'GB', 'JP', 'DE', 'FR', 'CN', 'IN', 'AU', 'CA', 'BR'];
const EXCH = ['NASDAQ', 'NYSE', 'LSE', 'TSE', 'HKEX', 'EUREX', 'CME'];

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

export function estimateUniverseSize(): number {
  return 120_000;
}

export function getInstrumentByIndex(i: number): FabricInstrument {
  const ticker = `MM${String(i).padStart(6, '0')}`;
  const seed = h(ticker);
  const cls = (['EQUITY', 'ETF', 'INDEX', 'FX', 'RATE', 'FUTURE', 'OPTION'] as const)[seed % 7]!;
  const country = COUNTRIES[seed % COUNTRIES.length]!;
  return {
    id: `INS-${i}`,
    sym: cls === 'FX' ? `${country}USD Curncy` : `${ticker} ${country} ${cls === 'INDEX' ? 'Index' : 'Equity'}`,
    name: `MarketMind ${ticker}`,
    assetClass: cls,
    sector: SECTORS[seed % SECTORS.length]!,
    industry: INDUSTRIES[seed % INDUSTRIES.length]!,
    country,
    exchange: EXCH[seed % EXCH.length]!,
  };
}

export function getInstrumentSlice(start: number, count: number): FabricInstrument[] {
  return Array.from({ length: count }, (_, idx) => getInstrumentByIndex(start + idx));
}

export function buildPriceSeries(seedKey: string, points = 120): number[] {
  const seed = h(seedKey);
  const base = 80 + (seed % 420);
  let p = base;
  return Array.from({ length: points }, (_, i) => {
    const drift = Math.sin((i + seed % 17) * 0.08) * 0.9;
    const noise = ((seed + i * 13) % 100 - 50) / 120;
    p = Math.max(1, p + drift + noise);
    return Number(p.toFixed(2));
  });
}

export function buildVolSeries(seedKey: string, points = 80): number[] {
  const seed = h(`${seedKey}-vol`);
  return Array.from({ length: points }, (_, i) => Number((12 + Math.abs(Math.sin((seed + i) * 0.17)) * 28).toFixed(2)));
}

export function buildReturnSeries(seedKey: string, points = 120): number[] {
  const prices = buildPriceSeries(`${seedKey}-ret`, points + 1);
  const out: number[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1] ?? 1;
    const cur = prices[i] ?? 1;
    out.push(Number((((cur - prev) / prev) * 100).toFixed(3)));
  }
  return out;
}

export function buildRateCurve(seedKey: string): FabricRatesPoint[] {
  const seed = h(`${seedKey}-curve`);
  const tenors = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
  return tenors.map((tenor, i) => {
    const base = 1.2 + i * 0.17;
    const twist = Math.sin((seed + i * 5) * 0.11) * 0.23;
    const yld = Number((base + twist).toFixed(3));
    return {
      tenor,
      yld,
      spread: Number((yld - 2.35).toFixed(3)),
    };
  });
}

export function buildNewsStream(seedKey: string, count = 80): FabricNewsItem[] {
  const seed = h(seedKey);
  const topics = ['earnings', 'guidance', 'supply chain', 'policy', 'macro', 'credit', 'volatility', 'flow'];
  return Array.from({ length: count }, (_, i) => {
    const t = topics[(seed + i) % topics.length]!;
    const geo = COUNTRIES[(seed + i * 3) % COUNTRIES.length]!;
    const ts = new Date(Date.now() - i * 17 * 60 * 1000).toISOString();
    return {
      id: `NEWS-${seed}-${i}`,
      headline: `${seedKey.split(' ')[0]} ${t} signal ${i + 1}`,
      ts,
      source: i % 6 === 0 ? 'LIVE' : 'SIM',
      geo,
      entities: [seedKey.split(' ')[0]!, geo, SECTORS[(seed + i) % SECTORS.length]!],
    };
  });
}

export function buildRelationshipEdges(seedKey: string, count = 120): FabricRelationshipEdge[] {
  const seed = h(seedKey);
  const kinds: FabricRelationshipEdge['type'][] = ['SUPPLY', 'CUSTOMER', 'SECTOR', 'CORRELATION', 'OWNERSHIP'];
  return Array.from({ length: count }, (_, i) => ({
    id: `REL-${seed}-${i}`,
    from: seedKey.split(' ')[0]!,
    to: `MM${String(20000 + ((seed + i * 9) % 90000)).padStart(6, '0')}`,
    type: kinds[(seed + i) % kinds.length]!,
    strength: 0.3 + ((seed + i * 11) % 70) / 100,
  }));
}

export function buildOwnershipRows(seedKey: string, count = 36): FabricOwnershipRow[] {
  const seed = h(`${seedKey}-own`);
  return Array.from({ length: count }, (_, i) => ({
    id: `OWN-${seed}-${i}`,
    holder: `Holder ${String(i + 1).padStart(2, '0')}`,
    stakePct: Number((0.2 + ((seed + i * 7) % 900) / 100).toFixed(2)),
    sharesM: Number((10 + ((seed + i * 13) % 280)).toFixed(1)),
    valueBn: Number((0.2 + ((seed + i * 5) % 240) / 10).toFixed(2)),
  }));
}

export function buildPortfolioRows(seedKey: string, count = 140): FabricPositionRow[] {
  const seed = h(`${seedKey}-port`);
  return Array.from({ length: count }, (_, i) => {
    const inst = getInstrumentByIndex((seed * 3 + i * 11) % estimateUniverseSize());
    const px = 15 + ((seed + i * 7) % 500);
    const qty = 100 + ((seed + i * 17) % 9000);
    const pnl = ((seed + i * 29) % 4000) - 2000;
    return {
      id: `POS-${i}`,
      symbol: inst.sym,
      qty,
      px: Number(px.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      beta: Number((0.4 + ((seed + i * 5) % 180) / 100).toFixed(2)),
    };
  });
}

export function denseRowsForMnemonic(category: MnemonicCategory, security: string, rowCount = 260): Array<Record<string, unknown>> {
  const base = h(`${category}-${security}`);
  const start = (base * 17) % Math.max(1000, estimateUniverseSize() - rowCount);
  return getInstrumentSlice(start, rowCount).map((ins, i) => {
    const seed = h(ins.sym + i);
    const last = 20 + (seed % 1800) + ((seed % 97) / 100);
    const pct = ((seed % 120) - 60) / 10;
    const vol = 0.5 + (seed % 250) / 10;
    const score = 35 + (seed % 65);
    return {
      id: ins.id,
      sym: ins.sym,
      name: ins.name,
      sector: ins.sector,
      country: ins.country,
      last,
      pct,
      vol,
      score,
    };
  });
}

export function relatedEntitiesFor(security: string, count = 24): EntityRef[] {
  const seed = h(security);
  return Array.from({ length: count }, (_, i) => {
    const v = (seed + i * 19) % 7;
    if (v === 0) return makeSecurity(`MM${String(1000 + i).padStart(6, '0')} US Equity`);
    if (v === 1) return makeSector(SECTORS[(seed + i) % SECTORS.length]!);
    if (v === 2) return makeHolder(`Holder ${i + 1}`, 1 + ((seed + i) % 10));
    if (v === 3) return makeCountry(COUNTRIES[(seed + i) % COUNTRIES.length]!, COUNTRIES[(seed + i) % COUNTRIES.length]!);
    if (v === 4) return makeNews(`${security.split(' ')[0]} supply chain update ${i + 1}`, 'BBG');
    if (v === 5) return makeFieldValueEntity('PX_LAST', 120 + ((seed + i) % 80));
    return makeFunction('RELS', 'Related Securities');
  });
}

export function evidenceRowsFor(security: string): Array<Record<string, unknown>> {
  const seed = h(security);
  return Array.from({ length: 18 }, (_, i) => ({
    id: `EV-${i}`,
    evidence: `Entity-link confidence path ${i + 1}`,
    score: 45 + ((seed + i * 7) % 55),
    source: i % 3 === 0 ? 'SIM' : i % 3 === 1 ? 'LIVE' : 'STALE',
    field: makeField(`EV_FIELD_${(i % 9) + 1}`),
  }));
}

