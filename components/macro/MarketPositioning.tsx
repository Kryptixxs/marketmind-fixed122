'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { analyzeMarketPositioning } from '@/app/actions/analyzeMarketPositioning';

interface PositioningMetricProps {
  label: string;
  value: string;
  status: string;
}

function PositioningMetric({ label, value, status }: PositioningMetricProps) {
  const statusColors: Record<string, string> = {
    positive: 'text-positive',
    negative: 'text-negative',
    neutral: 'text-text-secondary',
    warning: 'text-warning',
  };

  return (
    <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
      <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">{label}</div>
      <div className={`text-xs font-mono font-bold ${statusColors[status] || 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

export function MarketPositioning() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await analyzeMarketPositioning();
      if (result) setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Calculating Positioning...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-1 p-2">
        <PositioningMetric 
          label="DXY Positioning" 
          value={data.dxyPositioning} 
          status={data.metrics.dxy}
        />
        <PositioningMetric 
          label="Futures (CFTC)" 
          value={data.futuresPositioning} 
          status={data.metrics.futures}
        />
        <PositioningMetric 
          label="Options Implied" 
          value={data.optionsImplied} 
          status={data.metrics.options}
        />
        <PositioningMetric 
          label="Volatility Regime" 
          value={data.volatilityRegime} 
          status={data.metrics.volatility}
        />
        <PositioningMetric 
          label="Liquidity Index" 
          value={data.liquidityIndex.toFixed(2)} 
          status={data.metrics.liquidity}
        />
        <PositioningMetric 
          label="Gamma Exposure" 
          value={data.gammaExposure} 
          status={data.metrics.gamma}
        />
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