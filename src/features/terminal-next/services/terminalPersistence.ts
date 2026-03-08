const STORAGE_KEY = 'vantage-terminal-state';
const LAYOUT_KEY = 'vantage-terminal-layout';

export interface PersistedTerminalState {
  activeSymbol?: string;
  functionCode?: string;
  activeFunction?: string;
  zoomedQuadrant?: number | null;
  crtOverlayEnabled?: boolean;
}

export interface PersistedLayoutState {
  /** Panel size percentages [top-left, top-right, bottom-left, bottom-right] */
  panelSizes?: number[];
  /** Chart type preference: candlestick | line | area */
  chartType?: 'candlestick' | 'line' | 'area';
  /** Grid column/row ratios for resizable layout */
  gridLayout?: string;
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

export function loadPersistedLayout(): PersistedLayoutState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedLayoutState;
  } catch {
    return {};
  }
}

export function savePersistedLayout(layout: Partial<PersistedLayoutState>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPersistedLayout();
    const merged = { ...current, ...layout };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}
