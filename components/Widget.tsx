'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, MoreHorizontal, Download, Settings, Trash2, GripHorizontal } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Widget({ title, children, actions }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to exit maximized state
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      widgetRef.current?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleAction = (action: string) => {
    setIsMenuOpen(false);
    alert(`${action} coming in v4.1 workspace customization update.`);
  };

  return (
    <div 
      ref={widgetRef}
      className={`
      flex flex-col border border-border bg-surface overflow-hidden transition-all duration-300
      ${isMaximized ? 'fixed inset-4 z-[200] shadow-2xl border-accent/50 rounded-lg' : 'h-full w-full'}
    `}>
      <div className="panel-header shrink-0 cursor-default group/header">
        <div className="flex items-center gap-2 overflow-hidden">
          <button onClick={() => alert('Drag & Drop workspace customization coming soon.')} className="text-text-tertiary hover:text-text-primary cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-100 transition-opacity">
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
                  <button onClick={() => handleAction('Export Data')} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Download size={10} /> Export
                  </button>
                  <button onClick={() => handleAction('Widget Settings')} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 flex items-center gap-2">
                    <Settings size={10} /> Settings
                  </button>
                  <div className="h-[1px] bg-border my-1" />
                  <button onClick={() => handleAction('Remove Widget')} className="w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase hover:bg-white/5 text-negative flex items-center gap-2">
                    <Trash2 size={10} /> Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="panel-content flex-1 relative">
        {children}
      </div>
    </div>
  );
}