'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type Theme = 'dark' | 'oled' | 'bloomberg' | 'classic-terminal';
export type Density = 'compact' | 'standard' | 'spacious';
export type UIStyle = 'modern' | 'terminal';

type Settings = {
  theme: Theme;
  density: Density;
  uiStyle: UIStyle;
  showTicker: boolean;
  showStatusbar: boolean;
  defaultTimeframe: string;
};

const DEFAULT: Settings = {
  theme: 'dark',
  density: 'standard',
  uiStyle: 'modern',
  showTicker: true,
  showStatusbar: true,
  defaultTimeframe: '15m',
};

const STORAGE_KEY = 'vantage-terminal-settings-v6';

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}>({
  settings: DEFAULT,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSettings({ ...DEFAULT, ...JSON.parse(raw) });
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-density', settings.density);
    root.setAttribute('data-ui', settings.uiStyle);
  }, [settings.theme, settings.density, settings.uiStyle]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (user) {
        supabase.from('user_preferences').upsert({ 
          user_id: user.id, default_filters: next 
        }).then();
      }
      return next;
    });
  }, [user]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}