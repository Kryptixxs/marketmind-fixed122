'use client';

import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { ConfluenceEngine } from '@/lib/confluence/engine';
import { ConfluenceResult } from '@/lib/confluence/types';
import { useMarketData } from '@/lib/marketdata/useMarketData';

export function ConfluenceScanner({ symbol, timeframeLabel = '15m' }: { symbol: string, timeframeLabel?: string }) {
  const [bullish, setBullish] = useState<ConfluenceResult[]>([]);
  const [bearish, setBearish] = useState<ConfluenceResult[]>([]);
  
  // Note: the hook at the app/page level handles interval, we just consume the data
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];

  useEffect(() => {
    if (!tick || !tick.history || tick.history.length < 50) return;

    const engine = new ConfluenceEngine({
      symbol,
      interval: timeframeLabel, // Inform engine of interval
      quotes: tick.history
    });
    
    const allActive = engine.calculateAll().filter(r => r.isActive);
    
    const bulls: ConfluenceResult[] = [];
    const bears: ConfluenceResult[] = [];

    // Categorize active confluences based on label/description keywords
    allActive.forEach(res => {
      const str = (res.label + ' ' + res.description).toLowerCase();
      if (str.match(/bearish|resistance|supply|overbought|death cross|distribution|short|high|top|down|reject|sell|below|target/)) {
        bears.push(res);
      } else if (str.match(/bullish|support|demand|oversold|golden cross|accumulation|long|low|bottom|up|buy|above|expansion/)) {
        bulls.push(res);
      } else {
        bulls.push(res); 
      }
    });

    setBullish(bulls.sort((a, b) => b.score - a.score));
    setBearish(bears.sort((a, b) => b.score - a.score));
  }, [tick, timeframeLabel]);

  const loading = !tick || !tick.history || tick.history.length < 50;

  if (loading) return <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2"><Loader2 size={14} className="animate-spin text-accent" /><span className="text-[10px] font-bold tracking-widest uppercase">Computing Confluences...</span></div>;

  const totalScore = bullish.length + bearish.length;
  const bullPct = totalScore > 0 ? (bullish.length / totalScore) * 100 : 50;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">{timeframeLabel} Confluence Matrix</div>
        <span className="text-[9px] text-text-secondary font-mono font-bold">
          <span className="text-positive">{bullish.length}</span> vs <span className="text-negative">{bearish.length}</span>
        </span>
      </div>

      <div className="w-full h-1.5 bg-surface-highlight rounded-full overflow-hidden flex mb-2 shrink-0">
        <div className="h-full bg-positive transition-all duration-500" style={{ width: `${bullPct}%` }} />
        <div className="h-full bg-negative transition-all duration-500" style={{ width: `${100 - bullPct}%` }} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        {/* BULLISH COLUMN */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 gap-1">
          <div className="sticky top-0 bg-background/90 backdrop-blur pb-1 text-[8px] font-bold text-positive uppercase flex items-center gap-1">
            <TrendingUp size={10} /> Bullish Forces
          </div>
          {bullish.map(res => (
            <div key={res.id} className="bg-positive/5 border border-positive/20 p-1.5 rounded-sm flex flex-col group">
              <span className="text-[8px] font-bold text-text-primary leading-tight">{res.label}</span>
              <span className="text-[7px] text-text-tertiary mt-0.5 line-clamp-2">{res.description}</span>
            </div>
          ))}
          {bullish.length === 0 && <span className="text-[8px] text-text-tertiary italic">No bullish factors.</span>}
        </div>

        {/* BEARISH COLUMN */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 gap-1">
          <div className="sticky top-0 bg-background/90 backdrop-blur pb-1 text-[8px] font-bold text-negative uppercase flex items-center gap-1">
            <TrendingDown size={10} /> Bearish Forces
          </div>
          {bearish.map(res => (
            <div key={res.id} className="bg-negative/5 border border-negative/20 p-1.5 rounded-sm flex flex-col group">
              <span className="text-[8px] font-bold text-text-primary leading-tight">{res.label}</span>
              <span className="text-[7px] text-text-tertiary mt-0.5 line-clamp-2">{res.description}</span>
            </div>
          ))}
          {bearish.length === 0 && <span className="text-[8px] text-text-tertiary italic">No bearish factors.</span>}
        </div>
      </div>
    </div>
  );
}