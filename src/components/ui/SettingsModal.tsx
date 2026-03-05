'use client';

import React, { useState } from 'react';
import { 
  X, Monitor, Layout, Type, Bell, Shield, Database, Zap, 
  RefreshCw, Brain, Keyboard, Volume2, Clock, Globe, 
  CreditCard, ShieldAlert, RotateCcw, Palette
} from 'lucide-react';
import { 
  useSettings, Theme, Density, FontSize, AIDepth, 
  FontFamily, BorderStyle 
} from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'ui' | 'trading' | 'data' | 'system' | 'security';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetToDefaults } = useSettings();
  const [activeTab, setActiveTab] = useState<TabId>('ui');

  if (!isOpen) return null;

  const tabs = [
    { id: 'ui' as TabId, label: 'Interface', icon: Monitor },
    { id: 'trading' as TabId, label: 'Trading', icon: Zap },
    { id: 'data' as TabId, label: 'Data & AI', icon: Database },
    { id: 'system' as TabId, label: 'System', icon: Keyboard },
    { id: 'security' as TabId, label: 'Security', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl rounded-sm overflow-hidden">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest">Terminal Configuration // v5.0</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase text-text-tertiary hover:text-text-primary transition-colors"
            >
              <RotateCcw size={12} /> Reset Defaults
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-border bg-surface-highlight/30 flex flex-col py-2">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors text-left ${
                  activeTab === tab.id 
                    ? 'text-accent bg-accent/5 border-r-2 border-accent' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            
            {activeTab === 'ui' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                {/* Theme Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Palette size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Visual Identity</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'oled', 'bloomberg', 'terminal-green', 'classic-blue', 'light'] as Theme[]).map(t => (
                      <button 
                        key={t}
                        onClick={() => updateSettings({ theme: t })}
                        className={`p-3 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${settings.theme === t ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'}`}
                      >
                        {t.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Typography Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Type size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Typography & Scaling</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">Font Family</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['mono', 'sans', 'serif'] as FontFamily[]).map(f => (
                          <button 
                            key={f}
                            onClick={() => updateSettings({ fontFamily: f })}
                            className={`py-2 border rounded-sm text-[10px] font-bold uppercase ${settings.fontFamily === f ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">Base Size</label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['xs', 'sm', 'md', 'lg'] as FontSize[]).map(f => (
                          <button 
                            key={f}
                            onClick={() => updateSettings({ fontSize: f })}
                            className={`py-2 border rounded-sm text-[10px] font-bold uppercase ${settings.fontSize === f ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Layout Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Layout size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Layout & Density</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact', 'standard', 'spacious'] as Density[]).map(d => (
                      <button 
                        key={d}
                        onClick={() => updateSettings({ density: d })}
                        className={`p-3 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${settings.density === d ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                      <span className="text-[10px] font-bold text-text-primary uppercase">Show Grid Lines</span>
                      <input 
                        type="checkbox" 
                        checked={settings.showGridLines} 
                        onChange={e => updateSettings({ showGridLines: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                      <span className="text-[10px] font-bold text-text-primary uppercase">Enable Animations</span>
                      <input 
                        type="checkbox" 
                        checked={settings.animationsEnabled} 
                        onChange={e => updateSettings({ animationsEnabled: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Risk Management</span>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Default Risk Per Trade (%)</label>
                      <input 
                        type="range" min="0.1" max="10" step="0.1"
                        value={settings.defaultRiskPct}
                        onChange={e => updateSettings({ defaultRiskPct: parseFloat(e.target.value) })}
                        className="w-full accent-accent"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-text-tertiary mt-1">
                        <span>0.1%</span>
                        <span className="text-accent font-bold">{settings.defaultRiskPct}%</span>
                        <span>10.0%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-text-tertiary uppercase">Risk Tolerance Profile</label>
                        <select 
                          value={settings.riskTolerance}
                          onChange={e => updateSettings({ riskTolerance: e.target.value as any })}
                          className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent"
                        >
                          <option value="Conservative">Conservative (Wealth Preservation)</option>
                          <option value="Moderate">Moderate (Balanced Growth)</option>
                          <option value="Aggressive">Aggressive (High Alpha)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-text-tertiary uppercase">Default Leverage</label>
                        <input 
                          type="number" min="1" max="100"
                          value={settings.defaultLeverage}
                          onChange={e => updateSettings({ defaultLeverage: parseInt(e.target.value) })}
                          className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Globe size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Execution Preferences</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">Preferred Exchange Feed</label>
                      <select 
                        value={settings.preferredExchange}
                        onChange={e => updateSettings({ preferredExchange: e.target.value as any })}
                        className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent"
                      >
                        <option value="NASDAQ">NASDAQ (Direct)</option>
                        <option value="NYSE">NYSE (Direct)</option>
                        <option value="CME">CME (Futures)</option>
                        <option value="ICE">ICE (Global)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">Commission Per Lot ($)</label>
                      <input 
                        type="number" step="0.01"
                        value={settings.commissionPerLot}
                        onChange={e => updateSettings({ commissionPerLot: parseFloat(e.target.value) })}
                        className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent font-mono"
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Brain size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Intelligence Engine</span>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(['standard', 'deep', 'quant'] as AIDepth[]).map(depth => (
                        <button 
                          key={depth}
                          onClick={() => updateSettings({ aiDepth: depth })}
                          className={`p-3 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${settings.aiDepth === depth ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'}`}
                        >
                          {depth}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-primary uppercase">Auto-Analyze Symbols</span>
                        <span className="text-[8px] text-text-tertiary uppercase">Trigger AI synthesis on every symbol change</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.autoAnalyze} 
                        onChange={e => updateSettings({ autoAnalyze: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <RefreshCw size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Data Propagation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">Refresh Interval</label>
                      <select 
                        value={settings.refreshInterval}
                        onChange={e => updateSettings({ refreshInterval: parseInt(e.target.value) })}
                        className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent"
                      >
                        <option value={5000}>5 Seconds (Ultra-Low Latency)</option>
                        <option value={15000}>15 Seconds (High Performance)</option>
                        <option value={30000}>30 Seconds (Standard)</option>
                        <option value={60000}>1 Minute (Battery Saver)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">Data Mode</label>
                      <select 
                        value={settings.dataDelayMode}
                        onChange={e => updateSettings({ dataDelayMode: e.target.value as any })}
                        className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent"
                      >
                        <option value="realtime">Real-time (Direct)</option>
                        <option value="delayed">Delayed (15m)</option>
                        <option value="simulated">Simulated (Paper)</option>
                      </select>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Keyboard size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Navigation & Input</span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-primary uppercase">Keyboard-First Mode</span>
                        <span className="text-[8px] text-text-tertiary uppercase">Optimize UI for hotkey-driven navigation</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.keyboardFirstMode} 
                        onChange={e => updateSettings({ keyboardFirstMode: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                      <span className="text-[10px] font-bold text-text-primary uppercase">Enable Audio Feedback</span>
                      <input 
                        type="checkbox" 
                        checked={settings.soundEnabled} 
                        onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Session Management</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-text-tertiary uppercase">Auto-Lock Session (Minutes)</label>
                    <input 
                      type="number" min="5" max="1440"
                      value={settings.sessionTimeout}
                      onChange={e => updateSettings({ sessionTimeout: parseInt(e.target.value) })}
                      className="w-full bg-background border border-border rounded-sm p-2 text-xs text-text-primary outline-none focus:border-accent font-mono"
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <Shield size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Institutional Security</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-sm">
                      <div className="flex items-center gap-2 text-accent mb-2">
                        <Shield size={16} />
                        <span className="text-[10px] font-bold uppercase">Encrypted Session Active</span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-relaxed">
                        Your terminal session is protected by AES-256 end-to-end encryption. All settings and preferences are synced securely to your institutional profile.
                      </p>
                    </div>
                    <button className="w-full py-3 bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-widest text-text-primary hover:bg-white/5 transition-colors">
                      Manage Hardware MFA
                    </button>
                    <button className="w-full py-3 bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-widest text-text-primary hover:bg-white/5 transition-colors">
                      View Audit Logs
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                    <CreditCard size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Entitlements</span>
                  </div>
                  <div className="p-4 bg-surface-highlight/50 border border-border rounded-sm flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-primary uppercase">Current Tier</span>
                      <span className="text-xs font-black text-accent uppercase tracking-tighter">Vantage Pro</span>
                    </div>
                    <button className="px-3 py-1.5 bg-accent text-accent-text text-[9px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity">
                      Upgrade
                    </button>
                  </div>
                </section>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-highlight flex justify-between items-center">
          <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider">Institutional settings are persistent across all authorized nodes.</span>
          <button onClick={onClose} className="px-8 py-2 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity shadow-lg shadow-accent/10">Apply Changes</button>
        </div>
      </div>
    </div>
  );
}