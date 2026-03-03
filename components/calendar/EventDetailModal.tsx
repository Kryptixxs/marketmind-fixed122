'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, TrendingUp, Globe, Zap, BarChart3, AlertTriangle, Activity, 
  Loader2, RefreshCcw, CheckCircle2, Target, ShieldAlert
} from 'lucide-react';
import { EconomicEvent, EventAIIntelligence } from '@/lib/types';
import { formatTime } from '@/lib/date-utils';
import { formatPercent, formatInt, formatMaybeNumber } from '@/lib/format';
import { analyzeEvent } from '@/app/actions/analyzeEvent';

interface EventDetailModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [intel, setIntel] = useState<EventAIIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeEvent(event);
      setIntel(data);
    } catch (err) {
      setError("Failed to synthesize event intelligence. The AI service may be temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    fetchIntel();
  }, [fetchIntel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center px-4 py-3 border-b border-border bg-surface-highlight">
          <div className="flex flex-col min-w-0 flex-1 mr-4">
            <h2 className="text-lg font-bold text-text-primary leading-tight flex items-center gap-3">
              <span className="truncate">{event.title}</span>
              <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                event.impact === 'High' ? 'bg-negative/20 text-negative' : 
                event.impact === 'Medium' ? 'bg-warning/20 text-warning' : 'bg-positive/20 text-positive'
              }`}>
                {event.impact} Impact
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-tertiary uppercase tracking-widest">
                {event.country} • {event.currency} • {event.date} @ {formatTime(event.time)}
              </span>
              {intel?.stale && (
                <span className="text-[9px] text-warning font-bold uppercase animate-pulse">[Stale Data]</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
              <Loader2 size={32} className="animate-spin text-accent" />
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-text-primary">Synthesizing Intelligence</p>
                <p className="text-[10px] text-text-tertiary mt-1">Analyzing historical correlations and macro context...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
              <AlertTriangle size={32} className="text-negative" />
              <div className="max-w-xs">
                <p className="text-xs font-bold text-text-primary uppercase">Analysis Failed</p>
                <p className="text-[10px] text-text-tertiary mt-2">{error}</p>
              </div>
              <button 
                onClick={fetchIntel}
                className="flex items-center gap-2 px-4 py-2 bg-surface-highlight border border-border rounded text-[10px] font-bold uppercase hover:bg-white/5 transition-colors"
              >
                <RefreshCcw size={12} /> Retry Analysis
              </button>
            </div>
          ) : intel ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Summary & Logic */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                      <Zap size={12} className="text-accent" /> Executive Summary
                    </h3>
                    <p className="text-xs text-text-primary leading-relaxed">{intel.summary}</p>
                  </div>
                  <div className="bg-background border border-border p-4 rounded-sm">
                    <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-2">
                      <BarChart3 size={12} /> Market Logic
                    </h3>
                    <p className="text-xs font-bold text-accent italic">"{intel.marketLogic}"</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                    <Target size={12} /> Key Drivers
                  </h3>
                  <ul className="space-y-2">
                    {intel.whyItMatters.map((point, i) => (
                      <li key={i} className="flex gap-2 text-[11px] text-text-secondary leading-snug">
                        <span className="text-accent mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Volatility', value: intel.volatility, icon: Activity },
                  { label: 'Macro Impact', value: `${intel.macroImpact}/10`, icon: Globe },
                  { label: 'Risk Level', value: intel.riskLevel, icon: ShieldAlert },
                  { label: 'Surprise Threshold', value: `${intel.surpriseThresholdPct}%`, icon: Zap },
                ].map(m => (
                  <div key={m.label} className="bg-surface-highlight/30 border border-border p-3 rounded-sm flex flex-col items-center text-center">
                    <m.icon size={16} className="text-text-tertiary mb-2" />
                    <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1">{m.label}</span>
                    <span className="text-xs font-bold text-text-primary">{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Scenarios */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={12} /> Probabilistic Scenarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {intel.scenarios.map(s => (
                    <div key={s.name} className="bg-background border border-border p-3 rounded-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-primary">{s.name}</span>
                        <span className="text-[10px] font-mono font-bold text-accent">{s.probability}%</span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-tight">{s.reaction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impacted Assets */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Globe size={12} /> Asset Correlations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {intel.impactedAssets.map(asset => (
                    <div key={asset.symbol} className="bg-background border border-border p-3 rounded-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">{asset.symbol}</span>
                          <span className="text-[9px] px-1 bg-surface-highlight rounded text-text-tertiary">W: {asset.weight}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          asset.direction === 'UP' ? 'bg-positive/10 text-positive' : 
                          asset.direction === 'DOWN' ? 'bg-negative/10 text-negative' : 'bg-surface-highlight text-text-secondary'
                        }`}>
                          {asset.direction}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-tight">{asset.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade Setups */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Zap size={12} className="text-accent" /> Tactical Setups
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {intel.tradeSetups.map((setup, i) => (
                    <div key={i} className="bg-accent/5 border border-accent/20 p-4 rounded-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-accent uppercase font-bold">Strategy</span>
                        <p className="text-xs font-bold text-text-primary">{setup.setup}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-text-tertiary uppercase font-bold">Trigger</span>
                        <p className="text-[11px] text-text-secondary">{setup.trigger}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-text-tertiary uppercase font-bold">Risk Management</span>
                        <p className="text-[11px] text-text-secondary">{setup.risk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}