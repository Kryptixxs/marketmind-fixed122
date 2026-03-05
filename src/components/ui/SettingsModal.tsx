'use client';

import React, { useState } from 'react';
import { X, Monitor, Zap, Cpu, Bell, Shield, Layout, Type, Palette } from 'lucide-react';
import { useSettings, Theme, Density, FontSize, AIDepth } from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'ui' | 'trading' | 'ai' | 'account'>('ui');

  if (!isOpen) return null;

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-l-2 ${
        activeTab === id 
          ? 'bg-accent/10 text-accent border-accent' 
          : 'text-text-tertiary border-transparent hover:text-text-secondary hover:bg-white/5'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-3xl h-[500px] flex flex-col shadow-2xl rounded-sm overflow-hidden">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest">Terminal Preferences</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-border bg-surface flex flex-col py-2">
            <TabButton id="ui" icon={Layout} label="Interface" />
            <TabButton id="trading" icon={Zap} label="Trading" />
            <TabButton id="ai" icon={Cpu} label="Intelligence" />
            <TabButton id="account" icon={Shield} label="Account" />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-background">
            
            {activeTab === 'ui' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                    <Palette size={12} /> Visual Theme
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['dark', 'oled', 'bloomberg', 'light'] as Theme[]).map(t => (
                      <button
                        key={t}
                        onClick={() => updateSettings({ theme: t })}
                        className={`p-3 border rounded-sm text-xs font-bold uppercase transition-all ${
                          settings.theme === t ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-text-secondary hover:border-text-tertiary'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                    <Layout size={12} /> Layout Density
                  </h3>
                  <div className="flex gap-2">
                    {(['compact', 'standard', 'spacious'] as Density[]).map(d => (
                      <button
                        key={d}
                        onClick={() => updateSettings({ density: d })}
                        className={`flex-1 py-2 border rounded-sm text-[10px] font-bold uppercase transition-all ${
                          settings.density === d ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-text-secondary hover:border-text-tertiary'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                    <Type size={12} /> Font Scaling
                  </h3>
                  <div className="flex gap-2">
                    {(['xs', 'sm', 'md'] as FontSize[]).map(f => (
                      <button
                        key={f}
                        onClick={() => updateSettings({ fontSize: f })}
                        className={`flex-1 py-2 border rounded-sm text-[10px] font-bold uppercase transition-all ${
                          settings.fontSize === f ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-text-secondary hover:border-text-tertiary'
                        }`}
                      >
                        {f === 'xs' ? 'Compact' : f === 'sm' ? 'Normal' : 'Large'}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase">Default Risk Per Trade (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={settings.defaultRiskPct}
                    onChange={e => updateSettings({ defaultRiskPct: parseFloat(e.target.value) })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase">Default Chart Timeframe</label>
                  <select 
                    value={settings.defaultTimeframe}
                    onChange={e => updateSettings({ defaultTimeframe: e.target.value })}
                    className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="1d">Daily</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-text-primary uppercase">Auto-Analyze Symbols</span>
                    <span className="text-[10px] text-text-tertiary">Trigger Gemini 2.0 on every symbol change</span>
                  </div>
                  <button 
                    onClick={() => updateSettings({ autoAnalyze: !settings.autoAnalyze })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.autoAnalyze ? 'bg-accent' : 'bg-border'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.autoAnalyze ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Analysis Depth</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['standard', 'deep'] as AIDepth[]).map(d => (
                      <button
                        key={d}
                        onClick={() => updateSettings({ aiDepth: d })}
                        className={`p-4 border rounded-sm text-left transition-all ${
                          settings.aiDepth === d ? 'bg-accent/5 border-accent' : 'bg-surface border-border'
                        }`}
                      >
                        <div className={`text-xs font-bold uppercase ${settings.aiDepth === d ? 'text-accent' : 'text-text-primary'}`}>{d}</div>
                        <div className="text-[9px] text-text-tertiary mt-1">
                          {d === 'standard' ? 'Fast technical summary' : 'Full macro & correlation synthesis'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <Shield size={48} className="text-text-tertiary" />
                <div>
                  <div className="text-xs font-bold text-text-primary uppercase">Institutional Account</div>
                  <div className="text-[10px] text-text-tertiary mt-1">Managed by Vantage Admin</div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-highlight flex justify-between items-center">
          <span className="text-[9px] font-mono text-text-tertiary uppercase">Vantage_OS // Config_v4.0.2</span>
          <button 
            onClick={onClose}
            className="px-6 py-1.5 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}