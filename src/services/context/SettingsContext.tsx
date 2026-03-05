'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'oled' | 'bloomberg';
export type Density = 'compact' | 'standard' | 'spacious';
export type FontSize = 'xs' | 'sm' | 'md';
export type AIDepth = 'standard' | 'deep';

type Settings = {
  // UI
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  showTicker: boolean;
  showStatusbar: boolean;
  
  // Trading
  impactFilter: 'All' | 'Low' | 'Medium' | 'High';
  currency: string;
  defaultTimeframe: string;
  defaultRiskPct: number;
  
  // AI & Data
  aiDepth: AIDepth;
  autoAnalyze: boolean;
  refreshInterval: number; // ms
};

const DEFAULT: Settings = {
  theme: 'dark',
  density: 'compact',
  fontSize: 'sm',
  showTicker: true,
  showStatusbar: true,
  impactFilter: 'All',
  currency: 'All',
  defaultTimeframe: '15m',
  defaultRiskPct: 1.0,
  aiDepth: 'standard',
  autoAnalyze: true,
  refreshInterval: 30000,
};

const STORAGE_KEY = 'vantage-terminal-settings-v4';

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}>({
  settings: DEFAULT,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT, ...parsed });
      } catch (e) {}
    }
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Apply theme and font size to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-density', settings.density);
    root.setAttribute('data-font-size', settings.fontSize);
  }, [settings.theme, settings.density, settings.fontSize]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}