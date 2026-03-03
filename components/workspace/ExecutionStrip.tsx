'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

export function ExecutionStrip() {
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';

  return (
    <div className="region-panel h-[14%] min-h-[100px] shrink-0 flex flex-row">
      
      {/* Position Sizing */}
      <div className={`flex flex-col justify-center p-3 w-[20%] ${isTerminal ? 'border-r border-border' : 'border-r border-border'}`}>
        <span className={isTerminal ? "text-[9px] text-text-dim mb-1" : "text-[10px] text-text-secondary font-bold mb-1"}>
          {isTerminal ? 'QTY_CONTRACTS' : 'Position Size'}
        </span>
        <div className="flex items-center gap-1">
          <input type="number" defaultValue="5" className="exec-input text-lg font-bold w-16 text-center" />
          <div className="flex flex-col gap-0.5">
            <button className={`px-2 py-0 text-[8px] ${isTerminal ? 'bg-border text-text-primary' : 'bg-background border border-border rounded-sm'}`}>+</button>
            <button className={`px-2 py-0 text-[8px] ${isTerminal ? 'bg-border text-text-primary' : 'bg-background border border-border rounded-sm'}`}>-</button>
          </div>
        </div>
      </div>

      {/* Order Entry */}
      <div className={`flex items-center gap-2 p-3 w-[40%] ${isTerminal ? 'border-r border-border' : 'border-r border-border'}`}>
        <button className={`flex-1 h-full font-bold tracking-widest ${isTerminal ? 'bg-negative text-black border border-negative hover:bg-black hover:text-negative' : 'bg-negative/10 border border-negative/30 text-negative rounded-sm hover:bg-negative/20'}`}>
          SELL MKT
        </button>
        <button className={`flex-1 h-full font-bold tracking-widest ${isTerminal ? 'bg-positive text-black border border-positive hover:bg-black hover:text-positive' : 'bg-positive/10 border border-positive/30 text-positive rounded-sm hover:bg-positive/20'}`}>
          BUY MKT
        </button>
      </div>

      {/* Risk Metrics & PnL */}
      <div className="flex-1 flex items-center justify-between p-4">
        <div className="flex flex-col">
          <span className={isTerminal ? "text-[9px] text-text-dim" : "text-[10px] text-text-secondary"}>DAY_PNL</span>
          <span className={`text-xl font-mono font-bold text-positive`}>+$4,250.00</span>
        </div>
        <div className="flex flex-col text-right">
          <span className={isTerminal ? "text-[9px] text-text-dim" : "text-[10px] text-text-secondary"}>OPEN_RISK</span>
          <span className="text-sm font-mono text-text-primary">$0.00</span>
        </div>
      </div>

    </div>
  );
}