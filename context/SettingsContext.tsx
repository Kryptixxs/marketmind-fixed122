'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ImpactFilter = 'All' | 'Low' | 'Medium' | 'High';
export type Strategy = 'Scalper' | 'Swing' | 'Macro';
export type VolatilityPreference = 'Low' | 'Moderate' | 'High';
export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';

type Settings = {
  impactFilter: ImpactFilter;
  currency: string;
  strategy: Strategy;
  volatilityPreference: VolatilityPreference;
  riskTolerance: RiskTolerance;
};

const DEFAULT: Settings = {
  impactFilter: 'All',
  currency: 'All',
  strategy: 'Macro',
  volatilityPreference: 'Moderate',
  riskTolerance: 'Moderate',
};

const STORAGE_KEY = 'vantage-terminal-settings-v2';

const SettingsContext = createContext<{
  settings: Settings;
  setImpactFilter: (v: ImpactFilter) => void;
  setCurrency: (v: string) => void;
  setStrategy: (v: Strategy) => void;
  setVolatilityPreference: (v: VolatilityPreference) => void;
  setRiskTolerance: (v: RiskTolerance) => void;
}>({
  settings: DEFAULT,
  setImpactFilter: () => {},
  setCurrency: () => {},
  setStrategy: () => {},
  setVolatilityPreference: () => {},
  setRiskTolerance: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSettings({ ...DEFAULT, ...JSON.parse(raw) });
      } catch (e) {}
    }
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setImpactFilter = (v: ImpactFilter) => update({ impactFilter: v });
  const setCurrency = (v: string) => update({ currency: v });
  const setStrategy = (v: Strategy) => update({ strategy: v });
  const setVolatilityPreference = (v: VolatilityPreference) => update({ volatilityPreference: v });
  const setRiskTolerance = (v: RiskTolerance) => update({ riskTolerance: v });

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      setImpactFilter, 
      setCurrency, 
      setStrategy, 
      setVolatilityPreference, 
      setRiskTolerance 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
