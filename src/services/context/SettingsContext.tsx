'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type Theme = 'dark' | 'light' | 'oled' | 'bloomberg' | 'quant' | 'fx-desk' | 'terminal-green';
export type Density = 'compact' | 'standard' | 'spacious';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg';

type Settings = {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  showTicker: boolean;
  impactFilter: 'All' | 'Low' | 'Medium' | 'High';
  currency: string;
  refreshInterval: number;
};

const DEFAULT: Settings = {
  theme: 'fx-desk',
  density: 'compact',
  fontSize: 'sm',
  showTicker: false,
  impactFilter: 'All',
  currency: 'All',
  refreshInterval: 30000,
};

const STORAGE_KEY = 'vantage-terminal-settings-v8';

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  setImpactFilter: (filter: 'All' | 'Low' | 'Medium' | 'High') => void;
  resetToDefaults: () => void;
  isSyncing: boolean;
}>({
  settings: DEFAULT,
  updateSettings: () => {},
  setImpactFilter: () => {},
  resetToDefaults: () => {},
  isSyncing: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(raw) }));
        } catch (e) {}
      }

      if (user) {
        setIsSyncing(true);
        const { data } = await supabase
          .from('user_preferences')
          .select('default_filters')
          .eq('user_id', user.id)
          .single();

        if (data?.default_filters) {
          const serverSettings = data.default_filters as Partial<Settings>;
          setSettings(prev => ({ ...prev, ...serverSettings }));
        }
        setIsSyncing(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      
      if (user) {
        setIsSyncing(true);
        supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            default_filters: next,
            updated_at: new Date().toISOString()
          })
          .then(() => setIsSyncing(false));
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
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setImpactFilter, resetToDefaults, isSyncing }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}