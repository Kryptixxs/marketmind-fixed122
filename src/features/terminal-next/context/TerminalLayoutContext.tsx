'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  loadPersistedState,
  savePersistedState,
  loadPersistedLayout,
  savePersistedLayout,
  type PersistedLayoutState,
} from '../services/terminalPersistence';

type ZoomedQuadrant = 0 | 1 | 2 | 3 | null;

interface TerminalLayoutContextValue {
  zoomedQuadrant: ZoomedQuadrant;
  setZoomedQuadrant: (q: ZoomedQuadrant) => void;
  crtOverlayEnabled: boolean;
  setCrtOverlayEnabled: (v: boolean) => void;
  toggleCrtOverlay: () => void;
  chartType: PersistedLayoutState['chartType'];
  setChartType: (t: PersistedLayoutState['chartType']) => void;
  panelSizes: number[];
  setPanelSizes: (sizes: number[]) => void;
}

const TerminalLayoutContext = createContext<TerminalLayoutContextValue | null>(null);

const DEFAULT_PANEL_SIZES = [0.25, 0.25, 0.25, 0.25];

export function TerminalLayoutProvider({ children }: { children: React.ReactNode }) {
  const [zoomedQuadrant, setZoomedQuadrantState] = useState<ZoomedQuadrant>(null);
  const [crtOverlayEnabled, setCrtOverlayEnabledState] = useState(false);
  const [chartType, setChartTypeState] = useState<PersistedLayoutState['chartType']>('candlestick');
  const [panelSizes, setPanelSizesState] = useState<number[]>(DEFAULT_PANEL_SIZES);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.zoomedQuadrant != null) setZoomedQuadrantState(persisted.zoomedQuadrant as ZoomedQuadrant);
    if (persisted.crtOverlayEnabled != null) setCrtOverlayEnabledState(persisted.crtOverlayEnabled);
  }, []);

  useEffect(() => {
    const layout = loadPersistedLayout();
    if (layout.chartType) setChartTypeState(layout.chartType);
    if (layout.panelSizes?.length === 4) setPanelSizesState(layout.panelSizes);
  }, []);

  const setZoomedQuadrant = useCallback((q: ZoomedQuadrant) => {
    setZoomedQuadrantState(q);
    savePersistedState({ zoomedQuadrant: q });
  }, []);

  const setCrtOverlayEnabled = useCallback((v: boolean) => {
    setCrtOverlayEnabledState(v);
    savePersistedState({ crtOverlayEnabled: v });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('crt-overlay', v);
    }
  }, []);

  const toggleCrtOverlay = useCallback(() => {
    setCrtOverlayEnabledState((v) => {
      const next = !v;
      savePersistedState({ crtOverlayEnabled: next });
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('crt-overlay', next);
      }
      return next;
    });
  }, []);

  const setChartType = useCallback((t: PersistedLayoutState['chartType']) => {
    setChartTypeState(t ?? 'candlestick');
    savePersistedLayout({ chartType: t ?? 'candlestick' });
  }, []);

  const setPanelSizes = useCallback((sizes: number[]) => {
    if (sizes.length === 4) {
      setPanelSizesState(sizes);
      savePersistedLayout({ panelSizes: sizes });
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('crt-overlay', crtOverlayEnabled);
    }
  }, [crtOverlayEnabled]);

  const value: TerminalLayoutContextValue = {
    zoomedQuadrant,
    setZoomedQuadrant,
    crtOverlayEnabled,
    setCrtOverlayEnabled,
    toggleCrtOverlay,
    chartType,
    setChartType,
    panelSizes,
    setPanelSizes,
  };

  return (
    <TerminalLayoutContext.Provider value={value}>
      {children}
    </TerminalLayoutContext.Provider>
  );
}

export function useTerminalLayout() {
  const ctx = useContext(TerminalLayoutContext);
  if (!ctx) throw new Error('useTerminalLayout must be used within TerminalLayoutProvider');
  return ctx;
}
