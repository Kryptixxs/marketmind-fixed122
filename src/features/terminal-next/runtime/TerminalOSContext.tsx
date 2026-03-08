'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { PanelState, PanelAction, panelReducer, createDefaultPanel, LinkColor, MarketSector } from './panelState';
import { saveRecoverySnapshot, loadRecoverySnapshot } from '../services/recoveryStore';
import { loadAllCommandHistories } from './commandHistoryStore';

interface TerminalOSContextValue {
  panels: PanelState[];
  panelCount: number;
  focusedPanel: number;
  setFocusedPanel: (idx: number) => void;
  dispatchPanel: (panelIdx: number, action: PanelAction) => void;
  addPanel: (seedFromPanelIdx?: number) => number;
  closePanel: (panelIdx: number) => void;
  cycleFocus: () => void;
  navigatePanel: (panelIdx: number, mnemonic: string, security?: string, sector?: MarketSector) => void;
  loadSecurityInPanel: (panelIdx: number, security: string, sector?: MarketSector) => void;
}

const TerminalOSCtx = createContext<TerminalOSContextValue | null>(null);

function multiPanelReducer(state: PanelState[], action: { panelIdx: number; action: PanelAction }): PanelState[] {
  const next = [...state];
  const base = state[action.panelIdx] ?? createDefaultPanel(action.panelIdx, 'DES');
  next[action.panelIdx] = panelReducer(base, action.action);

  if (action.action.type === 'SET_SECURITY' || action.action.type === 'NAVIGATE') {
    const src = next[action.panelIdx]!;
    if (src.linkGroup) {
      for (let i = 0; i < next.length; i++) {
        if (i === action.panelIdx) continue;
        if (next[i]!.linkGroup === src.linkGroup) {
          next[i] = panelReducer(next[i]!, {
            type: 'SET_SECURITY',
            security: src.activeSecurity,
            sector: src.marketSector,
          });
        }
      }
    }
  }
  return next;
}

const DEFAULT_PANELS: PanelState[] = [
  createDefaultPanel(0, 'WEI', 'AAPL US Equity'),
  createDefaultPanel(1, 'DES', 'AAPL US Equity'),
  createDefaultPanel(2, 'TOP', 'AAPL US Equity'),
  createDefaultPanel(3, 'GP', 'AAPL US Equity'),
];

export function TerminalOSProvider({ children }: { children: React.ReactNode }) {
  const [panels, dispatch] = useReducer(multiPanelReducer, DEFAULT_PANELS);
  const [focusedPanel, setFocusedPanelRaw] = React.useState(0);
  const saveTimerRef = useRef<number | null>(null);
  const restoredRef = useRef(false);

  // Restore from IndexedDB on mount (once)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    void loadRecoverySnapshot().then((snap) => {
      if (!snap) return;
      if (Date.now() - snap.ts > 2 * 60 * 60 * 1000) return; // 2-hour cutoff
      if (snap.osPanels?.length) {
        snap.osPanels.forEach((panelSnap, idx) => {
          dispatch({ panelIdx: idx, action: { type: 'HYDRATE', snapshot: panelSnap } });
        });
        if (typeof snap.focusedPanel === 'number') {
          setFocusedPanelRaw(Math.max(0, Math.min(Math.max(0, snap.osPanels.length - 1), snap.focusedPanel)));
        }
        return;
      }
      snap.quadrantStates.slice(0, 4).forEach((q, idx) => {
        dispatch({
          panelIdx: idx,
          action: {
            type: 'NAVIGATE',
            mnemonic: q.activeMnemonic ?? 'DES',
            security: q.loadedSecurity,
            sector: (q.sector as MarketSector) ?? 'EQUITY',
          },
        });
      });
    });
  }, []);

  // Auto-save to IndexedDB every 30s (debounced on panel changes)
  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const commandHistories = loadAllCommandHistories(panels.length);
      void saveRecoverySnapshot({
        ts: Date.now(),
        panelFunctions: panels.map((p) => p.activeMnemonic),
        quadrantStates: panels.map((p) => ({
          loadedSecurity: p.activeSecurity,
          activeMnemonic: p.activeMnemonic,
          history: p.history.map((h) => h.mnemonic),
          sector: p.marketSector,
        })),
        panelSizes: [0.25, 0.25, 0.25, 0.25],
        zoomedQuadrant: null,
        lastCommands: [],
        osPanels: panels.map((p) => ({ ...p })),
        focusedPanel,
        commandHistories,
      });
    }, 30000);
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  }, [panels, focusedPanel]);

  const setFocusedPanel = useCallback((idx: number) => {
    if (idx >= 0 && idx < panels.length) setFocusedPanelRaw(idx);
  }, [panels.length]);

  const cycleFocus = useCallback(() => {
    setFocusedPanelRaw((prev) => (prev + 1) % Math.max(1, panels.length));
  }, [panels.length]);

  const dispatchPanel = useCallback((panelIdx: number, action: PanelAction) => {
    dispatch({ panelIdx, action });
  }, []);

  const navigatePanel = useCallback((panelIdx: number, mnemonic: string, security?: string, sector?: MarketSector) => {
    dispatch({ panelIdx, action: { type: 'NAVIGATE', mnemonic, security, sector } });
  }, []);

  const loadSecurityInPanel = useCallback((panelIdx: number, security: string, sector?: MarketSector) => {
    dispatch({ panelIdx, action: { type: 'SET_SECURITY', security, sector } });
  }, []);

  const addPanel = useCallback((seedFromPanelIdx?: number) => {
    const srcIdx = typeof seedFromPanelIdx === 'number' ? seedFromPanelIdx : focusedPanel;
    const src = panels[srcIdx];
    const nextIdx = panels.length;
    const seed = src ? {
      activeSecurity: src.activeSecurity,
      activeMnemonic: src.activeMnemonic,
      marketSector: src.marketSector,
      timeframe: src.timeframe,
    } : {
      activeSecurity: 'AAPL US Equity',
      activeMnemonic: 'DES',
      marketSector: 'EQUITY' as MarketSector,
      timeframe: '1Y',
    };
    dispatch({
      panelIdx: nextIdx,
      action: {
        type: 'HYDRATE',
        snapshot: {
          ...createDefaultPanel(nextIdx, seed.activeMnemonic, seed.activeSecurity),
          marketSector: seed.marketSector,
          timeframe: seed.timeframe,
          id: nextIdx,
        },
      },
    });
    setFocusedPanelRaw(nextIdx);
    return nextIdx;
  }, [focusedPanel, panels]);

  const closePanel = useCallback((panelIdx: number) => {
    if (panels.length <= 1) return;
    const snap = panels[panelIdx];
    if (!snap) return;
    dispatch({
      panelIdx,
      action: {
        type: 'HYDRATE',
        snapshot: {
          ...createDefaultPanel(panelIdx, 'WAKE', snap.activeSecurity),
          id: panelIdx,
          activeMnemonic: 'WAKE',
          commandInput: '',
          overlayMode: 'none',
        },
      },
    });
    setFocusedPanelRaw((prev) => (prev === panelIdx ? Math.max(0, panelIdx - 1) : prev));
  }, [panels]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= Math.min(9, panels.length)) { e.preventDefault(); setFocusedPanel(n - 1); return; }
      }
      if (e.ctrlKey && e.key === 'Tab') { e.preventDefault(); cycleFocus(); return; }
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); cycleFocus(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setFocusedPanel, cycleFocus, panels.length]);

  const value = useMemo<TerminalOSContextValue>(() => ({
    panels, panelCount: panels.length, focusedPanel, setFocusedPanel, dispatchPanel, addPanel, closePanel, cycleFocus, navigatePanel, loadSecurityInPanel,
  }), [panels, focusedPanel, setFocusedPanel, dispatchPanel, addPanel, closePanel, cycleFocus, navigatePanel, loadSecurityInPanel]);

  return <TerminalOSCtx.Provider value={value}>{children}</TerminalOSCtx.Provider>;
}

export function useTerminalOS() {
  const ctx = useContext(TerminalOSCtx);
  if (!ctx) throw new Error('useTerminalOS requires TerminalOSProvider');
  return ctx;
}
