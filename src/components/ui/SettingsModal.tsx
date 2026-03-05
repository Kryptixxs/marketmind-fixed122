'use client';

import React from 'react';
import { X, Terminal, Layout } from 'lucide-react';
import { useSettings, Theme, Density, UIStyle } from '@/services/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-background border border-border-strong w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col">
        
        {/* Terminal Header */}
        <div className="panel-header border-b border-border-strong px-4 py-2 flex justify-between items-center text-text-hi font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-accent" />
            <span>sys_config.exe</span>
          </div>
          <button onClick={onClose} className="hover:text-negative text-text-secondary">
            [X]
          </button>
        </div>

        <div className="p-6 space-y-8 text-text-primary">
          
          {/* UI SCHEME TOGGLE */}
          <div className="space-y-3">
            <div className="border-b border-border pb-1 text-accent font-bold uppercase flex items-center gap-2">
              <Layout size={14} />
              UI Scheme
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['terminal', 'modern'] as UIStyle[]).map(s => (
                <button 
                  key={s}
                  onClick={() => updateSettings({ uiStyle: s })}
                  className={`terminal-btn py-3 ${settings.uiStyle === s ? 'bg-accent text-background border-accent' : ''}`}
                >
                  {s === 'terminal' ? 'Institutional Terminal' : 'Modern SaaS'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary italic">
              {settings.uiStyle === 'terminal' 
                ? 'Strict monospace, sharp edges, high data-ink ratio.' 
                : 'Sans-serif typography, rounded corners, soft shadows.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="border-b border-border pb-1 text-accent font-bold uppercase">Color Profile</div>
            <div className="grid grid-cols-2 gap-2">
              {(['dark', 'oled', 'bloomberg', 'classic-terminal'] as Theme[]).map(t => (
                <button 
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`terminal-btn py-2 ${settings.theme === t ? 'bg-accent text-background border-accent' : ''}`}
                >
                  {t.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="border-b border-border pb-1 text-accent font-bold uppercase">Data Density</div>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'standard', 'spacious'] as Density[]).map(d => (
                <button 
                  key={d}
                  onClick={() => updateSettings({ density: d })}
                  className={`terminal-btn py-2 ${settings.density === d ? 'bg-accent text-background border-accent' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          
        </div>

        <div className="bg-surface-highlight border-t border-border-strong px-4 py-3 flex justify-end">
          <button onClick={onClose} className="terminal-btn px-8 py-2">
            EXECUTE
          </button>
        </div>
      </div>
    </div>
  );
}