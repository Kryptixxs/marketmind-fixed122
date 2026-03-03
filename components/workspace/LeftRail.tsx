'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

export function LeftRail({ activeSymbol, setActiveSymbol }: { activeSymbol: string, setActiveSymbol: (s: string) => void }) {
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];
  const arrays = ['Buy-Side Liquidity', 'Sell-Side Liquidity', 'Fair Value Gaps', 'Order Blocks', 'Daily Open', 'Midnight Open'];

  return (
    <div className="region-panel h-full w-[20%] min-w-[200px]">
      <div className="region-header">
        <span>{isTerminal ? 'CTRL_RAIL // TICKER' : 'Market Selection'}</span>
      </div>
      
      <div className="p-2 flex flex-col gap-2">
        <input 
          type="text" 
          value={activeSymbol}
          onChange={(e) => setActiveSymbol(e.target.value.toUpperCase())}
          className="exec-input font-bold text-xs" 
          placeholder="SYMBOL"
        />
        
        <div className={`grid grid-cols-3 ${isTerminal ? 'gap-0 border border-border' : 'gap-1'}`}>
          {timeframes.map(tf => (
            <button key={tf} className={`py-1 text-[10px] font-mono ${isTerminal ? 'border-b border-r border-border hover:bg-border' : 'bg-background border border-border rounded-sm hover:bg-border'}`}>
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="region-header mt-2 border-t">
        <span>{isTerminal ? 'ICT_ENGINE // ARRAYS' : 'Structural Overlays'}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {arrays.map(arr => (
          <label key={arr} className={`flex items-center gap-2 cursor-pointer p-1.5 ${isTerminal ? 'hover:bg-border' : 'hover:bg-background rounded-sm'}`}>
            <input type="checkbox" className="accent-accent" defaultChecked={arr.includes('Liquidity')} />
            <span className={isTerminal ? 'font-mono text-[9px]' : 'text-[11px] text-text-secondary'}>{arr}</span>
          </label>
        ))}
      </div>
    </div>
  );
}