'use client';

import React from 'react';
import { X, Monitor, Type, Layout, RefreshCw, Check, Zap, Terminal, Globe } from 'lucide-react';
import { useSettings, Theme, Density, FontSize } from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetToDefaults, isSyncing } = useSettings();

  if (!isOpen) return null;

  const themes: { id: Theme; label: string; icon: any; desc: string }[] = [
    { id: 'fx-desk', label: 'FX Desk', icon: Globe, desc: 'Institutional currency workstation with matrix grid and macro drivers.' },
    { id: 'quant', label: 'Modern Quant', icon: Zap, desc: 'Minimalist, monochrome, high-whitespace surgical interface.' },
    { id: 'bloomberg', label: 'Bloomberg', icon: Terminal, desc: 'Institutional-grade, high-density modular dashboard.' },
    { id: 'dark', label: 'Standard Dark', icon: Monitor, desc: 'Classic dark mode with standard contrast.' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-accent" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Terminal Preferences</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Theme Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Interface Theme</h3>
              {isSyncing && <span className="text-[9px] text-accent animate-pulse font-mono">SYNCING...</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  className={`p-4 border text-left transition-all group relative ${
                    settings.theme === t.id 
                      ? 'bg-accent/5 border-accent ring-1 ring-accent' 
                      : 'bg-background border-border hover:border-border-highlight'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <t.icon size={16} className={settings.theme === t.id ? 'text-accent' : 'text-text-tertiary'} />
                      <span className="text-xs font-bold uppercase tracking-tight">{t.label}</span>
                    </div>
                    {settings.theme === t.id && <Check size={14} className="text-accent" />}
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Density & Font */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Data Density</h3>
              <div className="flex p-1 bg-background border border-border rounded-sm gap-1">
                {(['compact', 'standard', 'spacious'] as Density[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => updateSettings({ density: d })}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-sm transition-all ${
                      settings.density === d ? 'bg-surface-highlight text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Base Font Size</h3>
              <div className="flex p-1 bg-background border border-border rounded-sm gap-1">
                {(['xs', 'sm', 'md', 'lg'] as FontSize[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => updateSettings({ fontSize: f })}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-sm transition-all ${
                      settings.fontSize === f ? 'bg-surface-highlight text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Data Refresh */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Data Refresh Interval</h3>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="5000" 
                max="60000" 
                step="5000"
                value={settings.refreshInterval}
                onChange={(e) => updateSettings({ refreshInterval: parseInt(e.target.value) })}
                className="flex-1 accent-accent"
              />
              <span className="text-xs font-mono font-bold w-12 text-right">{(settings.refreshInterval / 1000).toFixed(0)}s</span>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-highlight flex justify-between items-center">
          <button 
            onClick={resetToDefaults}
            className="text-[10px] font-bold uppercase text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-2"
          >
            <RefreshCw size={12} /> Reset to Defaults
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return <Monitor {...props} />;
}