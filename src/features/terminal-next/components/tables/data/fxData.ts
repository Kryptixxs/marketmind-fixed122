/**
 * FX Pairs – 1000+ rows for virtualization
 */

import type { TerminalTableRow } from '../TerminalTable/types';

const PAIRS = [
  'EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY',
  'EURGBP', 'EURCHF', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCAD', 'GBPAUD', 'GBPCAD',
  'AUDNZD', 'AUDCAD', 'CADJPY', 'CHFJPY', 'NZDJPY', 'USDMXN', 'USDTRY', 'USDZAR',
  'USDSEK', 'USDNOK', 'USDDKK', 'EURSEK', 'EURNOK', 'EURTRY', 'GBPCHF', 'AUDCHF',
];

const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

function genSparkline(seed: number, len: number): number[] {
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < len; i++) {
    v = v + (hash(String(seed + i)) % 5) - 2;
    out.push(Math.max(95, Math.min(105, v)));
  }
  return out;
}

export function buildFxRows(count = 1000): TerminalTableRow[] {
  const rows: TerminalTableRow[] = [];
  for (let i = 0; i < count; i++) {
    const pair = PAIRS[i % PAIRS.length] + (i >= PAIRS.length ? `-${Math.floor(i / PAIRS.length)}` : '');
    const base = 0.8 + (hash(pair) % 4000) / 10000;
    const change = ((hash(pair + 'c') % 101) - 50) / 10000;
    const pct = (change / base) * 100;
    const vol = Math.floor((hash(pair + 'v') % 200) + 50) * 1e6;
    rows.push({
      id: `fx-${pair}-${i}`,
      ticker: `${pair} Curncy`,
      price: base,
      change,
      pctChange: pct,
      volume: vol,
      sparkline: genSparkline(hash(pair) + i, 20),
    });
  }
  return rows;
}
