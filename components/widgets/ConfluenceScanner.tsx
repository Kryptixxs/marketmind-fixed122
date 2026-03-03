'use client';

import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { ConfluenceEngine } from '@/lib/confluence/engine';
import { ConfluenceResult } from '@/lib/confluence/types';
import { useMarketData } from '@/lib/marketdata/useMarketData';

export function ConfluenceScanner({ symbol }: { symbol: string }) {
  const [active, setActive] = useState<ConfluenceResult[]>([]);
  
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];

  useEffect(() => {
    if (!tick || !tick.history || tick.history.length < 50) return;

    const engine = new ConfluenceEngine({
      symbol,
      interval: '1D',
      quotes: tick.history
    });
    
    // Calculate ALL 160+ confluences and filter only the mathematically TRUE ones
    // ZERO limits. ZERO slicing. Show the raw truth.
    const results = engine.calculateAll()
      .filter(r => r.isActive)
      .sort((a, b) => b.score - a.score);

    setActive(results);
  }, [tick]);

  const loading = !tick || !tick.history || tick.history.length < 50;

  if (loading) return <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2"><Loader2 size={14} className="animate-spin text-accent" /><span className="text-[10px] font-bold tracking-widest uppercase">Computing Math...</span></div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 mb-1">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Live Algorithmic Confluences</div>
        <span className="text-[9px] text-accent font-mono font-bold">{active.length} DETECTED</span>
      </div>
      
      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
        {active.map(res => (
          <div key={res.id} className="bg-accent/5 border border-accent/20 p-1.5 rounded-sm flex flex-col group cursor-help transition-colors hover:bg-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={10} className="text-positive" />
                <span className="text-[9px] font-bold text-text-primary uppercase">{res.label}</span>
              </div>
              <span className="text-[8px] font-mono text-accent">{res.score}%</span>
            </div>
            <span className="text-[8px] text-text-tertiary mt-1 pl-4 leading-tight">
              {res.description}
            </span>
          </div>
        ))}
        {active.length === 0 && (
          <div className="h-full flex items-center justify-center text-[9px] text-text-tertiary italic">
            No active setups detected.
          </div>
        )}
      </div>
    </div>
  );
}