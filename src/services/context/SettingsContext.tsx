'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type Theme = 'dark' | 'light' | 'oled' | 'bloomberg' | 'terminal-green' | 'classic-blue';
export type Density = 'compact' | 'standard' | 'spacious';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg';
export type AIDepth = 'standard' | 'deep' | 'quant';
export type FontFamily = 'mono' | 'sans' | 'serif';
export type BorderStyle = 'none' | 'thin' | 'bold';

type Settings = {
  // UI Aesthetics
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  fontFamily: FontFamily;
  borderStyle: BorderStyle;
  showTicker: boolean;
  showStatusbar: boolean;
  showGridLines: boolean;
  animationsEnabled: boolean;
  
  // Trading & Risk
  impactFilter: 'All' | 'Low' | 'Medium' | 'High';
  currency: string;
  defaultTimeframe: string;
  defaultRiskPct: number;
  defaultLeverage: number;
  commissionPerLot: number;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  
  // Data & AI
  aiDepth: AIDepth;
  autoAnalyze: boolean;
  refreshInterval: number; // ms
  dataDelayMode: 'realtime' | 'delayed' | 'simulated';
  preferredExchange: 'NASDAQ' | 'NYSE' | 'CME' | 'ICE';
  
  // System
  sessionTimeout: number; // minutes
  keyboardFirstMode: boolean;
  soundEnabled: boolean;
};

const DEFAULT: Settings = {
  theme: 'dark',
  density: 'compact',
  fontSize: 'sm',
  fontFamily: 'mono',
  borderStyle: 'thin',
  showTicker: true,
  showStatusbar: true,
  showGridLines: true,
  animationsEnabled: true,
  impactFilter: 'All',
  currency: 'All',
  defaultTimeframe: '15m',
  defaultRiskPct: 1.0,
  defaultLeverage: 1,
  commissionPerLot: 0,
  riskTolerance: 'Moderate',
  aiDepth: 'standard',
  autoAnalyze: true,
  refreshInterval: 30000,
  dataDelayMode: 'realtime',
  preferredExchange: 'NASDAQ',
  sessionTimeout: 60,
  keyboardFirstMode: false,
  soundEnabled: true,
};

const STORAGE_KEY = 'vantage-terminal-settings-v5';

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
    root.setAttribute('data-font-family', settings.fontFamily);
    root.setAttribute('data-border-style', settings.borderStyle);
    root.style.setProperty('--grid-line-opacity', settings.showGridLines ? '1' : '0');
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