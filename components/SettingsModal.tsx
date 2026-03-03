'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, Zap, Activity, Target, Globe } from 'lucide-react';
import { useSettings, type ImpactFilter, type Strategy, type VolatilityPreference, type RiskTolerance } from '@/context/SettingsContext';

type Tab = 'filters' | 'personalization' | 'account';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'];

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('filters');
  const { 
    settings, 
    setImpactFilter, 
    setCurrency, 
    setStrategy, 
    setVolatilityPreference, 
    setRiskTolerance 
  } = useSettings();

  useEffect(() => {
    if (isOpen) setActiveTab('filters');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono">Terminal Settings // v4.0</h2>
          </div>
          <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-border bg-surface">
          {['filters', 'personalization', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-accent border-b border-accent bg-accent/5' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 flex flex-col gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'filters' && (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Activity size={12} />
                  <h3 className="text-[9px] font-bold uppercase tracking-wider">Impact Threshold</h3>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {['All', 'Low', 'Medium', 'High'].map((impact) => (
                    <button
                      key={impact}
                      type="button"
                      onClick={() => setImpactFilter(impact as ImpactFilter)}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                        settings.impactFilter === impact ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                      }`}
                    >
                      {impact.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Globe size={12} />
                  <h3 className="text-[9px] font-bold uppercase tracking-wider">Currency Focus</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrency('All')}
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                      settings.currency === 'All' ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                    }`}
                  >
                    ALL
                  </button>
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      onClick={() => setCurrency(currency)}
                      className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                        settings.currency === currency
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'personalization' && (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Target size={12} />
                  <h3 className="text-[9px] font-bold uppercase tracking-wider">Trading Strategy</h3>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['Scalper', 'Swing', 'Macro'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStrategy(s as Strategy)}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                        settings.strategy === s ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Zap size={12} />
                  <h3 className="text-[9px] font-bold uppercase tracking-wider">Volatility Preference</h3>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['Low', 'Moderate', 'High'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVolatilityPreference(v as VolatilityPreference)}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                        settings.volatilityPreference === v ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                      }`}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <ShieldAlert size={12} />
                  <h3 className="text-[9px] font-bold uppercase tracking-wider">Risk Tolerance</h3>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['Conservative', 'Moderate', 'Aggressive'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskTolerance(r as RiskTolerance)}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                        settings.riskTolerance === r ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Activity size={12} />
                <h3 className="text-[9px] font-bold uppercase tracking-wider">System Status</h3>
              </div>
              <div className="bg-background border border-border p-3 rounded-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-secondary uppercase">API Connection</span>
                  <span className="text-[9px] font-mono text-positive">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-secondary uppercase">Data Feed</span>
                  <span className="text-[9px] font-mono text-positive">STABLE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-secondary uppercase">Latency</span>
                  <span className="text-[9px] font-mono text-accent">42ms</span>
                </div>
              </div>
              <p className="text-[9px] text-text-tertiary italic">
                "Account settings and API keys can be configured here when connected to a broker or data provider."
              </p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border bg-surface-highlight flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}