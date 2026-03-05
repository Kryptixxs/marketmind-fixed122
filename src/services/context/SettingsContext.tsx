'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  setImpactFilter: (filter: 'All' | 'Low' | 'Medium' | 'High') => void;
}>({
  settings: DEFAULT,
  updateSettings: () => {},
  setImpactFilter: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  // 1. Load settings on mount (Local -> Server)
  useEffect(() => {
    const loadSettings = async () => {
      // Try local storage first for immediate UI response
      const raw = localStorage.getItem(STORAGE_KEY);
      let currentSettings = DEFAULT;
      if (raw) {
        try {
          currentSettings = { ...DEFAULT, ...JSON.parse(raw) };
          setSettings(currentSettings);
        } catch (e) {}
      }

      // If user is logged in, fetch from Supabase
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

  // 2. Update settings (Local + Server)
  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      
      // Sync to Supabase if logged in
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

  // Apply theme and font size to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-density', settings.density);
    root.setAttribute('data-font-size', settings.fontSize);
  }, [settings.theme, settings.density, settings.fontSize]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setImpactFilter }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}