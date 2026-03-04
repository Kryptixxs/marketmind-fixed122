'use client';

import React from 'react';
import { Tick } from '@/features/MarketData/services/marketdata/types';
import { Activity, Loader2 } from 'lucide-react';

export function MarketInternals({ tick }: { tick?: Tick }) {
  if (!tick || !tick.history || tick.history.length < 20) {
    return <div className="flex h-full items-center justify-center opacity-50"><Loader2 className="animate-spin text-text-tertiary" size={14} /></div>;
  }

  const quotes = tick.history;
  const closes = quotes.map(q => q.close);
  const volumes = quotes.map(q => q.volume);
  const currentPrice = closes[closes.length - 1];

  // Pure Math Calculations
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVol = volumes[volumes.length - 1];
  
  const rvol = avgVol20 > 0 ? (currentVol / avgVol20) : 0;
  const distFromMean = ((currentPrice - sma20) / sma20) * 100;

  // 14-Day ATR
  let trSum = 0;
  const period = 14;
  for(let i = quotes.length - period; i < quotes.length; i++) {
    const hl = quotes[i].high - quotes[i].low;
    const hc = Math.abs(quotes[i].high - quotes[i-1].close);
    const lc = Math.abs(quotes[i].low - quotes[i-1].close);
    trSum += Math.max(hl, hc, lc);
  }
  const atr14 = trSum / period;
  const atrPercent = (atr14 / currentPrice) * 100;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Pure Market Internals</div>
        <Activity size={10} className="text-text-tertiary" />
      </div>
      
      <div className="grid grid-cols-2 gap-1 flex-1">
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-text-tertiary uppercase font-bold mb-1">14D ATR</span>
          <span className="text-[10px] font-mono font-bold text-text-primary">{atr14.toFixed(2)} <span className="text-[8px] text-text-tertiary">({atrPercent.toFixed(1)}%)</span></span>
        </div>
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Rel Vol (RVOL)</span>
          <span className={`text-[10px] font-mono font-bold ${rvol > 1.5 ? 'text-positive' : rvol < 0.5 ? 'text-negative' : 'text-text-primary'}`}>
            {rvol.toFixed(2)}x
          </span>
        </div>
        <div className="col-span-2 bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[8px] text-text-tertiary uppercase font-bold">Dist from 20-SMA</span>
          <span className={`text-[10px] font-mono font-bold ${distFromMean > 0 ? 'text-positive' : 'text-negative'}`}>
            {distFromMean > 0 ? '+' : ''}{distFromMean.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}