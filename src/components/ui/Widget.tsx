'use client';

import React, { useState } from 'react';
import { Maximize2, MoreHorizontal, Download, Settings, Trash2, Minimize2 } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Widget({ title, children, actions }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRemove = () => {
    alert('Widget removal coming soon in Workspace Customization mode.');
    setIsMenuOpen(false);
  };

  return (
    <div className={`
      flex flex-col border border-border bg-surface overflow-hidden transition-all duration-300
      ${isMaximized ? 'fixed inset-4 z-[150] shadow-2xl' : 'h-full w-full'}
    `}>
      <div className="panel-header shrink-0 flex items-center justify-between bg-surface-highlight/50 border-b border-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-text-secondary">{title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <div className="h-3 w-[1px] bg-border mx-1" />
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isMaximized ? 'text-accent' : 'text-text-tertiary'}`}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-1 rounded hover:bg-white/10 transition-colors ${isMenuOpen ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              <MoreHorizontal size={12} />
            </button>
            
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-32 bg-surface-highlight border border-border shadow-xl z-20 py-1 rounded-sm">
                  <button onClick={() => { alert('Exporting widget data...'); setIsMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Download size={10} /> Export
                  </button>
                  <button onClick={() => { alert('Widget settings coming soon'); setIsMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Settings size={10} /> Settings
                  </button>
                  <div className="h-[1px] bg-border my-1" />
                  <button onClick={handleRemove} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 text-negative flex items-center gap-2">
                    <Trash2 size={10} /> Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="panel-content flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}