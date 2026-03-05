'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Monitor, Layout, Zap, Shield, Database, Sliders, Palette } from 'lucide-react';
import { useSettings, Theme, Density, FontSize, AIDepth } from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetToDefaults, isSyncing } = useSettings();

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const Control = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-text-secondary uppercase">{label}</label>
      {children}
    </div>
  );

  const Select = ({ value, onChange, options }: { value: string, onChange: (v: any) => void, options: string[] }) => (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface border border-border rounded-sm px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-accent' : 'bg-surface-highlight border border-border'}`}
    >
      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-4.5' : 'left-0.5'}`} />
    </button>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-3xl max-h-[85vh] bg-background border border-border shadow-2xl z-[101] flex flex-col overflow-hidden rounded-sm">
          
          <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
            <div className="flex items-center gap-3">
              <Sliders size={16} className="text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest">Terminal Configuration</span>
              {isSyncing && <span className="text-[8px] text-accent animate-pulse">SYNCING...</span>}
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
            
            <Section title="Visual Interface" icon={Palette}>
              <Control label="Theme Profile">
                <Select 
                  value={settings.theme} 
                  onChange={(v) => updateSettings({ theme: v })} 
                  options={['dark', 'light', 'oled', 'bloomberg', 'terminal-green', 'classic-blue']} 
                />
              </Control>
              <Control label="Data Density">
                <Select 
                  value={settings.density} 
                  onChange={(v) => updateSettings({ density: v })} 
                  options={['compact', 'standard', 'spacious']} 
                />
              </Control>
              <Control label="Base Font Size">
                <Select 
                  value={settings.fontSize} 
                  onChange={(v) => updateSettings({ fontSize: v })} 
                  options={['xs', 'sm', 'md', 'lg']} 
                />
              </Control>
              <Control label="Border Style">
                <Select 
                  value={settings.borderStyle} 
                  onChange={(v) => updateSettings({ borderStyle: v })} 
                  options={['none', 'thin', 'bold']} 
                />
              </Control>
            </Section>

            <Section title="Market Intelligence" icon={Zap}>
              <Control label="Risk Tolerance">
                <Select 
                  value={settings.riskTolerance} 
                  onChange={(v) => updateSettings({ riskTolerance: v })} 
                  options={['Conservative', 'Moderate', 'Aggressive']} 
                />
              </Control>
              <Control label="AI Synthesis Depth">
                <Select 
                  value={settings.aiDepth} 
                  onChange={(v) => updateSettings({ aiDepth: v })} 
                  options={['standard', 'deep', 'quant']} 
                />
              </Control>
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-primary uppercase">Auto-Analyze</span>
                  <span className="text-[9px] text-text-tertiary">Trigger AI on symbol change</span>
                </div>
                <Toggle checked={settings.autoAnalyze} onChange={(v) => updateSettings({ autoAnalyze: v })} />
              </div>
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-primary uppercase">Animations</span>
                  <span className="text-[9px] text-text-tertiary">Enable UI transitions</span>
                </div>
                <Toggle checked={settings.animationsEnabled} onChange={(v) => updateSettings({ animationsEnabled: v })} />
              </div>
            </Section>

            <Section title="Data Infrastructure" icon={Database}>
              <Control label="Refresh Interval (ms)">
                <input 
                  type="number" 
                  value={settings.refreshInterval} 
                  onChange={(e) => updateSettings({ refreshInterval: parseInt(e.target.value) })}
                  className="bg-surface border border-border rounded-sm px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                />
              </Control>
              <Control label="Data Mode">
                <Select 
                  value={settings.dataDelayMode} 
                  onChange={(v) => updateSettings({ dataDelayMode: v })} 
                  options={['realtime', 'delayed', 'simulated']} 
                />
              </Control>
            </Section>

          </div>

          <div className="p-4 border-t border-border bg-surface-highlight flex justify-between items-center">
            <button 
              onClick={resetToDefaults}
              className="text-[10px] font-bold text-text-tertiary hover:text-text-primary uppercase tracking-widest transition-colors"
            >
              Reset to Factory Defaults
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
            >
              Apply & Close
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}