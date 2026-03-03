'use client';

import React from 'react';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AssetSensitivity {
  symbol: string;
  sensitivity: 'HIGH' | 'MODERATE' | 'LOW';
  expectedMove: string;
  weight: number; // 1-10
}

const SENSITIVITIES: AssetSensitivity[] = [
  { symbol: 'Gold', sensitivity: 'HIGH', expectedMove: '+1.2% on Cool', weight: 9 },
  { symbol: 'ES (S&P 500)', sensitivity: 'HIGH', expectedMove: '-1.5% on Hot', weight: 10 },
  { symbol: 'NQ (Nasdaq)', sensitivity: 'HIGH', expectedMove: '-2.1% on Hot', weight: 10 },
  { symbol: 'DXY (Dollar)', sensitivity: 'HIGH', expectedMove: '+0.8% on Hot', weight: 9 },
  { symbol: '2Y Yields', sensitivity: 'HIGH', expectedMove: '+12bps on Hot', weight: 10 },
  { symbol: 'USD/JPY', sensitivity: 'MODERATE', expectedMove: '+80 pips on Hot', weight: 7 },
  { symbol: 'BTC/USD', sensitivity: 'MODERATE', expectedMove: '-3.5% on Hot', weight: 6 },
  { symbol: 'Crude Oil', sensitivity: 'LOW', expectedMove: '+0.4% on Hot', weight: 3 }
];

export function ImpactHeatmap() {
  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Target size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Asset Sensitivity Heatmap</span>
        </div>
        <span className="text-[8px] text-accent font-mono">SENSITIVITY_RANK_V2.1</span>
      </div>
      
      <div className="space-y-1.5">
        {SENSITIVITIES.map((asset) => (
          <div key={asset.symbol} className="bg-surface-highlight/50 border border-border/50 p-2 flex items-center justify-between group hover:border-accent/30 transition-colors">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-text-primary">{asset.symbol}</span>
              <span className="text-[8px] text-text-tertiary uppercase">{asset.expectedMove}</span>
            </div>
            <div className={`px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase ${
              asset.sensitivity === 'HIGH' ? 'bg-negative/20 text-negative border border-negative/30' :
              asset.sensitivity === 'MODERATE' ? 'bg-warning/20 text-warning border border-warning/30' :
              'bg-positive/20 text-positive border border-positive/30'
            }`}>
              {asset.sensitivity}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto p-2 border-t border-border/50 bg-surface/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-text-secondary uppercase">Aggregate Sensitivity</span>
          <span className="text-[9px] font-mono text-negative">HIGH</span>
        </div>
        <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
          <div className="h-full bg-negative w-[88%]" />
        </div>
      </div>
    </div>
  );
}
