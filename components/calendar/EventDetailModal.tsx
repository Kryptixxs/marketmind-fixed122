'use client';

import React, { useMemo } from 'react';
import {
  X, TrendingUp, Globe, Zap, BarChart3, AlertTriangle, Activity, Layers, Target, Info, Search, ShieldAlert
} from 'lucide-react';
import { EconomicEvent } from '@/lib/types';
import { formatTime } from '@/lib/date-utils';
import { getEventIntel, computeSurprise } from '@/lib/event-intelligence';

interface EventDetailModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const intel = useMemo(() => getEventIntel(event), [event]);
  const surprise = useMemo(() => computeSurprise(event), [event]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2">
      <div className="bg-surface border border-border w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-3 py-2 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                {event.title} // {event.country}
              </h2>
              <span className="text-[8px] text-text-tertiary uppercase tracking-widest font-mono">Terminal ID: {event.id} // MACRO_INTEL_V4.0</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
              <span className="text-accent">TIME: {event.time}</span>
              <span className="text-text-tertiary">|</span>
              <span className="text-text-secondary">CURRENCY: {event.currency}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-sm transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* Top Stats Bar */}
          <div className="grid grid-cols-4 gap-0.5 bg-border border border-border">
            {[
              { label: 'Volatility Regime', value: intel.volatility, color: 'text-accent' },
              { label: 'Macro Impact Score', value: `${intel.macroImpact}/10`, color: 'text-text-primary' },
              { label: 'Market Positioning', value: intel.positioning, color: 'text-warning' },
              { label: 'Surprise Threshold', value: `${intel.surpriseThresholdPct}%`, color: 'text-text-secondary' }
            ].map(s => (
              <div key={s.label} className="bg-background p-2 flex flex-col gap-1">
                <span className="text-[8px] text-text-tertiary uppercase font-bold">{s.label}</span>
                <span className={`text-[10px] font-mono font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Narrative Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Info size={12} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Macro Narrative & Context</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed bg-surface-highlight/30 p-3 border-l-2 border-accent">
              {intel.narrative}
            </p>
          </div>

          {/* Main Intelligence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Scenario Tree */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Layers size={12} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Scenario Tree</span>
              </div>
              <div className="space-y-1">
                {intel.scenarios.map(s => (
                  <div key={s.label} className="bg-background border border-border p-2 flex flex-col gap-1 group hover:border-accent/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-text-primary">{s.label}</span>
                      <span className="text-[10px] font-mono text-accent">{s.probability}%</span>
                    </div>
                    <p className="text-[9px] text-text-tertiary leading-tight">{s.reaction}</p>
                    <div className="w-full h-0.5 bg-surface-highlight mt-1">
                      <div className={`h-full ${s.bias === 'BULLISH' ? 'bg-positive/40' : s.bias === 'BEARISH' ? 'bg-negative/40' : 'bg-warning/40'}`} style={{ width: `${s.probability}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Heatmap */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Target size={12} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Asset Sensitivity</span>
              </div>
              <div className="space-y-1">
                {intel.sensitivities.map(asset => (
                  <div key={asset.symbol} className="bg-background border border-border p-2 flex items-center justify-between">
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
            </div>

            {/* Setup Scanner */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Search size={12} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Pre-Event Setup</span>
              </div>
              <div className="space-y-1.5">
                <div className="bg-background border border-border p-2 flex items-center justify-between">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Crowdedness</span>
                  <span className="text-[10px] font-mono font-bold text-warning">HIGH</span>
                </div>
                <div className="bg-background border border-border p-2 flex items-center justify-between">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Volatility</span>
                  <span className="text-[10px] font-mono font-bold text-negative">EXPENSIVE</span>
                </div>
                <div className="bg-background border border-border p-2 flex items-center justify-between">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Liquidity</span>
                  <span className="text-[10px] font-mono font-bold text-negative">THIN</span>
                </div>
                <div className="bg-background border border-border p-2 flex items-center justify-between">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Gamma</span>
                  <span className="text-[10px] font-mono font-bold text-positive">POSITIVE</span>
                </div>
                <div className="mt-2 p-2 bg-surface-highlight/30 border border-border/50 rounded-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert size={10} className="text-warning" />
                    <span className="text-[8px] text-warning font-bold uppercase">Risk Map</span>
                  </div>
                  <p className="text-[9px] text-text-secondary leading-tight italic">
                    "Positioning suggests asymmetric risk to the downside if data prints 'In-Line' or 'Cool'."
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Live Reaction Engine (If data printed) */}
          {surprise.classification !== 'N/A' && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2 text-text-tertiary">
                <Activity size={12} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Live Reaction Engine</span>
              </div>
              <div className="bg-accent/5 border border-accent/20 p-3 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-accent uppercase">Surprise Magnitude: {surprise.surprisePct?.toFixed(2)}%</span>
                  <span className="text-[9px] text-text-secondary">Classification: <span className="text-text-primary font-bold">{surprise.classification}</span></span>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-mono font-bold text-text-primary uppercase">REACTION: {surprise.classification === 'HOT' ? 'HAWKISH' : surprise.classification === 'COOL' ? 'DOVISH' : 'NEUTRAL'}</div>
                  <div className="text-[8px] text-text-tertiary uppercase">Historical Analog: 88th Percentile</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-surface-highlight flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity">
              Set Alert
            </button>
            <button className="px-3 py-1.5 bg-surface border border-border text-text-secondary text-[10px] font-bold uppercase rounded-sm hover:text-text-primary transition-colors">
              Historical Data
            </button>
            <button className="px-3 py-1.5 bg-surface border border-border text-text-secondary text-[10px] font-bold uppercase rounded-sm hover:text-text-primary transition-colors">
              Trade Implications
            </button>
          </div>
          <span className="text-[9px] font-mono text-text-tertiary">VANTAGE TERMINAL // SECURE_FEED_ACTIVE // {new Date().toISOString()}</span>
        </div>
      </div>
    </div>
  );
}