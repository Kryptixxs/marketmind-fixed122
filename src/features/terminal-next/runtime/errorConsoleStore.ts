'use client';

export type ErrorKind = 'PARSER' | 'FEED' | 'DRILL' | 'POLICY' | 'STORAGE' | 'PERMISSION';

export interface ErrorConsoleEntry {
  id: string;
  ts: number;
  kind: ErrorKind;
  panelIdx: number;
  message: string;
  recovery: string;
  entity?: string;
}

const KEY = 'vantage-error-console-v1';

export function listErrorEntries(limit = 500): ErrorConsoleEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as ErrorConsoleEntry[]) : [];
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

export function appendErrorEntry(entry: Omit<ErrorConsoleEntry, 'id' | 'ts'>) {
  if (typeof window === 'undefined') return;
  const next: ErrorConsoleEntry = {
    ...entry,
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
  };
  try {
    const merged = [next, ...listErrorEntries(1000)].slice(0, 1000);
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage failures.
  }
}
