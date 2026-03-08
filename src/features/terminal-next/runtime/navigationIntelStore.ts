'use client';

export interface BookmarkItem {
  id: string;
  panelIdx: number;
  mnemonic: string;
  security: string;
  filters?: string;
  sector?: string;
  timeframe?: string;
  selectionCursor?: number;
  scrollPosition?: number;
  createdTs: number;
  label: string;
}

export interface TrailStep {
  id: string;
  panelIdx: number;
  action: string;
  mnemonic: string;
  security: string;
  sector?: string;
  timeframe?: string;
  selectionCursor?: number;
  scrollPosition?: number;
  ts: number;
}

const KEY = 'vantage-nav-intel-v1';

interface NavState {
  bookmarks: BookmarkItem[];
  trails: TrailStep[];
}

const DEFAULT_STATE: NavState = {
  bookmarks: [],
  trails: [],
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadState(): NavState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<NavState>) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: NavState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures.
  }
}

export function listBookmarks() {
  return loadState().bookmarks;
}

export function addBookmark(item: Omit<BookmarkItem, 'id' | 'createdTs'>) {
  const state = loadState();
  const next: BookmarkItem = { ...item, id: uid('bkmk'), createdTs: Date.now() };
  saveState({ ...state, bookmarks: [next, ...state.bookmarks].slice(0, 500) });
}

export function removeBookmark(id: string) {
  const state = loadState();
  saveState({ ...state, bookmarks: state.bookmarks.filter((b) => b.id !== id) });
}

export function listTrailSteps(panelIdx?: number) {
  const trails = loadState().trails;
  if (panelIdx === undefined) return trails;
  return trails.filter((t) => t.panelIdx === panelIdx);
}

export function addTrailStep(step: Omit<TrailStep, 'id' | 'ts'>) {
  const state = loadState();
  const latest = state.trails[0];
  if (
    latest &&
    latest.panelIdx === step.panelIdx &&
    latest.action === step.action &&
    latest.mnemonic === step.mnemonic &&
    latest.security === step.security &&
    Date.now() - latest.ts < 1200
  ) {
    return;
  }
  const next: TrailStep = { ...step, id: uid('trail'), ts: Date.now() };
  saveState({ ...state, trails: [next, ...state.trails].slice(0, 2000) });
}
