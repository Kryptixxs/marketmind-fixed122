'use client';

import React, { useState } from 'react';
import { Maximize2, MoreHorizontal, Download, Settings, Trash2 } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Widget({ title, children, actions }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={`
      flex flex-col border border-border bg-surface overflow-hidden transition-all duration-300 h-full w-full
      ${isMaximized ? 'fixed inset-2 z-[60] shadow-2xl' : 'relative'}
    `}>
      <div className="panel-header shrink-0 flex items-center justify-between border-b border-border bg-surface-highlight">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate font-bold uppercase tracking-widest text-[10px] text-text-secondary">{title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <div className="h-3 w-[1px] bg-border mx-1" />
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isMaximized ? 'text-accent' : 'text-text-tertiary'}`}
          >
            <Maximize2 size={14} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-1 rounded hover:bg-white/10 transition-colors ${isMenuOpen ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              <MoreHorizontal size={14} />
            </button>
            
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-40 bg-surface-highlight border border-border shadow-xl z-20 py-1 rounded-sm">
                  <button onClick={() => { alert('Exporting...'); setIsMenuOpen(false); }} className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Download size={12} /> Export Data
                  </button>
                  <button onClick={() => { alert('Settings...'); setIsMenuOpen(false); }} className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Settings size={12} /> Widget Config
                  </button>
                  <div className="h-[1px] bg-border my-1" />
                  <button onClick={() => setIsMenuOpen(false)} className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase hover:bg-white/5 text-negative flex items-center gap-2">
                    <Trash2 size={12} /> Remove Widget
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
}