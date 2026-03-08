const STORAGE_KEY = 'vantage-terminal-state';

export interface PersistedTerminalState {
  activeSymbol?: string;
  functionCode?: string;
  activeFunction?: string;
  zoomedQuadrant?: number | null;
  crtOverlayEnabled?: boolean;
}

export function loadPersistedState(): PersistedTerminalState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedTerminalState;
  } catch {
    return {};
  }
}

export function savePersistedState(state: Partial<PersistedTerminalState>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPersistedState();
    const merged = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}
