'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type PanelFunction = 'WEI' | 'GP' | 'N' | 'MKT' | 'EXEC' | 'DES' | 'FA' | 'HP' | 'YAS' | 'OVME' | 'PORT' | 'NEWS' | 'CAL' | 'SEC' | 'INTEL' | 'IMAP' | 'ECO' | 'FXC' | 'GC' | 'IB';

export interface PanelHistoryEntry {
  fn: PanelFunction;
  symbol: string;
}

export type LinkGroupId = string | null;

interface PanelFocusContextValue {
  activePanelIndex: number | null;
  setActivePanel: (index: number) => void;
  panelFunctions: PanelFunction[];
  setPanelFunction: (panelIndex: number, fn: PanelFunction) => void;
  setPanelFunctions: (fns: PanelFunction[]) => void;
  panelHistory: PanelHistoryEntry[][];
  pushPanelState: (panelIndex: number, fn: PanelFunction, symbol: string) => void;
  popPanelState: (panelIndex: number, onRestore?: (entry: PanelHistoryEntry) => void) => void;
  panelLinkGroups: (LinkGroupId)[];
  setPanelLinkGroup: (panelIndex: number, group: LinkGroupId) => void;
}

const PanelFocusContext = createContext<PanelFocusContextValue | null>(null);

const DEFAULT_FUNCTIONS: PanelFunction[] = ['WEI', 'GP', 'N', 'MKT'];

const emptyHistory = (): PanelHistoryEntry[][] =>
  Array.from({ length: 4 }, () => []);

export function PanelFocusProvider({ children }: { children: React.ReactNode }) {
  const [activePanelIndex, setActivePanelIndex] = useState<number | null>(0);
  const [panelFunctions, setPanelFunctionsState] = useState<PanelFunction[]>(DEFAULT_FUNCTIONS);
  const [panelHistory, setPanelHistory] = useState<PanelHistoryEntry[][]>(emptyHistory);
  const [panelLinkGroups, setPanelLinkGroupsState] = useState<(LinkGroupId)[]>([null, null, null, null]);

  const setActivePanel = useCallback((index: number) => {
    setActivePanelIndex(index);
  }, []);

  const setPanelFunction = useCallback((panelIndex: number, fn: PanelFunction) => {
    setPanelFunctionsState((prev) => {
      const next = [...prev];
      next[panelIndex] = fn;
      return next;
    });
  }, []);

  const setPanelFunctions = useCallback((fns: PanelFunction[]) => {
    if (fns.length >= 4) {
      setPanelFunctionsState([fns[0]!, fns[1]!, fns[2]!, fns[3]!]);
    }
  }, []);

  const pushPanelState = useCallback((panelIndex: number, fn: PanelFunction, symbol: string) => {
    setPanelHistory((prev) => {
      const next = prev.map((h, i) =>
        i === panelIndex ? [...h, { fn, symbol }] : h
      );
      return next;
    });
  }, []);

  const popPanelState = useCallback((panelIndex: number, onRestore?: (entry: PanelHistoryEntry) => void) => {
    setPanelHistory((prev) => {
      const stack = prev[panelIndex];
      if (stack.length === 0) return prev;
      const newStack = [...stack];
      const popped = newStack.pop()!;
      onRestore?.(popped);
      return prev.map((h, i) => (i === panelIndex ? newStack : h));
    });
  }, []);

  const setPanelLinkGroup = useCallback((panelIndex: number, group: LinkGroupId) => {
    setPanelLinkGroupsState((prev) => {
      const next = [...prev];
      next[panelIndex] = group;
      return next;
    });
  }, []);

  const value: PanelFocusContextValue = {
    activePanelIndex,
    setActivePanel,
    panelFunctions,
    setPanelFunction,
    setPanelFunctions,
    panelHistory,
    pushPanelState,
    popPanelState,
    panelLinkGroups,
    setPanelLinkGroup,
  };

  return (
    <PanelFocusContext.Provider value={value}>
      {children}
    </PanelFocusContext.Provider>
  );
}

export function usePanelFocus() {
  const ctx = useContext(PanelFocusContext);
  if (!ctx) throw new Error('usePanelFocus must be used within PanelFocusProvider');
  return ctx;
}
