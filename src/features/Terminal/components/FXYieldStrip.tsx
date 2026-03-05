'use client';

import React from 'react';

export function FXYieldStrip() {
  return (
    <div className="h-8 border-t border-border bg-background flex items-center px-4 justify-between overflow-hidden">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">DXY Index</span>
          <span className="text-[11px] font-bold font-mono">104.24 <span className="text-positive text-[9px]">+0.12%</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">US-DE 10Y Spread</span>
          <span className="text-[11px] font-bold font-mono">184.2bps <span className="text-negative text-[9px]">-2.4</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">Risk Regime</span>
          <span className="text-[11px] font-bold uppercase text-warning">Risk-Off</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">Session</span>
          <span className="text-[10px] font-bold text-accent">LONDON / NY OVERLAP</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
      </div>
    </div>
  );
}