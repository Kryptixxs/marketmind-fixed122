'use client';

import React from 'react';
import { Layers, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Scenario {
  label: string;
  probability: number;
  reaction: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

const SCENARIOS: Scenario[] = [
  { label: 'Hot (>Forecast)', probability: 35, reaction: 'Bonds ↓, DXY ↑, Nasdaq ↓', bias: 'BEARISH' },
  { label: 'In-Line', probability: 40, reaction: 'Chop, Range-bound', bias: 'NEUTRAL' },
  { label: 'Cool (<Forecast)', probability: 25, reaction: 'Bonds ↑, DXY ↓, Risk-on', bias: 'BULLISH' }
];

export function ScenarioTree() {
  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Layers size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Scenario Tree (CPI)</span>
        </div>
        <span className="text-[8px] text-accent font-mono">AI_MODEL_V4.2</span>
      </div>
      
      <div className="space-y-1.5">
        {SCENARIOS.map((s) => (
          <div key={s.label} className="bg-surface-highlight/50 border border-border/50 p-2 flex flex-col gap-1 group hover:border-accent/30 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {s.bias === 'BULLISH' ? <TrendingUp size={10} className="text-positive" /> : 
                 s.bias === 'BEARISH' ? <TrendingDown size={10} className="text-negative" /> : 
                 <Minus size={10} className="text-warning" />}
                <span className="text-[10px] font-bold text-text-primary">{s.label}</span>
              </div>
              <span className="text-[10px] font-mono text-accent">{s.probability}%</span>
            </div>
            <p className="text-[9px] text-text-secondary leading-tight">{s.reaction}</p>
            <div className="w-full h-0.5 bg-surface-highlight mt-1">
              <div className={`h-full ${s.bias === 'BULLISH' ? 'bg-positive/40' : s.bias === 'BEARISH' ? 'bg-negative/40' : 'bg-warning/40'}`} style={{ width: `${s.probability}%` }} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto p-2 bg-accent/5 border border-accent/10 rounded-sm">
        <div className="text-[8px] text-accent font-bold uppercase mb-1">Trade Implication</div>
        <p className="text-[9px] text-text-secondary leading-tight italic">
          "Position for 'In-Line' but hedge with OTM Puts on NQ if 'Hot' scenario triggers."
        </p>
      </div>
    </div>
  );
}
