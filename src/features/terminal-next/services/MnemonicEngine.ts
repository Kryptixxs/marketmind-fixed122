'use client';

import type { TerminalFunction } from '../types';

/**
 * MnemonicEngine – Bloomberg-style mnemonic registry.
 * Maps typed codes (WEI, N, GP, etc.) to functions and suggested completions.
 */

export interface MnemonicEntry {
  code: string;
  label: string;
  desc: string;
}

export const MNEMONIC_REGISTRY: MnemonicEntry[] = [
  { code: 'WEI', label: 'World Equity Indices', desc: 'Cross-asset index monitor' },
  { code: 'GP', label: 'Graph Price', desc: 'General price chart' },
  { code: 'GIP', label: 'Intraday Price', desc: 'Intraday charting' },
  { code: 'GCDS', label: 'Credit Default Swaps', desc: 'CDS analytics' },
  { code: 'N', label: 'News', desc: 'News wire and headlines' },
  { code: 'MKT', label: 'Market Context', desc: 'Macro regime and symbol impact' },
  { code: 'EXEC', label: 'Execution Cockpit', desc: 'Order execution' },
  { code: 'DES', label: 'Description', desc: 'Security attributes' },
  { code: 'FA', label: 'Financial Analysis', desc: 'Fundamentals' },
  { code: 'HP', label: 'Historical Pricing', desc: 'Price history' },
  { code: 'YAS', label: 'Yield & Spread', desc: 'Fixed income analytics' },
  { code: 'OVME', label: 'Options Volatility', desc: 'Vol regime and Greeks' },
  { code: 'PORT', label: 'Portfolio', desc: 'Exposure and risk' },
  { code: 'NEWS', label: 'News & Events', desc: 'Event intelligence' },
  { code: 'CAL', label: 'Calendar', desc: 'Catalyst calendar' },
  { code: 'SEC', label: 'SEC Filings', desc: 'Filings and ownership' },
  { code: 'INTEL', label: 'Relationship Intel', desc: 'Entity relationships' },
  { code: 'IMAP', label: 'Sector Heatmap', desc: 'Treemap by market cap, color by % change' },
  { code: 'ECO', label: 'Economic Calendar', desc: 'Upcoming economic events' },
  { code: 'FXC', label: 'FX Cross Matrix', desc: 'Currency exchange rate matrix' },
  { code: 'GC', label: 'Yield Curve', desc: 'Treasury yield curve' },
  { code: 'IB', label: 'Instant Bloomberg', desc: 'Trader chat' },
  { code: 'GRAB', label: 'Export Table', desc: 'Download current panel data as JSON' },
];

/**
 * Filter suggestions by typed prefix. Typing "G" returns GP, GIP, GCDS, etc.
 */
export function getSuggestions(prefix: string): MnemonicEntry[] {
  const p = prefix.trim().toUpperCase();
  if (!p) return MNEMONIC_REGISTRY.slice(0, 8);
  return MNEMONIC_REGISTRY.filter(
    (e) => e.code.startsWith(p) || e.code.toUpperCase().includes(p)
  ).slice(0, 10);
}

/**
 * Resolve a mnemonic code to TerminalFunction (for FunctionRouter).
 */
export function resolveToTerminalFunction(code: string): TerminalFunction | null {
  const c = code.toUpperCase().trim();
  if (c === 'GP' || c === 'GIP') return 'MKT';
  if (c === 'N') return 'NEWS';
  const valid: TerminalFunction[] = [
    'WEI', 'MKT', 'EXEC', 'DES', 'FA', 'HP', 'YAS', 'OVME', 'PORT', 'NEWS', 'CAL', 'SEC', 'INTEL',
    'ECO', 'FXC', 'GC', 'IB',
  ];
  return valid.includes(c as TerminalFunction) ? (c as TerminalFunction) : null;
}
