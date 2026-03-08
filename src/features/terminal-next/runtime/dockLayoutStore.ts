'use client';

export type DockMode = 'tile' | 'tab' | 'stack';
export type PinbarDock = 'top' | 'bottom' | 'left' | 'right';

export interface DockLayoutState {
  mode: DockMode;
  columns: number;
  floatingPanels: number[];
  focusFullscreen: boolean;
  pinbarVisible: boolean;
  pinbarDock: PinbarDock;
  navtreeVisible: boolean;
}

const KEY = 'vantage-dock-layout-v1';

const DEFAULT_STATE: DockLayoutState = {
  mode: 'tile',
  columns: 2,
  floatingPanels: [],
  focusFullscreen: false,
  pinbarVisible: true,
  pinbarDock: 'top',
  navtreeVisible: true,
};

let state: DockLayoutState = DEFAULT_STATE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function save() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadDockLayout() {
  if (typeof window === 'undefined') return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw) as Partial<DockLayoutState>;
    state = { ...DEFAULT_STATE, ...parsed };
  } catch {
    state = DEFAULT_STATE;
  }
  return state;
}

export function getDockLayout() {
  return state;
}

export function setDockLayout(next: Partial<DockLayoutState>) {
  state = { ...state, ...next };
  save();
  emit();
}

export function setPanelFloating(panelIdx: number, floating: boolean) {
  const set = new Set(state.floatingPanels);
  if (floating) set.add(panelIdx);
  else set.delete(panelIdx);
  setDockLayout({ floatingPanels: Array.from(set).sort((a, b) => a - b) });
}

export function subscribeDockLayout(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

