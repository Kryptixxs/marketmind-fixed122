'use client';

const PREFIX = 'vantage-cmd-history-';
const MAX_LEN = 50;

function keyForPanel(panelIdx: number) {
  return `${PREFIX}${panelIdx}`;
}

export function loadCommandHistory(panelIdx: number): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(keyForPanel(panelIdx));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCommandHistory(panelIdx: number, history: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(keyForPanel(panelIdx), JSON.stringify(history.slice(-MAX_LEN)));
  } catch {
    // Ignore storage failures.
  }
}

export function addCommandHistory(panelIdx: number, command: string): string[] {
  const cmd = command.trim();
  if (!cmd) return loadCommandHistory(panelIdx);
  const current = loadCommandHistory(panelIdx);
  if (current[current.length - 1] === cmd) return current;
  const next = [...current, cmd].slice(-MAX_LEN);
  saveCommandHistory(panelIdx, next);
  return next;
}

export function loadAllCommandHistories(panelCount = 4): string[][] {
  return Array.from({ length: panelCount }, (_, i) => loadCommandHistory(i));
}
