'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
const analyzeMarketPositioning = async (...args: any[]) => { return { currentRegime: "Neutral", retailLongRatio: 50, institutionalBias: "Neutral", shortSqueezeRisk: 0 }; };

interface MarketPositioningProps {
  symbol: string;
}

export function MarketPositioning({ symbol }: MarketPositioningProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await analyzeMarketPositioning(symbol);
      if (result) setData(result);
      setLoading(false);
    }
    load();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Calculating Positioning...</span>
      </div>
    );
  }

  if (!data) return <div className="p-4 text-[10px] text-text-tertiary italic">Data unavailable for {symbol}</div>;

  const statusColors: Record<string, string> = {
    positive: 'text-positive',
    negative: 'text-negative',
    neutral: 'text-text-secondary',
    warning: 'text-warning',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-1 p-2">
        {[
          { label: 'DXY Impact', value: data.dxyPositioning, status: data.metrics.dxy },
          { label: 'Estimated Pos', value: data.futuresPositioning, status: data.metrics.futures },
          { label: 'Options Bias', value: data.optionsImplied, status: data.metrics.options },
          { label: 'Vol Regime', value: data.volatilityRegime, status: data.metrics.volatility },
          { label: 'Liquidity', value: data.liquidityIndex.toFixed(0), status: data.metrics.liquidity },
          { label: 'Gamma Exp', value: data.gammaExposure, status: data.metrics.gamma },
        ].map(m => (
          <div key={m.label} className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">{m.label}</div>
            <div className={`text-[10px] font-mono font-bold ${statusColors[m.status] || 'text-text-primary'}`}>{m.value}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto p-2 border-t border-border/50 bg-surface/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-text-secondary uppercase">Risk Regime</span>
          <span className={`text-[9px] font-mono ${data.riskRegime === 'STABLE' ? 'text-positive' : 'text-negative'}`}>{data.riskRegime}</span>
        </div>
        <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
          <div className={`h-full ${data.riskRegime === 'STABLE' ? 'bg-positive' : 'bg-negative'} transition-all duration-1000`} style={{ width: `${data.riskRegime === 'STABLE' ? 75 : 30}%` }} />
        </div>
      </div>
    </div>
  );
}