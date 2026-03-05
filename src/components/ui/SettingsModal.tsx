'use client';

import React, { useState } from 'react';
import { 
  X, Settings, Monitor, Shield, Zap, Database, 
  RefreshCw, Check, RotateCcw, Layout, Type, 
  Eye, Sliders, Cloud
} from 'lucide-react';
import { useSettings, Theme, Density, FontSize, AIDepth, FontFamily, BorderStyle } from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'appearance' | 'trading' | 'intelligence' | 'system';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetToDefaults, isSyncing } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  if (!isOpen) return null;

  const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'dark', label: 'Vantage Dark', color: 'bg-[#0d0d0f]' },
    { id: 'oled', label: 'Pure Black', color: 'bg-black' },
    { id: 'bloomberg', label: 'Terminal Blue', color: 'bg-[#000044]' },
    { id: 'terminal-green', label: 'Matrix Green', color: 'bg-[#0a0a0a] border-green-900' },
    { id: 'classic-blue', label: 'Classic Blue', color: 'bg-[#003366]' },
    { id: 'light', label: 'Day Mode', color: 'bg-white' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-3xl h-[600px] flex flex-col shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-3">
            <Settings size={18} className="text-accent" />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">Terminal Configuration</h2>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-text-tertiary uppercase font-mono">Vantage_OS // v4.0.2</span>
                {isSyncing && <span className="text-[8px] text-accent animate-pulse flex items-center gap-1"><Cloud size={8}/> Syncing...</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-sm transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-border bg-surface-highlight/30 flex flex-col p-2 gap-1">
            {[
              { id: 'appearance', label: 'Appearance', icon: Monitor },
              { id: 'trading', label: 'Trading & Risk', icon: Zap },
              { id: 'intelligence', label: 'AI Intelligence', icon: Database },
              { id: 'system', label: 'System', icon: Sliders },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all
                  ${activeTab === tab.id 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'}
                `}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
            
            <div className="mt-auto pt-2 border-t border-border">
              <button 
                onClick={resetToDefaults}
                className="w-full flex items-center gap-3 px-3 py-2 text-text-tertiary hover:text-negative text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <RotateCcw size={14} />
                Reset All
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-background">
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layout size={12} /> Interface Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateSettings({ theme: t.id })}
                        className={`
                          p-3 border rounded-sm flex flex-col items-center gap-2 transition-all
                          ${settings.theme === t.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-surface hover:border-text-tertiary'}
                        `}
                      >
                        <div className={`w-full h-8 rounded-sm border border-white/10 ${t.color}`} />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Type size={12} /> Typography
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-text-secondary uppercase">Font Family</label>
                        <select 
                          value={settings.fontFamily}
                          onChange={e => updateSettings({ fontFamily: e.target.value as FontFamily })}
                          className="bg-surface border border-border rounded-sm px-2 py-1.5 text-[10px] font-mono text-text-primary outline-none focus:border-accent"
                        >
                          <option value="mono">JetBrains Mono</option>
                          <option value="sans">Inter Sans</option>
                          <option value="serif">Georgia Serif</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-text-secondary uppercase">Base Size</label>
                        <div className="flex gap-1">
                          {['xs', 'sm', 'md', 'lg'].map(sz => (
                            <button
                              key={sz}
                              onClick={() => updateSettings({ fontSize: sz as FontSize })}
                              className={`flex-1 py-1 text-[9px] font-bold uppercase border rounded-sm ${settings.fontSize === sz ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-tertiary'}`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Eye size={12} /> Visibility
                    </h3>
                    <div className="space-y-2">
                      {[
                        { id: 'showTicker', label: 'Global Ticker' },
                        { id: 'showStatusbar', label: 'System Statusbar' },
                        { id: 'showGridLines', label: 'Grid Separators' },
                        { id: 'animationsEnabled', label: 'UI Animations' },
                      ].map(opt => (
                        <label key={opt.id} className="flex items-center justify-between p-2 bg-surface/50 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors">
                          <span className="text-[10px] font-bold text-text-secondary uppercase">{opt.label}</span>
                          <input 
                            type="checkbox" 
                            checked={(settings as any)[opt.id]} 
                            onChange={e => updateSettings({ [opt.id]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-7 h-4 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-tertiary after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent peer-checked:after:bg-accent-text relative" />
                        </label>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Risk Management</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Risk Tolerance</label>
                      <div className="flex flex-col gap-1">
                        {['Conservative', 'Moderate', 'Aggressive'].map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => updateSettings({ riskTolerance: lvl as any })}
                            className={`px-3 py-2 text-left text-[10px] font-bold uppercase border rounded-sm flex justify-between items-center ${settings.riskTolerance === lvl ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-tertiary'}`}
                          >
                            {lvl}
                            {settings.riskTolerance === lvl && <Check size={12} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Default Currency</label>
                      <select 
                        value={settings.currency}
                        onChange={e => updateSettings({ currency: e.target.value })}
                        className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[10px] font-mono text-text-primary outline-none focus:border-accent"
                      >
                        <option value="All">All Currencies</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Data Feed Configuration</h3>
                  <div className="p-4 bg-surface border border-border rounded-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-primary uppercase">Data Delay Mode</span>
                        <span className="text-[9px] text-text-tertiary">Institutional feeds require Pro entitlement.</span>
                      </div>
                      <div className="flex gap-1">
                        {['realtime', 'delayed'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => updateSettings({ dataDelayMode: mode as any })}
                            className={`px-3 py-1 text-[9px] font-bold uppercase border rounded-sm ${settings.dataDelayMode === mode ? 'bg-accent text-accent-text border-accent' : 'border-border text-text-tertiary'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-6">
                <div className="p-6 bg-accent/5 border border-accent/20 rounded-sm flex items-start gap-4">
                  <Brain size={24} className="text-accent shrink-0" />
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Gemini 2.0 Synthesis Engine</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Configure how the terminal processes unstructured data. Deep analysis provides higher conviction but increases latency.
                    </p>
                  </div>
                </div>

                <section className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-primary uppercase">Auto-Analyze Events</span>
                        <span className="text-[9px] text-text-tertiary">Automatically trigger AI synthesis on calendar selection.</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ autoAnalyze: !settings.autoAnalyze })}
                        className={`w-10 h-5 rounded-full transition-colors relative ${settings.autoAnalyze ? 'bg-accent' : 'bg-border'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.autoAnalyze ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Analysis Depth</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['standard', 'deep', 'quant'].map(d => (
                          <button
                            key={d}
                            onClick={() => updateSettings({ aiDepth: d as AIDepth })}
                            className={`py-2 text-[10px] font-bold uppercase border rounded-sm ${settings.aiDepth === d ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-tertiary'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Network & Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-primary uppercase">Refresh Interval</span>
                        <span className="text-[9px] text-text-tertiary">Frequency of background data synchronization.</span>
                      </div>
                      <select 
                        value={settings.refreshInterval}
                        onChange={e => updateSettings({ refreshInterval: parseInt(e.target.value) })}
                        className="bg-background border border-border rounded-sm px-2 py-1 text-[10px] font-mono text-text-primary outline-none"
                      >
                        <option value={10000}>10s (Aggressive)</option>
                        <option value={30000}>30s (Standard)</option>
                        <option value={60000}>60s (Conservative)</option>
                      </select>
                    </div>
                  </div>
                </section>

                <div className="p-4 bg-surface-highlight/30 border border-border rounded-sm">
                  <div className="flex items-center gap-2 text-text-tertiary mb-2">
                    <Shield size={14} />
                    <span className="text-[9px] font-bold uppercase">Session Security</span>
                  </div>
                  <p className="text-[9px] text-text-tertiary leading-relaxed">
                    Your preferences are encrypted and synced to the Vantage Cloud. Hardware-level isolation is active for all API keys.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-highlight flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-[9px] font-mono text-text-tertiary">
            <RefreshCw size={10} className={isSyncing ? 'animate-spin text-accent' : ''} />
            {isSyncing ? 'SYNCING_TO_CLOUD...' : 'ALL_CHANGES_PERSISTED'}
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity"
          >
            Close Configuration
          </button>
        </div>
      </div>
    </div>
  );
}