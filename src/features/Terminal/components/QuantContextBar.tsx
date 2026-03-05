'use client';

import React from 'react';

export function QuantContextBar({ bias = 'Neutral', vol = 'Low', liq = 'High' }) {
  return (
    <div className="h-10 border-t border-border flex items-center px-6 justify-between bg-background">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Net Bias</span>
          <span className="text-[11px] font-bold uppercase tracking-tight">{bias}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Volatility</span>
          <span className="text-[11px] font-bold uppercase tracking-tight">{vol}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Liquidity</span>
          <span className="text-[11px] font-bold uppercase tracking-tight">{liq}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Engine Live</span>
      </div>
    </div>
  );
}