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
export type WorkspacePreset = 'BMON' | 'FLOW' | 'MACRO' | 'RISK';
export type WorkspaceLayout = {
  showDepth: boolean;
  showRisk: boolean;
  showMacro: boolean;
  showBlotter: boolean;
  showMovers: boolean;
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;
};

type Settings = {
  strategy: 'Scalper' | 'Swing' | 'Macro';
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  fontFamily: FontFamily;
  borderStyle: BorderStyle;
  showTicker: boolean;
  showStatusbar: boolean;
  showGridLines: boolean;
  animationsEnabled: boolean;
  impactFilter: 'All' | 'Low' | 'Medium' | 'High';
  currency: string;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  aiDepth: AIDepth;
  autoAnalyze: boolean;
  refreshInterval: number;
  dataDelayMode: 'realtime' | 'delayed' | 'simulated';
  activeWorkspace: WorkspacePreset;
  workspaceLayouts: Record<WorkspacePreset, WorkspaceLayout>;
};

const DEFAULT_WORKSPACE_LAYOUTS: Record<WorkspacePreset, WorkspaceLayout> = {
  BMON: { showDepth: true, showRisk: true, showMacro: true, showBlotter: true, showMovers: true, leftWidth: 240, rightWidth: 320, bottomHeight: 44 },
  FLOW: { showDepth: true, showRisk: false, showMacro: false, showBlotter: true, showMovers: true, leftWidth: 240, rightWidth: 340, bottomHeight: 40 },
  MACRO: { showDepth: false, showRisk: false, showMacro: true, showBlotter: false, showMovers: true, leftWidth: 240, rightWidth: 340, bottomHeight: 48 },
  RISK: { showDepth: false, showRisk: true, showMacro: false, showBlotter: true, showMovers: false, leftWidth: 250, rightWidth: 330, bottomHeight: 42 },
};

const DEFAULT: Settings = {
  strategy: 'Swing',
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
  riskTolerance: 'Moderate',
  aiDepth: 'standard',
  autoAnalyze: true,
  refreshInterval: 30000,
  dataDelayMode: 'realtime',
  activeWorkspace: 'BMON',
  workspaceLayouts: DEFAULT_WORKSPACE_LAYOUTS,
};

const STORAGE_KEY = 'vantage-terminal-settings-v6';

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
      // 1. Load from LocalStorage first for instant UI
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(raw) }));
        } catch (e) {}
      }

      // 2. If user is logged in, fetch from Supabase
      if (user) {
        setIsSyncing(true);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('default_filters')
          .eq('user_id', user.id)
          .single();

        if (data?.default_filters) {
          const serverSettings = data.default_filters as Partial<Settings>;
          const merged = { ...DEFAULT, ...serverSettings };
          setSettings((prev) => ({ ...prev, ...serverSettings }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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
          .then(({ error }) => {
            if (error) console.error("[Settings] Sync failed:", error);
            setIsSyncing(false);
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
    <SettingsContext.Provider value={{ settings, updateSettings, setImpactFilter, resetToDefaults, isSyncing }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}