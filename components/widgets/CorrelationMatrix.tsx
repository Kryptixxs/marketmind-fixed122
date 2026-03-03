'use client';

import React from 'react';
import { calculateCorrelation } from '@/lib/math-utils';
import { Tick } from '@/lib/marketdata/types';

export function CorrelationMatrix({ 
  activeTick, 
  marketData 
}: { 
  activeTick: Tick, 
  marketData: Record<string, Tick> 
}) {
  const drivers = [
    { sym: 'DX-Y.NYB', label: 'US Dollar' },
    { sym: '^VIX', label: 'Volatility' },
    { sym: '^TNX', label: '10Y Yield' },
    { sym: 'GC=F', label: 'Gold' }
  ];

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">30D Pearson Correlation</div>
      <div className="flex-1 space-y-1">
        {drivers.map(driver => {
          const driverTick = marketData[driver.sym];
          if (!driverTick || !activeTick.history || !driverTick.history) return null;

          const correlation = calculateCorrelation(activeTick.history, driverTick.history);
          const isPositive = correlation > 0;
          const strength = Math.abs(correlation);

          return (
            <div key={driver.sym} className="bg-surface-highlight/30 border border-border/50 p-1.5 rounded-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-primary">{driver.label}</span>
                <span className="text-[7px] text-text-tertiary font-mono">{driver.sym}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-1 bg-background rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full absolute transition-all duration-1000 ${isPositive ? 'bg-positive right-1/2' : 'bg-negative left-1/2'}`}
                    style={{ width: `${strength * 50}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono font-bold w-10 text-right ${correlation > 0.5 ? 'text-positive' : correlation < -0.5 ? 'text-negative' : 'text-text-secondary'}`}>
                  {correlation.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}