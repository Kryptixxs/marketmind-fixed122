'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, MoreHorizontal, Download, Settings, Trash2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isActiveTerminal?: boolean; // Used to invert header in terminal mode
}

export function Widget({ title, children, actions, isActiveTerminal = false }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

  return (
    <div className={`
      flex flex-col overflow-hidden panel-container relative
      ${isMaximized ? 'fixed inset-4 z-[200] border-accent' : 'h-full w-full'}
    `}>
      <div className={`
        flex items-center justify-between px-3 py-2 shrink-0 cursor-default
        ${isTerminal 
          ? (isActiveTerminal ? 'bg-accent text-accent-text border-b border-accent' : 'bg-black text-text-secondary border-b border-border') 
          : 'border-b border-border bg-transparent text-text-secondary'}
      `}>
        <div className="flex items-center gap-2 overflow-hidden">
          {!isTerminal && <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary shadow-sm" />}
          <span className={`truncate ${isTerminal ? 'font-bold tracking-widest text-[10px]' : 'font-medium tracking-wide text-xs'}`}>
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <div className={`h-3 w-[1px] mx-1 ${isTerminal ? (isActiveTerminal ? 'bg-black/20' : 'bg-border') : 'bg-border'}`} />
          <button onClick={() => setIsMaximized(!isMaximized)} className={`p-1 transition-colors ${isTerminal && isActiveTerminal ? 'hover:bg-black/10' : 'hover:text-text-primary hover:bg-white/10 rounded-md'}`}>
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-1 transition-colors ${isTerminal && isActiveTerminal ? 'hover:bg-black/10' : 'hover:text-text-primary hover:bg-white/10 rounded-md'}`}>
              <MoreHorizontal size={12} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className={`absolute right-0 mt-1 w-32 z-20 py-1 ${isTerminal ? 'bg-black border border-border shadow-none' : 'bg-surface-highlight border border-border shadow-2xl rounded-lg backdrop-blur-xl'}`}>
                  <button className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase hover:bg-white/5 text-text-primary flex items-center gap-2">
                    <Download size={12} /> Export
                  </button>
                  <button className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase hover:bg-white/5 text-text-primary flex items-center gap-2">
                    <Settings size={12} /> Config
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden bg-transparent">
        {children}
      </div>
    </div>
  );
}