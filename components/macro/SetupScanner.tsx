'use client';

import React from 'react';
import { Search, Zap, ShieldAlert, Activity } from 'lucide-react';

interface SetupMetricProps {
  label: string;
  value: string;
  status: 'positive' | 'negative' | 'neutral' | 'warning';
}

function SetupMetric({ label, value, status }: SetupMetricProps) {
  const statusColors = {
    positive: 'text-positive',
    negative: 'text-negative',
    neutral: 'text-text-secondary',
    warning: 'text-warning',
  };

  return (
    <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
      <div className="text-[9px] text-text-tertiary uppercase font-bold">{label}</div>
      <div className={`text-[10px] font-mono font-bold ${statusColors[status]}`}>{value}</div>
    </div>
  );
}

export function SetupScanner() {
  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Search size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Pre-Event Setup Scanner</span>
        </div>
        <span className="text-[8px] text-accent font-mono">SCANNER_V1.0</span>
      </div>
      
      <div className="space-y-1.5">
        <SetupMetric label="Positioning Crowded?" value="YES (Long USD)" status="warning" />
        <SetupMetric label="Volatility Cheap?" value="NO (IV Rank 64)" status="negative" />
        <SetupMetric label="Liquidity Thin?" value="YES (0.84)" status="negative" />
        <SetupMetric label="Gamma Positive?" value="YES (+$2.4B)" status="positive" />
        <SetupMetric label="Skew Extreme?" value="NO (Neutral)" status="neutral" />
        <SetupMetric label="Trend Alignment?" value="YES (Bullish)" status="positive" />
      </div>
      
      <div className="mt-auto p-2 bg-surface-highlight/30 border border-border/50 rounded-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={10} className="text-warning" />
          <span className="text-[8px] text-warning font-bold uppercase">Risk Warning</span>
        </div>
        <p className="text-[9px] text-text-secondary leading-tight italic">
          "Crowded USD positioning suggests a 'Cool' CPI print could trigger a massive short squeeze in EUR/USD."
        </p>
      </div>
    </div>
  );
}
