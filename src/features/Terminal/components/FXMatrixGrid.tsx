'use client';

import React, { useState, useEffect } from 'react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

const PAIRS = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'USDMXN', 'USDZAR', 'USDTRY'];

interface MockData {
  spread: string;
  vol: string;
  carry: string;
}

export function FXMatrixGrid({ activeSymbol, onSymbolChange }: { activeSymbol: string, onSymbolChange: (s: string) => void }) {
  const { data } = useMarketData(PAIRS);
  const [mockMetrics, setMockMetrics] = useState<Record<string, MockData>>({});

  // Generate mock metrics only on the client to avoid hydration mismatch
  useEffect(() => {
    const metrics: Record<string, MockData> = {};
    PAIRS.forEach(pair => {
      metrics[pair] = {
        spread: (Math.random() * 0.5 + 0.2).toFixed(1),
        vol: (Math.random() * 2 + 4).toFixed(1),
        carry: (Math.random() * 4 - 2).toFixed(2)
      };
    });
    setMockMetrics(metrics);
  }, []);

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      <div className="fx-grid-header grid grid-cols-7 gap-2">
        <span>Pair</span>
        <span className="text-right">Bid</span>
        <span className="text-right">Ask</span>
        <span className="text-right">Spread</span>
        <span className="text-right">% Chg</span>
        <span className="text-right">1W Vol</span>
        <span className="text-right">Carry</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {PAIRS.map(pair => {
          const tick = data[pair];
          const metrics = mockMetrics[pair] || { spread: '---', vol: '---', carry: '---' };
          
          return (
            <div 
              key={pair}
              onClick={() => onSymbolChange(pair)}
              className={`grid grid-cols-7 gap-2 fx-cell cursor-pointer hover:bg-white/5 transition-colors ${activeSymbol === pair ? 'bg-accent/10 border-l-2 border-l-accent' : ''}`}
            >
              <span className="font-bold">{pair}</span>
              <span className="text-right font-mono">{(tick?.price || 0).toFixed(4)}</span>
              <span className="text-right font-mono">{(tick?.price ? tick.price + 0.0001 : 0).toFixed(4)}</span>
              <span className="text-right font-mono text-text-tertiary">{metrics.spread}</span>
              <span className={`text-right font-mono ${tick?.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                {tick?.changePercent ? `${tick.changePercent >= 0 ? '+' : ''}${tick.changePercent.toFixed(2)}%` : '---'}
              </span>
              <span className="text-right font-mono text-text-tertiary">{metrics.vol}%</span>
              <span className={`text-right font-mono ${parseFloat(metrics.carry) >= 0 ? 'text-positive/60' : 'text-negative/60'}`}>{metrics.carry}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}