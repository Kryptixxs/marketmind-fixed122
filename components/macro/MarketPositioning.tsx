'use client';

import React from 'react';
import { Activity, BarChart3, Zap, ShieldAlert } from 'lucide-react';

interface PositioningMetricProps {
  label: string;
  value: string;
  subValue?: string;
  status: 'positive' | 'negative' | 'neutral' | 'warning';
}

function PositioningMetric({ label, value, subValue, status }: PositioningMetricProps) {
  const statusColors = {
    positive: 'text-positive',
    negative: 'text-negative',
    neutral: 'text-text-secondary',
    warning: 'text-warning',
  };

  return (
    <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
      <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">{label}</div>
      <div className={`text-xs font-mono font-bold ${statusColors[status]}`}>{value}</div>
      {subValue && <div className="text-[8px] text-text-tertiary font-mono mt-0.5">{subValue}</div>}
    </div>
  );
}

export function MarketPositioning() {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-1 p-2">
        <PositioningMetric 
          label="DXY Positioning" 
          value="Net Long (82nd Pctl)" 
          subValue="Institutional Crowding: HIGH"
          status="warning"
        />
        <PositioningMetric 
          label="Futures (CFTC)" 
          value="ES: +12.4k Contracts" 
          subValue="Asset Manager Bias: BULLISH"
          status="positive"
        />
        <PositioningMetric 
          label="Options Implied" 
          value="Straddle: +/- 1.2%" 
          subValue="IV Rank: 64.2"
          status="neutral"
        />
        <PositioningMetric 
          label="Volatility Regime" 
          value="Mean Reverting" 
          subValue="VIX Term Structure: Contango"
          status="positive"
        />
        <PositioningMetric 
          label="Liquidity Index" 
          value="0.84 (Thinning)" 
          subValue="Bid-Ask Spread: Widening"
          status="negative"
        />
        <PositioningMetric 
          label="Gamma Exposure" 
          value="+$2.4B (Long Gamma)" 
          subValue="Volatility Dampening Active"
          status="positive"
        />
      </div>
      
      <div className="mt-auto p-2 border-t border-border/50 bg-surface/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-text-secondary uppercase">Risk Regime</span>
          <span className="text-[9px] font-mono text-positive">STABLE</span>
        </div>
        <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
          <div className="h-full bg-positive w-[75%]" />
        </div>
      </div>
    </div>
  );
}
