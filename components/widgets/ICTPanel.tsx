'use client';

import React, { useMemo } from 'react';
import { Target, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Crosshair, Zap } from 'lucide-react';
import { Tick } from '@/lib/marketdata/types';

export function ICTPanel({ tick }: { tick?: Tick }) {
  const data = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 15) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    
    // 1. Find recent Swing Highs / Lows (Liquidity Pools)
    const recentHighs = history.slice(-30, -1).map(h => h.high);
    const recentLows = history.slice(-30, -1).map(h => h.low);
    const buysideLiquidity = Math.max(...recentHighs);
    const sellsideLiquidity = Math.min(...recentLows);

    // 2. FVG (Fair Value Gap) Detection
    const fvgs: { type: 'BISI' | 'SIBI', top: number, bottom: number, distance: number }[] = [];
    for (let i = history.length - 15; i < history.length - 2; i++) {
      const h1 = history[i];
      const h3 = history[i+2];
      
      if (h3.low > h1.high) {
        fvgs.push({ type: 'BISI', top: h3.low, bottom: h1.high, distance: ((current.close - h1.high) / current.close) * 100 });
      } else if (h3.high < h1.low) {
        fvgs.push({ type: 'SIBI', top: h1.low, bottom: h3.high, distance: ((h1.low - current.close) / current.close) * 100 });
      }
    }

    // 3. Liquidity Sweeps
    let sweep = null;
    if (current.high > buysideLiquidity && current.close < buysideLiquidity) {
      sweep = { type: 'Buy-Side Swept', level: buysideLiquidity, sentiment: 'BEARISH' };
    } else if (current.low < sellsideLiquidity && current.close > sellsideLiquidity) {
      sweep = { type: 'Sell-Side Swept', level: sellsideLiquidity, sentiment: 'BULLISH' };
    }

    // 4. Market Structure
    let structure = 'Consolidation';
    let structBias = 'NEUTRAL';
    if (current.close > buysideLiquidity) { structure = 'BOS (Bull Break)'; structBias = 'BULLISH'; }
    else if (current.close < sellsideLiquidity) { structure = 'MSS (Bear Shift)'; structBias = 'BEARISH'; }

    // 5. Discount / Premium
    const dealingRange = buysideLiquidity - sellsideLiquidity;
    const eq = buysideLiquidity - (dealingRange / 2);
    const isDiscount = current.close < eq;

    // 6. Execution Bias Logic
    let algoBias = 'WAIT / NEUTRAL';
    let biasColor = 'text-text-secondary';
    
    if (isDiscount && structBias === 'BULLISH') { algoBias = 'STRONG BUY'; biasColor = 'text-positive'; }
    else if (!isDiscount && structBias === 'BEARISH') { algoBias = 'STRONG SELL'; biasColor = 'text-negative'; }
    else if (sweep?.sentiment === 'BULLISH') { algoBias = 'SCALP BUY (Reversal)'; biasColor = 'text-positive'; }
    else if (sweep?.sentiment === 'BEARISH') { algoBias = 'SCALP SELL (Reversal)'; biasColor = 'text-negative'; }
    else if (isDiscount) { algoBias = 'LEANING LONG (Discount)'; biasColor = 'text-positive opacity-80'; }
    else { algoBias = 'LEANING SHORT (Premium)'; biasColor = 'text-negative opacity-80'; }

    return { 
      buysideLiquidity, sellsideLiquidity, 
      fvgs: fvgs.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)).slice(0, 2), 
      sweep, structure, isDiscount, algoBias, biasColor, currentPrice: current.close
    };
  }, [tick]);

  if (!data) return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Intraday Data</div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2 relative">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={10} /> Smart Money Concepts (15m)
        </div>
      </div>

      {/* Main Bias Indicator */}
      <div className="bg-surface-highlight border border-border p-3 rounded-sm flex flex-col items-center justify-center text-center">
        <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Execution Bias</span>
        <span className={`text-xl font-black tracking-tighter ${data.biasColor}`}>{data.algoBias}</span>
      </div>
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        
        {/* Liquidity Targets */}
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowUpRight size={8}/> Buy-Side Liq (BSL)</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{data.buysideLiquidity.toFixed(2)}</span>
            <span className="text-[8px] text-text-tertiary mt-0.5">Target / Resistance</span>
          </div>
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowDownRight size={8}/> Sell-Side Liq (SSL)</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{data.sellsideLiquidity.toFixed(2)}</span>
            <span className="text-[8px] text-text-tertiary mt-0.5">Target / Support</span>
          </div>
        </div>

        {/* Sweeps & Structure */}
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Structure Array</span>
          <span className={`text-[9px] font-mono font-bold ${data.isDiscount ? 'text-positive' : 'text-negative'}`}>
            {data.structure} • {data.isDiscount ? 'DISCOUNT' : 'PREMIUM'}
          </span>
        </div>

        {data.sweep && (
          <div className="bg-warning/10 border border-warning/20 p-2 rounded-sm flex items-center justify-between">
            <span className="text-[9px] text-warning uppercase font-bold flex items-center gap-1"><Zap size={10}/> Sweep Detected</span>
            <span className="text-[9px] font-mono font-bold text-warning">{data.sweep.type}</span>
          </div>
        )}

        {/* Nearest FVGs */}
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col gap-1.5">
          <span className="text-[9px] text-text-tertiary uppercase font-bold flex items-center gap-1">
            <Crosshair size={10} /> Nearest Active FVGs
          </span>
          {data.fvgs.length > 0 ? data.fvgs.map((fvg, i) => (
            <div key={i} className="flex justify-between items-center bg-background border border-border/50 px-2 py-1 rounded-sm">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${fvg.type === 'BISI' ? 'bg-positive' : 'bg-negative'}`} />
                <span className="text-[9px] font-bold text-text-primary">{fvg.type === 'BISI' ? 'BISI (Demand)' : 'SIBI (Supply)'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-text-secondary">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
                <span className="text-[7px] text-text-tertiary uppercase">{Math.abs(fvg.distance).toFixed(1)}% Away</span>
              </div>
            </div>
          )) : (
             <span className="text-[9px] text-text-tertiary font-mono italic">Price is balanced. No immediate gaps.</span>
          )}
        </div>
      </div>
    </div>
  );
}
</power-write>