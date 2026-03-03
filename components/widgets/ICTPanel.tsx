'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Target, ArrowUpRight, ArrowDownRight, Crosshair, Zap, Brain, Loader2 } from 'lucide-react';
import { Tick } from '@/lib/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from '@/lib/tech-math';
import { analyzeICTSetup } from '@/app/actions/analyzeICTSetup';

export function ICTPanel({ tick, timeframeLabel = '15m' }: { tick?: Tick, timeframeLabel?: string }) {
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // 1. Run local deterministic math every tick
  const mathData = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 30) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    
    const { swingHighs, swingLows } = findSwingPoints(history);
    const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
    const unmitigatedLows = swingLows.filter(l => !l.mitigated);

    const buysideLiquidity = unmitigatedHighs.length > 0 ? Math.min(...unmitigatedHighs.map(h => h.price)) : Math.max(...history.slice(-20).map(h=>h.high));
    const sellsideLiquidity = unmitigatedLows.length > 0 ? Math.max(...unmitigatedLows.map(l => l.price)) : Math.min(...history.slice(-20).map(h=>h.low));

    const activeFVGs = findUnmitigatedFVGs(history).map(fvg => ({
      ...fvg,
      distance: ((fvg.type === 'BISI' ? fvg.top - current.close : current.close - fvg.bottom) / current.close) * 100
    }));

    let sweep = null;
    if (current.high > buysideLiquidity && current.close < buysideLiquidity) {
      sweep = { type: 'Buy-Side Swept', level: buysideLiquidity };
    } else if (current.low < sellsideLiquidity && current.close > sellsideLiquidity) {
      sweep = { type: 'Sell-Side Swept', level: sellsideLiquidity };
    }

    let structure = 'Consolidation';
    if (current.close > buysideLiquidity) structure = 'BOS (Bull Break)';
    else if (current.close < sellsideLiquidity) structure = 'MSS (Bear Shift)';

    const dealingRange = Math.max(buysideLiquidity, ...history.slice(-50).map(h=>h.high)) - Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low));
    const eq = Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low)) + (dealingRange / 2);
    const isDiscount = current.close < eq;

    return { 
      buysideLiquidity, sellsideLiquidity, 
      fvgs: activeFVGs.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)).slice(0, 2), 
      sweep, structure, isDiscount, currentPrice: current.close
    };
  }, [tick]);

  // 2. Fetch custom AI Prediction when symbol changes
  useEffect(() => {
    if (!mathData || !tick) return;
    
    const getPrediction = async () => {
      setIsPredicting(true);
      const recentCandles = tick.history!.slice(-10);
      const result = await analyzeICTSetup(tick.symbol, tick.price, recentCandles, mathData);
      setAiPrediction(result);
      setIsPredicting(false);
    };

    getPrediction();
    // Intentionally only relying on symbol change to avoid spamming AI on every price tick
  }, [tick?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tick || !mathData) return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Data</div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={10} /> SMC Arrays ({timeframeLabel})
        </div>
      </div>

      {isPredicting || !aiPrediction ? (
        <div className="bg-surface-highlight border border-border p-4 rounded-sm flex flex-col items-center justify-center text-center gap-2">
          <Loader2 size={16} className="animate-spin text-accent" />
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Generating Custom AI Bias...</span>
        </div>
      ) : (
        <div className="bg-surface-highlight border border-border p-3 rounded-sm flex flex-col gap-2">
          <div className="flex flex-col items-center justify-center text-center pb-2 border-b border-border/50">
            <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><Brain size={10} className="text-accent"/> Custom AI Bias</span>
            <span className={`text-lg font-black tracking-tighter uppercase ${aiPrediction.biasColor}`}>{aiPrediction.algoBias}</span>
          </div>
          <p className="text-[10px] text-text-primary leading-snug">
            {aiPrediction.customAnalysis}
          </p>
        </div>
      )}
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowUpRight size={8}/> Fractal BSL</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{mathData.buysideLiquidity.toFixed(2)}</span>
          </div>
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowDownRight size={8}/> Fractal SSL</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{mathData.sellsideLiquidity.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Structure ({timeframeLabel})</span>
          <span className={`text-[9px] font-mono font-bold ${mathData.isDiscount ? 'text-positive' : 'text-negative'}`}>
            {mathData.structure} • {mathData.isDiscount ? 'DISCOUNT' : 'PREMIUM'}
          </span>
        </div>

        {mathData.sweep && (
          <div className="bg-warning/10 border border-warning/20 p-2 rounded-sm flex items-center justify-between">
            <span className="text-[9px] text-warning uppercase font-bold flex items-center gap-1"><Zap size={10}/> Sweep Detected</span>
            <span className="text-[9px] font-mono font-bold text-warning">{mathData.sweep.type}</span>
          </div>
        )}

        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col gap-1.5">
          <span className="text-[9px] text-text-tertiary uppercase font-bold flex items-center gap-1">
            <Crosshair size={10} /> Nearest Active FVGs
          </span>
          {mathData.fvgs.length > 0 ? mathData.fvgs.map((fvg, i) => (
            <div key={i} className="flex justify-between items-center bg-background border border-border/50 px-2 py-1 rounded-sm">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${fvg.type === 'BISI' ? 'bg-positive' : 'bg-negative'}`} />
                <span className="text-[9px] font-bold text-text-primary">{fvg.type === 'BISI' ? 'Demand' : 'Supply'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-text-secondary">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
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