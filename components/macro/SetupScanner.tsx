'use client';

import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, Loader2 } from 'lucide-react';
import { analyzeTechnicalSetup } from '@/app/actions/analyzeTechnicalSetup';

interface TechnicalData {
  bias: string;
  structure: string;
  liquiditySweeps: string[];
  fvgs: string[];
  levels: { support: number[]; resistance: number[] };
  setup: string;
  confidence: number;
}

export function SetupScanner({ activeSymbol }: { activeSymbol: string }) {
  const [data, setData] = useState<TechnicalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await analyzeTechnicalSetup(activeSymbol);
      if (result) setData(result);
      setLoading(false);
    }
    load();
  }, [activeSymbol]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Scanning Setup...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Search size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Technical Setup Scanner</span>
        </div>
        <span className="text-[8px] text-accent font-mono">ICT_SMC_V1.0</span>
      </div>
      
      <div className="space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
          <div className="text-[9px] text-text-tertiary uppercase font-bold">Structure</div>
          <div className="text-[10px] font-mono font-bold text-text-primary">{data.structure}</div>
        </div>
        
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
          <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Liquidity Sweeps</div>
          <div className="flex flex-wrap gap-1">
            {data.liquiditySweeps.length > 0 ? data.liquiditySweeps.map((s, i) => (
              <span key={i} className="text-[8px] bg-accent/10 text-accent px-1 py-0.5 rounded-sm border border-accent/20">{s}</span>
            )) : <span className="text-[8px] text-text-tertiary italic">None detected</span>}
          </div>
        </div>

        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
          <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Fair Value Gaps</div>
          <div className="flex flex-wrap gap-1">
            {data.fvgs.length > 0 ? data.fvgs.map((f, i) => (
              <span key={i} className="text-[8px] bg-warning/10 text-warning px-1 py-0.5 rounded-sm border border-warning/20">{f}</span>
            )) : <span className="text-[8px] text-text-tertiary italic">None detected</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
            <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Support</div>
            <div className="text-[10px] font-mono text-positive">{data.levels.support.join(', ')}</div>
          </div>
          <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
            <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Resistance</div>
            <div className="text-[10px] font-mono text-negative">{data.levels.resistance.join(', ')}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-2 bg-surface-highlight/30 border border-border/50 rounded-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={10} className="text-warning" />
          <span className="text-[8px] text-warning font-bold uppercase">Trade Setup ({data.confidence}%)</span>
        </div>
        <p className="text-[9px] text-text-secondary leading-tight italic">
          "{data.setup}"
        </p>
      </div>
    </div>
  );
}
