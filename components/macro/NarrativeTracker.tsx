'use client';

import React, { useEffect, useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { analyzeMacroRegime } from '@/app/actions/analyzeMacroRegime';

interface NarrativeData {
  narrative: string;
  stance: string;
  regime: string;
  bias: string;
  score: number;
  insight: string;
}

export function NarrativeTracker({ activeSymbol, price }: { activeSymbol: string, price: number }) {
  const [data, setData] = useState<NarrativeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await analyzeMacroRegime(activeSymbol, price);
      if (result) setData(result);
      setLoading(false);
    }
    load();
  }, [activeSymbol]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Analyzing Narrative...</span>
      </div>
    );
  }

  if (!data) return null;

  const getStatus = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('bullish') || v.includes('risk-on') || v.includes('disinflationary') || v.includes('easing')) return 'text-positive';
    if (v.includes('bearish') || v.includes('risk-off') || v.includes('tightening') || v.includes('hawkish')) return 'text-negative';
    return 'text-warning';
  };

  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Brain size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Macro Narrative Tracker</span>
        </div>
        <span className="text-[8px] text-accent font-mono">LIVE_AI_V4.0</span>
      </div>
      
      <div className="space-y-1.5">
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
          <div className="text-[9px] text-text-tertiary uppercase font-bold">AI Narrative</div>
          <div className={`text-[10px] font-mono font-bold ${getStatus(data.narrative)}`}>{data.narrative}</div>
        </div>
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
          <div className="text-[9px] text-text-tertiary uppercase font-bold">CB Stance</div>
          <div className={`text-[10px] font-mono font-bold ${getStatus(data.stance)}`}>{data.stance}</div>
        </div>
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
          <div className="text-[9px] text-text-tertiary uppercase font-bold">Regime</div>
          <div className={`text-[10px] font-mono font-bold ${getStatus(data.regime)}`}>{data.regime}</div>
        </div>
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
          <div className="text-[9px] text-text-tertiary uppercase font-bold">Market Bias</div>
          <div className={`text-[10px] font-mono font-bold ${getStatus(data.bias)}`}>{data.bias}</div>
        </div>
        <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm flex items-center justify-between">
          <div className="text-[9px] text-text-tertiary uppercase font-bold">Sentiment Score</div>
          <div className="text-[10px] font-mono font-bold text-accent">{data.score}/100</div>
        </div>
      </div>
      
      <div className="mt-auto p-2 bg-accent/5 border border-accent/10 rounded-sm">
        <div className="text-[8px] text-accent font-bold uppercase mb-1">AI Insight</div>
        <p className="text-[9px] text-text-secondary leading-tight italic">
          "{data.insight}"
        </p>
      </div>
    </div>
  );
}