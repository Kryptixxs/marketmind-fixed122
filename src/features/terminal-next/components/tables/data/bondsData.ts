/**
 * Bond Yields – 1000+ rows for virtualization
 */

import type { TerminalTableRow } from '../TerminalTable/types';

const BONDS = [
  'US2Y', 'US5Y', 'US10Y', 'US30Y', 'DE10Y', 'DE2Y', 'DE30Y', 'GB10Y', 'GB2Y',
  'FR10Y', 'IT10Y', 'ES10Y', 'JP10Y', 'JP2Y', 'AU10Y', 'CA10Y', 'US3M', 'US6M',
  'SOFR', 'EFFR', 'BUND', 'GILT', 'BTP', 'JGB', 'OAT', 'BONO', 'US Govt', 'UK Govt',
  'Germany Govt', 'Japan Govt', 'France Govt', 'Italy Govt', 'Spain Govt', 'Canada Govt',
  'Australia Govt', 'Treasury', 'TIPS', 'I Bonds', 'FRN', 'STRIPS',
];

const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

function genSparkline(seed: number, len: number): number[] {
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < len; i++) {
    v = v + (hash(String(seed + i)) % 3) - 1;
    out.push(Math.max(97, Math.min(103, v)));
  }
  return out;
}

export function buildBondsRows(count = 1000): TerminalTableRow[] {
  const rows: TerminalTableRow[] = [];
  for (let i = 0; i < count; i++) {
    const baseTicker = BONDS[i % BONDS.length];
    const ticker = baseTicker + (i >= BONDS.length ? `-${Math.floor(i / BONDS.length)}` : '');
    const suffix = baseTicker.includes('Govt') || baseTicker.includes('Treasury') || baseTicker.includes('TIPS') ? '' : ' Govt';
    const base = 1 + (hash(ticker) % 700) / 100;
    const change = ((hash(ticker + 'c') % 21) - 10) / 100;
    const pct = (change / base) * 100;
    const vol = Math.floor((hash(ticker + 'v') % 500) + 100) * 1e6;
    rows.push({
      id: `bond-${ticker}-${i}`,
      ticker: `${ticker}${suffix}`,
      price: base,
      change,
      pctChange: pct,
      volume: vol,
      sparkline: genSparkline(hash(ticker) + i, 20),
    });
  }
  return rows;
}
