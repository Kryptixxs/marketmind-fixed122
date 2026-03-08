/**
 * Commodities – 1000+ rows for virtualization
 */

import type { TerminalTableRow } from '../TerminalTable/types';

const COMMODITIES = [
  'CL1', 'NG1', 'XAUUSD', 'XAGUSD', 'HG1', 'GC1', 'SI1', 'PL1', 'PA1', 'ZC1',
  'ZW1', 'ZS1', 'ZW1', 'CC1', 'SB1', 'KC1', 'CT1', 'LG1', 'LE1', 'GF1', 'HE1',
  'RB1', 'HO1', 'B1', 'W1', 'C1', 'S1', 'SM1', 'BO1', 'COTTON', 'SUGAR', 'COFFEE',
  'COCOA', 'PALLADIUM', 'PLATINUM', 'COPPER', 'ALUMINUM', 'NICKEL', 'ZINC', 'LEAD',
  'CRUDE', 'NATURALGAS', 'BRENT', 'GASOIL', 'NAPHTHA', 'PROPANE', 'ETHANOL',
];

const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

function genSparkline(seed: number, len: number): number[] {
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < len; i++) {
    v = v + (hash(String(seed + i)) % 9) - 4;
    out.push(Math.max(85, Math.min(115, v)));
  }
  return out;
}

export function buildCommoditiesRows(count = 1000): TerminalTableRow[] {
  const rows: TerminalTableRow[] = [];
  for (let i = 0; i < count; i++) {
    const ticker = COMMODITIES[i % COMMODITIES.length] + (i >= COMMODITIES.length ? `-${Math.floor(i / COMMODITIES.length)}` : '');
    const base = 10 + (hash(ticker) % 2500) / 10;
    const change = ((hash(ticker + 'c') % 61) - 30) / 10;
    const pct = (change / base) * 100;
    const vol = Math.floor((hash(ticker + 'v') % 300) + 20) * 1e5;
    rows.push({
      id: `cmdty-${ticker}-${i}`,
      ticker: `${ticker} Cmdty`,
      price: base,
      change,
      pctChange: pct,
      volume: vol,
      sparkline: genSparkline(hash(ticker) + i, 20),
    });
  }
  return rows;
}
