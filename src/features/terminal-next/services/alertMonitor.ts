import type { Quote } from '../types';

const ALERT_KEY = 'vantage-terminal-alert-rules';

export interface PriceAlertRule {
  id: string;
  symbol: string;
  op: '>' | '<';
  value: number;
  createdAt: number;
}

export function loadAlertRules(): PriceAlertRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PriceAlertRule[];
  } catch {
    return [];
  }
}

export function saveAlertRules(rules: PriceAlertRule[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALERT_KEY, JSON.stringify(rules));
  } catch {
    // ignore
  }
}

export function addAlertRule(raw: string): PriceAlertRule | null {
  const normalized = raw.toUpperCase().replace(/\s+/g, ' ').trim();
  const m = normalized.match(/^ALERT IF ([A-Z0-9.]+)\s*(>|<)\s*([0-9]+(?:\.[0-9]+)?)$/);
  if (!m) return null;
  const symbol = `${m[1]} US`;
  const op = m[2] as '>' | '<';
  const value = Number(m[3]);
  if (!Number.isFinite(value)) return null;
  const rule: PriceAlertRule = {
    id: `alrt-${symbol}-${op}-${value}-${Date.now()}`,
    symbol,
    op,
    value,
    createdAt: Date.now(),
  };
  const rules = [rule, ...loadAlertRules()].slice(0, 50);
  saveAlertRules(rules);
  return rule;
}

export function evaluateTriggeredRules(rules: PriceAlertRule[], quotes: Quote[]) {
  const map = new Map(quotes.map((q) => [q.symbol, q.last]));
  return rules.filter((r) => {
    const px = map.get(r.symbol);
    if (px == null) return false;
    return r.op === '>' ? px > r.value : px < r.value;
  });
}

