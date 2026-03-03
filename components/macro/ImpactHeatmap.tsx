'use client';

import React, { useEffect, useState } from 'react';
import { Target, Loader2 } from 'lucide-react';
import { analyzeAssetSensitivity } from '@/app/actions/analyzeAssetSensitivity';

interface AssetSensitivity {
  symbol: string;
  sensitivity: 'HIGH' | 'MODERATE' | 'LOW';
  expectedMove: string;
  weight: number;
}

export function ImpactHeatmap() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await analyzeAssetSensitivity();
      if (result) setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Ranking Sensitivity...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Target size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Asset Sensitivity Heatmap</span>
        </div>
        <span className="text-[8px] text-accent font-mono">SENSITIVITY_RANK_V2.1</span>
      </div>
      
      <div className="space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        {data.sensitivities.map((asset: AssetSensitivity) => (
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
          <span className={`text-[9px] font-mono ${data.aggregateSensitivity === 'HIGH' ? 'text-negative' : 'text-positive'}`}>{data.aggregateSensitivity}</span>
        </div>
        <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
          <div className={`h-full ${data.aggregateSensitivity === 'HIGH' ? 'bg-negative' : 'bg-positive'} transition-all duration-1000`} style={{ width: `${data.aggregateScore}%` }} />
        </div>
      </div>
    </div>
  );
}
