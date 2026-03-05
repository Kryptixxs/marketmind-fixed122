'use client';

import React, { useMemo } from 'react';
import { Tick } from '@/features/MarketData/services/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from '@/lib/tech-math';

export function ICTPanel({ tick }: { tick?: Tick }) {
  const mathData = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 30) return null;
    const history = tick.history;
    const current = history[history.length - 1];
    const { swingHighs, swingLows } = findSwingPoints(history);
    const fvgs = findUnmitigatedFVGs(history);
    return { swingHighs, swingLows, fvgs, current };
  }, [tick]);

  if (!mathData) return null;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-2 space-y-4">
      <div className="space-y-1">
        <div className="text-[9px] font-bold text-text-tertiary uppercase border-b border-border pb-1 mb-2">Liquidity Zones</div>
        {mathData.swingHighs.filter(h => !h.mitigated).slice(0, 3).map((h, i) => (
          <div key={i} className="flex justify-between text-[10px]">
            <span className="text-negative">Buy-Side Liquidity</span>
            <span className="font-mono">{h.price.toFixed(2)}</span>
          </div>
        ))}
        {mathData.swingLows.filter(l => !l.mitigated).slice(0, 3).map((l, i) => (
          <div key={i} className="flex justify-between text-[10px]">
            <span className="text-positive">Sell-Side Liquidity</span>
            <span className="font-mono">{l.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="text-[9px] font-bold text-text-tertiary uppercase border-b border-border pb-1 mb-2">Fair Value Gaps</div>
        {mathData.fvgs.slice(0, 4).map((f, i) => (
          <div key={i} className="flex justify-between text-[10px]">
            <span className={f.type === 'BISI' ? 'text-positive' : 'text-negative'}>
              {f.type === 'BISI' ? 'Bullish FVG' : 'Bearish FVG'}
            </span>
            <span className="font-mono">{f.bottom.toFixed(2)} - {f.top.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}