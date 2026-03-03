'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, MoreHorizontal, Download, Settings, Trash2, GripHorizontal, RotateCcw } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Widget({ title, children, actions }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to exit maximized state
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

  const handleExport = () => {
    setIsMenuOpen(false);
    const csv = `Widget,${title}\nExportTime,${new Date().toISOString()}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemove = () => {
    setIsMenuOpen(false);
    setIsMaximized(false);
    setIsRemoved(true);
  };

  const handleSettings = () => {
    setIsMenuOpen(false);
    setShowSettings(!showSettings);
  };

  if (isRemoved) {
    return (
      <div className="h-full w-full border border-dashed border-border bg-surface/30 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="text-[10px] text-text-tertiary font-bold uppercase">Widget Removed</span>
        <button onClick={() => setIsRemoved(false)} className="flex items-center gap-1 text-[9px] text-accent hover:underline">
          <RotateCcw size={10} /> Restore "{title}"
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={widgetRef}
      className={`
      flex flex-col border border-border bg-surface overflow-hidden transition-all duration-300
      ${isMaximized ? 'fixed inset-4 z-[200] shadow-2xl border-accent/50 rounded-lg' : 'h-full w-full'}
    `}>
      <div className="panel-header shrink-0 cursor-default group/header">
        <div className="flex items-center gap-2 overflow-hidden">
          <button className="text-text-tertiary hover:text-text-primary cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-100 transition-opacity">
            <GripHorizontal size={12} />
          </button>
          <span className="w-1 h-3 bg-accent opacity-50"></span>
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <div className="h-3 w-[1px] bg-border mx-1" />
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isMaximized ? 'text-accent' : 'text-text-tertiary hover:text-text-primary'}`}
            title={isMaximized ? "Restore Size" : "Maximize Widget"}
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
                  <button onClick={handleExport} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Download size={10} /> Export
                  </button>
                  <button onClick={handleSettings} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
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
      <div className="panel-content flex-1 relative">
        {showSettings ? (
           <div className="absolute inset-0 bg-background/95 backdrop-blur z-50 p-4 flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-bold uppercase text-accent">Widget Settings</h3>
               <button onClick={() => setShowSettings(false)} className="text-text-tertiary hover:text-text-primary"><X size={14}/></button>
             </div>
             <div className="flex flex-col gap-3 flex-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Refresh Rate</label>
                <select className="bg-surface border border-border rounded p-1 text-xs outline-none">
                  <option>Real-time (Stream)</option>
                  <option>5 Seconds</option>
                  <option>30 Seconds</option>
                </select>
                
                <label className="text-[10px] font-bold text-text-secondary uppercase mt-2">Display Theme</label>
                <select className="bg-surface border border-border rounded p-1 text-xs outline-none">
                  <option>Dark (Default)</option>
                  <option>High Contrast</option>
                </select>
             </div>
             <button onClick={() => setShowSettings(false)} className="w-full py-2 bg-accent text-accent-text text-xs font-bold rounded mt-auto">Save Preferences</button>
           </div>
        ) : children}
      </div>
    </div>
  );
}