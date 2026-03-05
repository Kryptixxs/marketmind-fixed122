'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type Theme = 'dark' | 'light' | 'oled' | 'bloomberg';
export type Density = 'compact' | 'standard' | 'spacious';
export type FontSize = 'xs' | 'sm' | 'md';
export type AIDepth = 'standard' | 'deep';

type Settings = {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  aiDepth: AIDepth;
  autoAnalyze: boolean;
  refreshInterval: number;
  impactFilter: 'All' | 'Low' | 'Medium' | 'High';
  currency: string;
  showTicker: boolean;
  showStatusbar: boolean;
  defaultRiskPct: number;
  defaultTimeframe: string;
};

const DEFAULT: Settings = {
  theme: 'dark',
  density: 'compact',
  fontSize: 'sm',
  aiDepth: 'standard',
  autoAnalyze: true,
  refreshInterval: 30000,
  impactFilter: 'All',
  currency: 'All',
  showTicker: true,
  showStatusbar: true,
  defaultRiskPct: 1.0,
  defaultTimeframe: '15m',
};

const STORAGE_KEY = 'vantage-terminal-settings-v4';

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  setImpactFilter: (filter: 'All' | 'Low' | 'Medium' | 'High') => void;
  resetToDefaults: () => void;
}>({
  settings: DEFAULT,
  updateSettings: () => {},
  setImpactFilter: () => {},
  resetToDefaults: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const loadSettings = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      let currentSettings = DEFAULT;
      if (raw) {
        try {
          currentSettings = { ...DEFAULT, ...JSON.parse(raw) };
          setSettings(currentSettings);
        } catch (e) {}
      }

      if (user) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('default_filters')
          .eq('user_id', user.id)
          .single();

        if (data?.default_filters) {
          const serverSettings = data.default_filters as Partial<Settings>;
          setSettings(prev => ({ ...prev, ...serverSettings }));
        }
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      
      if (user) {
        supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            default_filters: next,
            updated_at: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error) console.error("[Settings] Sync failed:", error);
          });
      }
      
      return next;
    });
  }, [user]);

  const setImpactFilter = useCallback((filter: 'All' | 'Low' | 'Medium' | 'High') => {
    updateSettings({ impactFilter: filter });
  }, [updateSettings]);

  const resetToDefaults = useCallback(() => {
    updateSettings(DEFAULT);
  }, [updateSettings]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-density', settings.density);
    root.setAttribute('data-font-size', settings.fontSize);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setImpactFilter, resetToDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}