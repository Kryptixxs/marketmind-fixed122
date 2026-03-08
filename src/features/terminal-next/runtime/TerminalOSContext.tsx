'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { PanelState, PanelAction, panelReducer, createDefaultPanel, LinkColor, MarketSector } from './panelState';

interface TerminalOSContextValue {
  panels: PanelState[];
  focusedPanel: number;
  setFocusedPanel: (idx: number) => void;
  dispatchPanel: (panelIdx: number, action: PanelAction) => void;
  cycleFocus: () => void;
  navigatePanel: (panelIdx: number, mnemonic: string, security?: string, sector?: MarketSector) => void;
  loadSecurityInPanel: (panelIdx: number, security: string, sector?: MarketSector) => void;
}

const TerminalOSCtx = createContext<TerminalOSContextValue | null>(null);

function multiPanelReducer(state: PanelState[], action: { panelIdx: number; action: PanelAction }): PanelState[] {
  const next = [...state];
  next[action.panelIdx] = panelReducer(state[action.panelIdx]!, action.action);

  if (action.action.type === 'SET_SECURITY' || action.action.type === 'NAVIGATE') {
    const src = next[action.panelIdx]!;
    if (src.linkGroup) {
      for (let i = 0; i < next.length; i++) {
        if (i === action.panelIdx) continue;
        if (next[i]!.linkGroup === src.linkGroup) {
          next[i] = panelReducer(next[i]!, { type: 'SET_SECURITY', security: src.activeSecurity, sector: src.marketSector });
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

  const setFocusedPanel = useCallback((idx: number) => {
    if (idx >= 0 && idx < 4) setFocusedPanelRaw(idx);
  }, []);

  const cycleFocus = useCallback(() => {
    setFocusedPanelRaw((prev) => (prev + 1) % 4);
  }, []);

  const dispatchPanel = useCallback((panelIdx: number, action: PanelAction) => {
    dispatch({ panelIdx, action });
  }, []);

  const navigatePanel = useCallback((panelIdx: number, mnemonic: string, security?: string, sector?: MarketSector) => {
    dispatch({ panelIdx, action: { type: 'NAVIGATE', mnemonic, security, sector } });
  }, []);

  const loadSecurityInPanel = useCallback((panelIdx: number, security: string, sector?: MarketSector) => {
    dispatch({ panelIdx, action: { type: 'SET_SECURITY', security, sector } });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) { e.preventDefault(); setFocusedPanel(n - 1); return; }
      }
      if (e.ctrlKey && e.key === 'Tab') { e.preventDefault(); cycleFocus(); return; }
      // Ctrl+` = cycle focus (PANEL key equivalent)
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); cycleFocus(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setFocusedPanel, cycleFocus]);

  const value = useMemo<TerminalOSContextValue>(() => ({
    panels, focusedPanel, setFocusedPanel, dispatchPanel, cycleFocus, navigatePanel, loadSecurityInPanel,
  }), [panels, focusedPanel, setFocusedPanel, dispatchPanel, cycleFocus, navigatePanel, loadSecurityInPanel]);

  return <TerminalOSCtx.Provider value={value}>{children}</TerminalOSCtx.Provider>;
}

export function useTerminalOS() {
  const ctx = useContext(TerminalOSCtx);
  if (!ctx) throw new Error('useTerminalOS requires TerminalOSProvider');
  return ctx;
}
