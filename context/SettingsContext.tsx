'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ImpactFilter = 'All' | 'Low' | 'Medium' | 'High';

type Settings = {
  impactFilter: ImpactFilter;
  currency: string;
};

const DEFAULT: Settings = {
  impactFilter: 'All',
  currency: 'All',
};

const STORAGE_KEY = 'marketmind-settings';

const SettingsContext = createContext<{
  settings: Settings;
  setImpactFilter: (v: ImpactFilter) => void;
  setCurrency: (v: string) => void;
}>({
  settings: DEFAULT,
  setImpactFilter: () => {},
  setCurrency: () => {},
});

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      impactFilter: ['All', 'Low', 'Medium', 'High'].includes(parsed.impactFilter ?? '') ? parsed.impactFilter as ImpactFilter : DEFAULT.impactFilter,
      currency: parsed.currency === 'All' || (parsed.currency && /^[A-Z]{3}$/.test(parsed.currency)) ? (parsed.currency ?? DEFAULT.currency) : DEFAULT.currency,
    };
  } catch {
    return DEFAULT;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const setImpactFilter = useCallback((impactFilter: ImpactFilter) => {
    update({ impactFilter });
  }, [update]);

  const setCurrency = useCallback((currency: string) => {
    update({ currency });
  }, [update]);

  return (
    <SettingsContext.Provider value={{ settings, setImpactFilter, setCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
