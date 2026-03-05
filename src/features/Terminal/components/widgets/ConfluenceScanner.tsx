'use client';

import React, { useEffect, useState } from 'react';
import { ConfluenceEngine } from '@/features/Terminal/services/confluence/engine';
import { ConfluenceResult } from '@/features/Terminal/services/confluence/types';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

export function ConfluenceScanner({ symbol }: { symbol: string }) {
  const [results, setResults] = useState<ConfluenceResult[]>([]);
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];

  useEffect(() => {
    if (!tick || !tick.history || tick.history.length < 50) return;
    const engine = new ConfluenceEngine({ symbol, interval: '15m', quotes: tick.history });
    setResults(engine.calculateAll().filter(r => r.isActive));
  }, [tick, symbol]);

  const bullish = results.filter(r => r.label.toLowerCase().includes('bullish') || r.label.toLowerCase().includes('support'));
  const bearish = results.filter(r => r.label.toLowerCase().includes('bearish') || r.label.toLowerCase().includes('resistance'));

  return (
    <div className="h-full flex flex-col p-2 gap-4">
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        <div className="space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[9px] font-bold text-positive uppercase mb-2 border-b border-positive/20 pb-1">Bullish Forces</div>
          {bullish.map(r => (
            <div key={r.id} className="flex justify-between items-center text-[10px] py-0.5">
              <span className="text-text-primary">{r.label}</span>
              <span className="text-positive font-mono">{r.score}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[9px] font-bold text-negative uppercase mb-2 border-b border-negative/20 pb-1">Bearish Forces</div>
          {bearish.map(r => (
            <div key={r.id} className="flex justify-between items-center text-[10px] py-0.5">
              <span className="text-text-primary">{r.label}</span>
              <span className="text-negative font-mono">{r.score}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-border pt-2 flex justify-between items-center">
        <span className="text-[9px] font-bold text-text-tertiary uppercase">Net Bias</span>
        <span className={`text-xs font-bold uppercase ${bullish.length >= bearish.length ? 'text-positive' : 'text-negative'}`}>
          {bullish.length >= bearish.length ? 'Bullish' : 'Bearish'} ({Math.abs(bullish.length - bearish.length)})
        </span>
      </div>
    </div>
  );
}