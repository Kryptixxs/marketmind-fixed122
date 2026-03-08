'use client';

export interface PinItem {
  id: string;
  label: string;
  value: string;
  provenance: 'SIM' | 'LIVE' | 'STALE' | 'CALC';
  targetMnemonic: string;
  targetSecurity?: string;
  fieldId?: string;
  ts: number;
}

const KEY = 'vantage-pinboard-v1';

export function listPinItems(limit = 300): PinItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as PinItem[]) : [];
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

export function addPinItem(item: Omit<PinItem, 'id' | 'ts'>): PinItem {
  const next: PinItem = {
    ...item,
    id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
  };
  if (typeof window === 'undefined') return next;
  try {
    const merged = [next, ...listPinItems(1000)].slice(0, 500);
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage failure.
  }
  return next;
}

export function removePinItem(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const next = listPinItems(1000).filter((p) => p.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failure.
  }
}

export function replacePinItems(items: PinItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 500)));
  } catch {
    // Ignore storage failure.
  }
}
