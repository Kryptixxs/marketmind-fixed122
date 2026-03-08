'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type CrosshairPoint = { time: number; price: number } | null;

type CrosshairSyncContextValue = {
  crosshair: CrosshairPoint;
  setCrosshair: (point: CrosshairPoint) => void;
};

const CrosshairSyncContext = createContext<CrosshairSyncContextValue | null>(null);

export function CrosshairSyncProvider({ children }: { children: React.ReactNode }) {
  const [crosshair, setCrosshairState] = useState<CrosshairPoint>(null);
  const setCrosshair = useCallback((point: CrosshairPoint) => {
    setCrosshairState(point);
  }, []);
  const value = { crosshair, setCrosshair };
  return (
    <CrosshairSyncContext.Provider value={value}>{children}</CrosshairSyncContext.Provider>
  );
}

export function useCrosshairSync() {
  const ctx = useContext(CrosshairSyncContext);
  return ctx ?? { crosshair: null, setCrosshair: () => {} };
}
