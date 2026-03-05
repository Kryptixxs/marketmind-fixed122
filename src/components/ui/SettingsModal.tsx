'use client';

import React from 'react';
import { X, Monitor, Layout, Type, Bell, Shield, Database, Zap } from 'lucide-react';
import { useSettings, Theme, Density, FontSize } from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl rounded-sm overflow-hidden">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest">Terminal Preferences</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 border-r border-border bg-surface-highlight/30 flex flex-col py-2">
            {[
              { id: 'ui', label: 'Interface', icon: Monitor },
              { id: 'trading', label: 'Trading', icon: Zap },
              { id: 'data', label: 'Data & AI', icon: Database },
              { id: 'notifications', label: 'Alerts', icon: Bell },
            ].map(tab => (
              <button key={tab.id} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-white/5 text-left">
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {/* Theme Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                <Monitor size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Visual Theme</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['dark', 'oled', 'bloomberg', 'light'] as Theme[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => updateSettings({ theme: t })}
                    className={`p-3 border rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${settings.theme === t ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            {/* Density Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                <Layout size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Display Density</span>
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
            </section>

            {/* Font Size Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                <Type size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Base Font Size</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['xs', 'sm', 'md'] as FontSize[]).map(f => (
                  <button 
                    key={f}
                    onClick={() => updateSettings({ fontSize: f })}
                    className={`p-3 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${settings.fontSize === f ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'}`}
                  >
                    {f === 'xs' ? '11px' : f === 'sm' ? '12px' : '14px'}
                  </button>
                ))}
              </div>
            </section>

            {/* Toggles */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                <Shield size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Interface Elements</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="text-xs font-bold text-text-primary uppercase">Show Global Ticker</span>
                  <input 
                    type="checkbox" 
                    checked={settings.showTicker} 
                    onChange={e => updateSettings({ showTicker: e.target.checked })}
                    className="w-4 h-4 accent-accent"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-background border border-border rounded-sm cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="text-xs font-bold text-text-primary uppercase">Show System Statusbar</span>
                  <input 
                    type="checkbox" 
                    checked={settings.showStatusbar} 
                    onChange={e => updateSettings({ showStatusbar: e.target.checked })}
                    className="w-4 h-4 accent-accent"
                  />
                </label>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-highlight flex justify-between items-center">
          <span className="text-[10px] font-mono text-text-tertiary uppercase">Settings are synced to your institutional profile.</span>
          <button onClick={onClose} className="px-6 py-2 bg-accent text-accent-text text-xs font-bold uppercase rounded-sm hover:opacity-90 transition-opacity">Done</button>
        </div>
      </div>
    </div>
  );
}