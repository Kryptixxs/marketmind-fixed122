'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

export function GlobalStatus() {
  const { settings, setUITheme } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toISOString().split('T')[1].slice(0, 8)), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isTerminal) {
    return (
      <div className="h-[24px] shrink-0 border-b border-border flex items-center justify-between px-2 font-mono text-[10px] bg-background text-text-secondary">
        <div className="flex items-center gap-4">
          <span className="text-positive font-bold">[SYS_HEALTH: OK]</span>
          <span>[LATENCY: 12ms]</span>
          <span>[FEED: INST_DIRECT]</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{time} UTC</span>
          <button onClick={() => setUITheme('architect')} className="hover:text-accent">[SWAP_TO_ARCHITECT]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[32px] shrink-0 flex items-center justify-between px-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-positive" />
          <span className="text-xs font-semibold tracking-wide text-text-primary">Vantage Workspace</span>
        </div>
        <div className="h-3 w-[1px] bg-border" />
        <span className="text-[10px] text-text-secondary font-mono">L: 12ms</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setUITheme('terminal')} className="text-[10px] font-bold text-text-tertiary hover:text-text-primary transition-colors">
          TERMINAL MODE
        </button>
      </div>
    </div>
  );
}