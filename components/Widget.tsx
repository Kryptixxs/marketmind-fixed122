'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, MoreHorizontal, Download, Settings, Trash2, GripHorizontal } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Widget({ title, children, actions }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

  return (
    <div 
      ref={widgetRef}
      className={`
      flex flex-col overflow-hidden panel-container relative
      ${isMaximized ? 'fixed inset-4 z-[200] !border-accent' : 'h-full w-full'}
    `}>
      <div className="panel-header cursor-default group/header">
        <div className="flex items-center gap-3 overflow-hidden">
          {settings.uiTheme === 'architect' && (
            <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
          )}
          <span className="truncate tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <div className="h-3 w-[1px] bg-border mx-2" />
          <button onClick={() => setIsMaximized(!isMaximized)} className="text-text-tertiary hover:text-text-primary transition-colors">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-tertiary hover:text-text-primary transition-colors">
              <MoreHorizontal size={12} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-32 bg-background border border-border z-20 py-1 shadow-2xl">
                  <button className="w-full px-3 py-2 text-left text-[10px] hover:bg-surface text-text-primary">Export</button>
                  <button className="w-full px-3 py-2 text-left text-[10px] hover:bg-surface text-text-primary">Settings</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="panel-content relative">
        {children}
      </div>
    </div>
  );
}