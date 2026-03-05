'use client';

import React, { useMemo } from 'react';
import { Target, ArrowUpRight, ArrowDownRight, Crosshair, Zap } from 'lucide-react';
import { Tick } from '@/features/MarketData/services/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from '@/lib/tech-math';

export function ICTPanel({ tick, timeframeLabel = '15m' }: { tick?: Tick, timeframeLabel?: string }) {
  const mathData = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 30) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    
    const { swingHighs, swingLows } = findSwingPoints(history);
    const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
    const unmitigatedLows = swingLows.filter(l => !l.mitigated);

    // Find nearest liquidity pools
    const buysideLiquidity = unmitigatedHighs.length > 0 ? Math.min(...unmitigatedHighs.map(h => h.price)) : Math.max(...history.slice(-20).map(h=>h.high));
    const sellsideLiquidity = unmitigatedLows.length > 0 ? Math.max(...unmitigatedLows.map(l => l.price)) : Math.min(...history.slice(-20).map(h=>h.low));

    // Find active imbalances
    const activeFVGs = findUnmitigatedFVGs(history).map(fvg => ({
      ...fvg,
      distance: ((fvg.type === 'BISI' ? fvg.top - current.close : current.close - fvg.bottom) / current.close) * 100
    }));

    // Detect Turtle Soup (Liquidity Sweep)
    let sweep = null;
    if (current.high > buysideLiquidity && current.close < buysideLiquidity) {
      sweep = { type: 'Buy-Side Swept (Turtle Soup)', level: buysideLiquidity };
    } else if (current.low < sellsideLiquidity && current.close > sellsideLiquidity) {
      sweep = { type: 'Sell-Side Swept (Turtle Soup)', level: sellsideLiquidity };
    }

    // Market Structure
    let structure = 'Consolidation';
    if (current.close > buysideLiquidity) structure = 'BOS (Bull Break)';
    else if (current.close < sellsideLiquidity) structure = 'MSS (Bear Shift)';

    // Discount vs Premium
    const dealingRange = Math.max(buysideLiquidity, ...history.slice(-50).map(h=>h.high)) - Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low));
    const eq = Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low)) + (dealingRange / 2);
    const isDiscount = current.close < eq;

    return { 
      buysideLiquidity, sellsideLiquidity, 
      fvgs: activeFVGs.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)).slice(0, 2), 
      sweep, structure, isDiscount 
    };
  }, [tick]);

  if (!tick || !mathData) return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Data</div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={12} /> SMC Arrays ({timeframeLabel})
        </div>
        <span className="text-[8px] text-accent font-mono">ALGO_V4.0</span>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowUpRight size={10}/> Fractal BSL</span>
            <span className="text-xs font-mono font-medium text-text-primary mt-1">{mathData.buysideLiquidity.toFixed(2)}</span>
          </div>
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowDownRight size={10}/> Fractal SSL</span>
            <span className="text-xs font-mono font-medium text-text-primary mt-1">{mathData.sellsideLiquidity.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[10px] text-text-tertiary uppercase font-bold">Structure ({timeframeLabel})</span>
          <span className={`text-xs font-mono font-bold ${mathData.isDiscount ? 'text-positive' : 'text-negative'}`}>
            {mathData.structure} • {mathData.isDiscount ? 'DISCOUNT' : 'PREMIUM'}
          </span>
        </div>

        {mathData.sweep && (
          <div className="bg-warning/10 border border-warning/20 p-2 rounded-sm flex items-center justify-between">
            <span className="text-[10px] text-warning uppercase font-bold flex items-center gap-1"><Zap size={12}/> Sweep Detected</span>
            <span className="text-xs font-mono font-bold text-warning">{mathData.sweep.type}</span>
          </div>
        )}

        <div className="bg-surface-highlight/30 border border-border/50 p-2 flex flex-col gap-2">
          <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1">
            <Crosshair size={12} /> Nearest Active FVGs
          </span>
          {mathData.fvgs.length > 0 ? mathData.fvgs.map((fvg, i) => (
            <div key={i} className="flex justify-between items-center bg-background border border-border/50 px-2 py-1 rounded-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${fvg.type === 'BISI' ? 'bg-positive' : 'bg-negative'}`} />
                <span className="text-[10px] font-bold text-text-primary">{fvg.type === 'BISI' ? 'Demand' : 'Supply'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-text-secondary">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
              </div>
            </div>
          )) : (
             <span className="text-[10px] text-text-tertiary font-mono italic">Price is balanced. No immediate gaps.</span>
          )}
        </div>
      </div>
    </div>
  );
}