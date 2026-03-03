'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Target, ArrowUpRight, ArrowDownRight, Crosshair, Zap, Newspaper } from 'lucide-react';
import { Tick } from '@/lib/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from '@/lib/tech-math';
import { fetchNews } from '@/app/actions/fetchNews';

export function ICTPanel({ tick, timeframeLabel = '15m' }: { tick?: Tick, timeframeLabel?: string }) {
  const [newsSentiment, setNewsSentiment] = useState(0); // -100 to 100

  // Fetch news sentiment asynchronously to influence the technical setup
  useEffect(() => {
    if (!tick) return;
    const loadNews = async () => {
      const symName = tick.symbol.split('=')[0].split('-')[0];
      const news = await fetchNews('General');
      // Simple local sentiment scoring based on recent headlines containing the symbol
      let score = 0;
      let count = 0;
      news.forEach(n => {
        const text = n.title.toLowerCase();
        if (text.includes(symName.toLowerCase())) {
          count++;
          if (text.match(/soar|jump|buy|bull|beat|growth|high|up/)) score += 30;
          if (text.match(/plunge|drop|sell|bear|miss|shrink|low|down|risk/)) score -= 30;
        }
      });
      setNewsSentiment(count > 0 ? Math.max(-100, Math.min(100, score / count)) : 0);
    };
    loadNews();
  }, [tick?.symbol]);

  const data = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 30) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    
    // 1. Strict Fractal Swing Points (True Liquidity)
    const { swingHighs, swingLows } = findSwingPoints(history);
    const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
    const unmitigatedLows = swingLows.filter(l => !l.mitigated);

    const buysideLiquidity = unmitigatedHighs.length > 0 ? Math.min(...unmitigatedHighs.map(h => h.price)) : Math.max(...history.slice(-20).map(h=>h.high));
    const sellsideLiquidity = unmitigatedLows.length > 0 ? Math.max(...unmitigatedLows.map(l => l.price)) : Math.min(...history.slice(-20).map(h=>h.low));

    // 2. Strict Unmitigated FVGs
    const activeFVGs = findUnmitigatedFVGs(history).map(fvg => ({
      ...fvg,
      distance: ((fvg.type === 'BISI' ? fvg.top - current.close : current.close - fvg.bottom) / current.close) * 100
    }));

    // 3. True Liquidity Sweeps
    let sweep = null;
    if (current.high > buysideLiquidity && current.close < buysideLiquidity) {
      sweep = { type: 'Buy-Side Swept (Turtle Soup)', level: buysideLiquidity, sentiment: 'BEARISH' };
    } else if (current.low < sellsideLiquidity && current.close > sellsideLiquidity) {
      sweep = { type: 'Sell-Side Swept (Turtle Soup)', level: sellsideLiquidity, sentiment: 'BULLISH' };
    }

    // 4. Market Structure
    let structure = 'Consolidation';
    let structBias = 'NEUTRAL';
    if (current.close > buysideLiquidity) { structure = 'BOS (Bull Break)'; structBias = 'BULLISH'; }
    else if (current.close < sellsideLiquidity) { structure = 'MSS (Bear Shift)'; structBias = 'BEARISH'; }

    // 5. Discount / Premium
    const dealingRange = Math.max(buysideLiquidity, ...history.slice(-50).map(h=>h.high)) - Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low));
    const eq = Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low)) + (dealingRange / 2);
    const isDiscount = current.close < eq;

    // 6. Execution Bias Logic (Combining strict math + News Sentiment)
    let algoBias = 'WAIT / NEUTRAL';
    let biasColor = 'text-text-secondary';
    
    const combinedBullish = (isDiscount ? 1 : 0) + (structBias === 'BULLISH' ? 2 : 0) + (sweep?.sentiment === 'BULLISH' ? 2 : 0) + (newsSentiment > 20 ? 1 : 0);
    const combinedBearish = (!isDiscount ? 1 : 0) + (structBias === 'BEARISH' ? 2 : 0) + (sweep?.sentiment === 'BEARISH' ? 2 : 0) + (newsSentiment < -20 ? 1 : 0);

    if (combinedBullish >= 4) { algoBias = 'HIGH CONVICTION LONG'; biasColor = 'text-positive'; }
    else if (combinedBearish >= 4) { algoBias = 'HIGH CONVICTION SHORT'; biasColor = 'text-negative'; }
    else if (sweep?.sentiment === 'BULLISH') { algoBias = 'SCALP LONG (Reversal)'; biasColor = 'text-positive'; }
    else if (sweep?.sentiment === 'BEARISH') { algoBias = 'SCALP SHORT (Reversal)'; biasColor = 'text-negative'; }
    else if (combinedBullish > combinedBearish) { algoBias = 'LEANING LONG (Discount)'; biasColor = 'text-positive opacity-80'; }
    else if (combinedBearish > combinedBullish) { algoBias = 'LEANING SHORT (Premium)'; biasColor = 'text-negative opacity-80'; }

    return { 
      buysideLiquidity, sellsideLiquidity, 
      fvgs: activeFVGs.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)).slice(0, 2), 
      sweep, structure, isDiscount, algoBias, biasColor, currentPrice: current.close
    };
  }, [tick, newsSentiment]);

  if (!data) return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Data</div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={10} /> SMC Arrays ({timeframeLabel})
        </div>
        {newsSentiment !== 0 && (
          <div className={`text-[8px] font-bold uppercase flex items-center gap-1 ${newsSentiment > 0 ? 'text-positive' : 'text-negative'}`}>
            <Newspaper size={10} /> News Bias
          </div>
        )}
      </div>

      <div className="bg-surface-highlight border border-border p-3 rounded-sm flex flex-col items-center justify-center text-center">
        <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Execution Bias</span>
        <span className={`text-xl font-black tracking-tighter ${data.biasColor}`}>{data.algoBias}</span>
      </div>
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowUpRight size={8}/> Fractal BSL</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{data.buysideLiquidity.toFixed(2)}</span>
            <span className="text-[8px] text-text-tertiary mt-0.5">Unmitigated Target</span>
          </div>
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowDownRight size={8}/> Fractal SSL</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{data.sellsideLiquidity.toFixed(2)}</span>
            <span className="text-[8px] text-text-tertiary mt-0.5">Unmitigated Target</span>
          </div>
        </div>

        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Structure ({timeframeLabel})</span>
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