'use client';

import React from 'react';
import { Brain, Activity, Zap, ShieldAlert } from 'lucide-react';

interface NarrativeMetricProps {
  label: string;
  value: string;
  status: 'positive' | 'negative' | 'neutral' | 'warning';
}

function NarrativeMetric({ label, value, status }: NarrativeMetricProps) {
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

export function NarrativeTracker() {
  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Brain size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Macro Narrative Tracker</span>
        </div>
        <span className="text-[8px] text-accent font-mono">AI_NARRATIVE_V3.1</span>
      </div>
      
      <div className="space-y-1.5">
        <NarrativeMetric label="AI Narrative Detection" value="Disinflationary" status="positive" />
        <NarrativeMetric label="Central Bank Stance" value="Hawkish Pause" status="warning" />
        <NarrativeMetric label="Regime Detection" status="neutral" value="Tightening" />
        <NarrativeMetric label="Market Bias" value="Risk-On" status="positive" />
        <NarrativeMetric label="Sentiment Score" value="68/100" status="positive" />
        <NarrativeMetric label="Trend Strength" value="MODERATE" status="neutral" />
      </div>
      
      <div className="mt-auto p-2 bg-accent/5 border border-accent/10 rounded-sm">
        <div className="text-[8px] text-accent font-bold uppercase mb-1">AI Insight</div>
        <p className="text-[9px] text-text-secondary leading-tight italic">
          "The 'Disinflationary' narrative is gaining traction, but the 'Hawkish Pause' from the Fed remains a headwind for equities."
        </p>
      </div>
    </div>
  );
}
