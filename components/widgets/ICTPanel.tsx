'use client';

import React, { useMemo } from 'react';
import { Target, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Tick, OHLCV } from '@/lib/marketdata/types';

export function ICTPanel({ tick }: { tick?: Tick }) {
  const data = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 10) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    const prev = history[history.length - 2];
    
    // 1. FVG (Fair Value Gap) Detection
    const fvgs: { type: 'BISI' | 'SIBI', zone: string, age: number }[] = [];
    // Scan last 10 periods for untested gaps
    for (let i = history.length - 10; i < history.length - 2; i++) {
      const h1 = history[i];
      const h3 = history[i+2];
      
      // Bullish Imbalance (BISI): Low of candle 3 is higher than High of candle 1
      if (h3.low > h1.high) {
        fvgs.push({ type: 'BISI', zone: `${h1.high.toFixed(2)} - ${h3.low.toFixed(2)}`, age: history.length - i });
      }
      // Bearish Imbalance (SIBI): High of candle 3 is lower than Low of candle 1
      else if (h3.high < h1.low) {
        fvgs.push({ type: 'SIBI', zone: `${h3.high.toFixed(2)} - ${h1.low.toFixed(2)}`, age: history.length - i });
      }
    }

    // 2. Liquidity Sweeps
    // Did we pierce a recent swing high/low but close back inside the range?
    const recentHighs = history.slice(-20, -1).map(h => h.high);
    const recentLows = history.slice(-20, -1).map(h => h.low);
    const localHigh = Math.max(...recentHighs);
    const localLow = Math.min(...recentLows);

    let sweep = null;
    if (current.high > localHigh && current.close < localHigh) {
      sweep = { type: 'Buy-Side Sweep', level: localHigh.toFixed(2), sentiment: 'Bearish' };
    } else if (current.low < localLow && current.close > localLow) {
      sweep = { type: 'Sell-Side Sweep', level: localLow.toFixed(2), sentiment: 'Bullish' };
    }

    // 3. Market Structure (BOS / CHOCH)
    let structure = 'Consolidation';
    if (current.close > localHigh) structure = 'BOS (Bullish Break)';
    else if (current.close < localLow) structure = 'MSS (Bearish Shift)';

    // Premium / Discount Array
    const dealingRange = localHigh - localLow;
    const eq = localHigh - (dealingRange / 2);
    const discount = current.close < eq;

    return { fvgs: fvgs.reverse().slice(0, 3), sweep, structure, eq, discount };
  }, [tick]);

  if (!data) {
    return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Price Data</div>;
  }

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={10} /> Smart Money Concepts
        </div>
        <span className="text-[8px] text-accent font-mono">MATH_ENG_V1</span>
      </div>
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        {/* Structure Block */}
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Structure</span>
          <span className={`text-[10px] font-mono font-bold ${data.structure.includes('Bullish') ? 'text-positive' : data.structure.includes('Bearish') ? 'text-negative' : 'text-text-primary'}`}>
            {data.structure}
          </span>
        </div>

        {/* Dealing Range */}
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Array Status</span>
          <span className={`text-[10px] font-mono font-bold ${data.discount ? 'text-positive' : 'text-negative'}`}>
            {data.discount ? 'DISCOUNT (< 50%)' : 'PREMIUM (> 50%)'}
          </span>
        </div>

        {/* Liquidity Sweeps */}
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm">
          <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1">
            <Activity size={10} /> Liquidity Interaction
          </div>
          {data.sweep ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-primary">{data.sweep.type} @ {data.sweep.level}</span>
              {data.sweep.sentiment === 'Bullish' ? <ArrowUpRight size={14} className="text-positive" /> : <ArrowDownRight size={14} className="text-negative" />}
            </div>
          ) : (
            <span className="text-[10px] text-text-tertiary font-mono">No recent raids detected.</span>
          )}
        </div>

        {/* FVGs */}
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm">
          <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1">
            <AlertTriangle size={10} /> Imbalances (FVG)
          </div>
          <div className="space-y-1">
            {data.fvgs.length > 0 ? data.fvgs.map((fvg, i) => (
              <div key={i} className="flex justify-between items-center bg-background border border-border/50 px-2 py-1 rounded-sm">
                <span className={`text-[9px] font-bold ${fvg.type === 'BISI' ? 'text-positive' : 'text-negative'}`}>{fvg.type}</span>
                <span className="text-[9px] font-mono text-text-secondary">{fvg.zone}</span>
              </div>
            )) : (
               <span className="text-[10px] text-text-tertiary font-mono">Market is balanced.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}