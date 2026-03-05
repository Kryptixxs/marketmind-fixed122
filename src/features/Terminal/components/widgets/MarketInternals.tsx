'use client';

import React from 'react';
import { Tick } from '@/features/MarketData/services/marketdata/types';
import { Activity, Loader2, Zap, TrendingUp, TrendingDown } from 'lucide-react';

export function MarketInternals({ tick }: { tick?: Tick }) {
  if (!tick || !tick.history || tick.history.length < 20) {
    return (
      <div className="flex h-full items-center justify-center opacity-50">
        <Loader2 className="animate-spin text-text-tertiary" size={14} />
      </div>
    );
  }

  const quotes = tick.history;
  const closes = quotes.map(q => q.close);
  const volumes = quotes.map(q => q.volume);
  const currentPrice = closes[closes.length - 1];

  // RVOL (Relative Volume)
  const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVol = volumes[volumes.length - 1];
  const rvol = avgVol20 > 0 ? (currentVol / avgVol20) : 0;

  // SMA 20 Distance
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const distFromMean = ((currentPrice - sma20) / sma20) * 100;

  // ATR (Average True Range) - Simplified
  let trSum = 0;
  for (let i = quotes.length - 14; i < quotes.length; i++) {
    const q = quotes[i];
    const prev = quotes[i-1];
    if (!prev) continue;
    trSum += Math.max(q.high - q.low, Math.abs(q.high - prev.close), Math.abs(q.low - prev.close));
  }
  const atr = trSum / 14;

  // RSI (Relative Strength Index) - Simplified
  let gains = 0, losses = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    if (diff >= 0) gains += diff;
    else losses -= Math.abs(diff);
  }
  const rs = gains / (losses || 1);
  const rsi = 100 - (100 / (1 + rs));

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Market Internals</div>
        <Activity size={10} className="text-text-tertiary" />
      </div>
      
      <div className="grid grid-cols-2 gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Rel Vol (RVOL)</span>
          <span className={`text-[10px] font-mono font-bold ${rvol > 1.5 ? 'text-positive' : rvol < 0.5 ? 'text-negative' : 'text-text-primary'}`}>
            {rvol.toFixed(2)}x
          </span>
        </div>
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Dist 20-SMA</span>
          <span className={`text-[10px] font-mono font-bold ${distFromMean > 0 ? 'text-positive' : 'text-negative'}`}>
            {distFromMean > 0 ? '+' : ''}{distFromMean.toFixed(2)}%
          </span>
        </div>
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-text-tertiary uppercase font-bold mb-1">RSI (14)</span>
          <span className={`text-[10px] font-mono font-bold ${rsi > 70 ? 'text-negative' : rsi < 30 ? 'text-positive' : 'text-text-primary'}`}>
            {rsi.toFixed(1)}
          </span>
        </div>
        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-text-tertiary uppercase font-bold mb-1">ATR (14)</span>
          <span className="text-[10px] font-mono font-bold text-text-primary">
            {atr.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="mt-auto pt-1 border-t border-border/50 flex justify-between items-center">
        <span className="text-[8px] font-bold text-text-tertiary uppercase">Volatility</span>
        <span className={`text-[8px] font-bold uppercase ${atr > (currentPrice * 0.01) ? 'text-negative' : 'text-positive'}`}>
          {atr > (currentPrice * 0.01) ? 'Elevated' : 'Stable'}
        </span>
      </div>
    </div>
  );
}