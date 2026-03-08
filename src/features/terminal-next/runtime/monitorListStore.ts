'use client';

const KEY = 'vantage-monitor-list';

const DEFAULT_LIST = ['AAPL US Equity', 'MSFT US Equity', 'NVDA US Equity', 'SPX Index', 'EURUSD Curncy'];

export function loadMonitorList(): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_LIST];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return list.length > 0 ? list : [...DEFAULT_LIST];
  } catch {
    return [...DEFAULT_LIST];
  }
}

export function saveMonitorList(list: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // Ignore storage quota failures in sim mode.
  }
}

export function addToMonitorList(symbol: string) {
  const sym = symbol.trim();
  if (!sym) return;
  const existing = loadMonitorList();
  if (existing.includes(sym)) return;
  saveMonitorList([sym, ...existing]);
}
