'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loadPersistedState, savePersistedState } from '../services/terminalPersistence';

type ZoomedQuadrant = 0 | 1 | 2 | 3 | null;

interface TerminalLayoutContextValue {
  zoomedQuadrant: ZoomedQuadrant;
  setZoomedQuadrant: (q: ZoomedQuadrant) => void;
  crtOverlayEnabled: boolean;
  setCrtOverlayEnabled: (v: boolean) => void;
  toggleCrtOverlay: () => void;
}

const TerminalLayoutContext = createContext<TerminalLayoutContextValue | null>(null);

export function TerminalLayoutProvider({ children }: { children: React.ReactNode }) {
  const [zoomedQuadrant, setZoomedQuadrantState] = useState<ZoomedQuadrant>(null);
  const [crtOverlayEnabled, setCrtOverlayEnabledState] = useState(false);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.zoomedQuadrant != null) setZoomedQuadrantState(persisted.zoomedQuadrant as ZoomedQuadrant);
    if (persisted.crtOverlayEnabled != null) setCrtOverlayEnabledState(persisted.crtOverlayEnabled);
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
