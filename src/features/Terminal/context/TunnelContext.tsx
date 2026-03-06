'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type TunnelLayer =
  | { type: 'ROOT'; label: string; path?: string }
  | { type: 'MARKETS'; label: string }
  | { type: 'SYMBOL'; symbol: string; label: string }
  | { type: 'OPTIONS'; symbol: string; label: string }
  | { type: 'NEWS'; symbol?: string; label: string }
  | { type: 'SCREENER'; label: string }
  | { type: 'PORTFOLIO'; label: string }
  | { type: 'CALENDAR'; label: string }
  | { type: 'QUANT'; label: string }
  | { type: 'ALGO'; label: string }
  | { type: 'TOOLS'; label: string; tool?: string; symbol?: string }
  | { type: 'EVENT'; id: string; label: string; detail?: string; impact?: 'LOW' | 'MEDIUM' | 'HIGH' }
  | { type: 'ARTICLE'; id: string; title: string; label: string; source?: string; time?: string; snippet?: string; link?: string }
  | { type: 'ORDER'; id: string; symbol: string; label: string; side: 'BUY' | 'SELL'; qty: number; price: number }
  | { type: 'TAPE'; id: string; symbol: string; label: string; side: 'BUY' | 'SELL'; qty: number; price: number; time: string };

interface TunnelContextValue {
  stack: TunnelLayer[];
  push: (layer: TunnelLayer) => void;
  pop: () => void;
  popTo: (index: number) => void;
  clear: () => void;
  depth: number;
}

const TunnelContext = createContext<TunnelContextValue | null>(null);

export function TunnelProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<TunnelLayer[]>([]);

  const push = useCallback((layer: TunnelLayer) => {
    setStack((s) => [...s, layer]);
  }, []);

  const pop = useCallback(() => {
    setStack((s) => (s.length > 0 ? s.slice(0, -1) : s));
  }, []);

  const popTo = useCallback((index: number) => {
    setStack((s) => (index >= 0 && index < s.length ? s.slice(0, index + 1) : s));
  }, []);

  const clear = useCallback(() => setStack([]), []);

  const value: TunnelContextValue = {
    stack,
    push,
    pop,
    popTo,
    clear,
    depth: stack.length,
  };

  return <TunnelContext.Provider value={value}>{children}</TunnelContext.Provider>;
}

export function useTunnel() {
  const ctx = useContext(TunnelContext);
  if (!ctx) throw new Error('useTunnel must be used within TunnelProvider');
  return ctx;
}
