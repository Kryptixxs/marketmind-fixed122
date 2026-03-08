'use client';

const KEY = 'vantage-mnemonic-ui-v1';

type UiStateMap = Record<string, Record<string, unknown>>;

function loadAll(): UiStateMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UiStateMap;
  } catch {
    return {};
  }
}

function saveAll(state: UiStateMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function k(panelIdx: number, mnemonic: string) {
  return `p${panelIdx}:${mnemonic}`;
}

export function loadMnemonicUiState<T extends Record<string, unknown>>(panelIdx: number, mnemonic: string, fallback: T): T {
  const all = loadAll();
  const entry = all[k(panelIdx, mnemonic)];
  return { ...fallback, ...(entry ?? {}) } as T;
}

export function saveMnemonicUiState(panelIdx: number, mnemonic: string, state: Record<string, unknown>) {
  const all = loadAll();
  all[k(panelIdx, mnemonic)] = state;
  saveAll(all);
}

