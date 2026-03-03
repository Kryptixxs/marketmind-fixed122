'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  X, TrendingUp, Globe, Zap, BarChart3, AlertTriangle, Activity, Layers, Target, Info, Search, ShieldAlert, Sparkles, Loader2, Brain
} from 'lucide-react';
import { EconomicEvent } from '@/lib/types';
import { formatTime } from '@/lib/date-utils';
import { getEventIntel, computeSurprise } from '@/lib/event-intelligence';
import { addAlert } from '@/lib/alerts';
import { predictEventOutcome } from '@/app/actions/predictEventOutcome';

interface EventDetailModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  // Deterministic, zero-latency rules engine
  const intel = useMemo(() => getEventIntel(event), [event]);
  const surprise = useMemo(() => computeSurprise(event), [event]);

  // Live AI Prediction state
  const [livePrediction, setLivePrediction] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    async function getPrediction() {
      setIsPredicting(true);
      try {
        const result = await predictEventOutcome(event);
        setLivePrediction(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsPredicting(false);
      }
    }
    // Only run expensive prediction for important events to save tokens
    if (event.impact === 'High' || event.impact === 'Medium') {
      getPrediction();
    }
  }, [event]);

  const handleSetAlert = () => {
    addAlert({
      eventId: event.id,
      eventTitle: event.title,
      eventTime: event.time,
      eventDate: event.date,
      type: 'BEFORE',
      minutesBefore: 5,
    });
    alert(`Alert set for ${event.title}. You will be notified 5 minutes before the release.`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2">
      <div className="bg-surface border border-border w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-3 py-2 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                {event.title} // {event.country}
              </h2>
              <span className="text-[8px] text-text-tertiary uppercase tracking-widest font-mono">Terminal ID: {event.id} // HYBRID_AI_V2.0</span>
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COL: Live AI Insights (NEW) */}
            <div className="lg:col-span-2 space-y-4">
              
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1.5 bg-accent text-accent-text text-[8px] font-bold uppercase flex items-center gap-1">
                  <Sparkles size={10} /> Live AI Context
                </div>
                
                <div className="flex items-center gap-2 text-accent">
                  <Brain size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Algorithmic Market Prediction</span>
                </div>

                {isPredicting ? (
                  <div className="flex items-center gap-2 text-[10px] text-text-tertiary py-4">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    Synthesizing real-time news headlines and event parameters...
                  </div>
                ) : livePrediction ? (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Institutional Bias</span>
                      <div className={`text-sm font-black uppercase ${livePrediction.liveBias.includes('Bullish') ? 'text-positive' : livePrediction.liveBias.includes('Bearish') ? 'text-negative' : 'text-warning'}`}>
                        {livePrediction.liveBias}
                        <span className="text-[10px] text-text-secondary font-mono ml-2">({livePrediction.predictionAccuracy}% CONF)</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Smart Money Positioning</span>
                      <p className="text-[10px] text-text-primary leading-snug">{livePrediction.smartMoneyPositioning}</p>
                    </div>
                    <div className="col-span-2 space-y-1 border-t border-accent/10 pt-2">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Specific Execution Strategy</span>
                      <p className="text-[11px] text-text-primary leading-relaxed">{livePrediction.specificPrediction}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-text-tertiary italic">AI Prediction skipped for low-impact event.</div>
                )}
              </div>

              {/* Narrative Section (Deterministic Fallback) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Info size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Historical Macro Narrative</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed bg-surface-highlight/30 p-3 border-l-2 border-border">
                  {intel.narrative}
                </p>
              </div>

              {/* Scenario Tree */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Layers size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Probabilistic Scenario Tree</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {intel.scenarios.map((s: any) => (
                    <div key={s.label} className="bg-background border border-border p-2 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-text-primary">{s.label}</span>
                        <span className="text-[10px] font-mono text-accent">{s.probability}%</span>
                      </div>
                      <p className="text-[9px] text-text-tertiary leading-tight">{s.reaction}</p>
                      <div className="w-full h-0.5 bg-surface-highlight mt-1">
                        <div className={`h-full ${s.bias === 'BULLISH' ? 'bg-positive/40' : s.bias === 'BEARISH' ? 'bg-negative/40' : 'bg-warning/40'} transition-all duration-1000`} style={{ width: `${s.probability}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COL: Data & Sensitivities */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1 bg-border border border-border">
                {[
                  { label: 'Volatility Regime', value: intel.volatility, color: 'text-accent' },
                  { label: 'Macro Impact', value: `${intel.macroImpact}/10`, color: 'text-text-primary' },
                  { label: 'Surprise Thresh', value: `${intel.surpriseThresholdPct}%`, color: 'text-text-secondary' }
                ].map(s => (
                  <div key={s.label} className="bg-background p-2 flex flex-col gap-1">
                    <span className="text-[8px] text-text-tertiary uppercase font-bold">{s.label}</span>
                    <span className={`text-[10px] font-mono font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Impact Heatmap */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Target size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Asset Sensitivity</span>
                </div>
                <div className="space-y-1">
                  {intel.sensitivities.map((asset: any) => (
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

               {/* Live Reaction Engine (If data printed) */}
              {surprise.classification !== 'N/A' && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <Activity size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Live Reaction Engine</span>
                  </div>
                  <div className="bg-surface-highlight border border-border p-3 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-text-primary uppercase">Magnitude: {surprise.surprisePct?.toFixed(2)}%</span>
                      <span className="text-[9px] text-text-secondary">Class: <span className="text-accent font-bold">{surprise.classification}</span></span>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-mono font-bold text-text-primary uppercase">
                        {surprise.classification === 'HOT' ? 'HAWKISH' : surprise.classification === 'COOL' ? 'DOVISH' : 'NEUTRAL'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-surface-highlight flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={handleSetAlert} className="px-3 py-1.5 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1">
              <Zap size={12} /> Set Alert
            </button>
            <button className="px-3 py-1.5 bg-surface border border-border text-text-secondary text-[10px] font-bold uppercase rounded-sm hover:text-text-primary transition-colors">
              Historical Data
            </button>
          </div>
          <span className="text-[9px] font-mono text-text-tertiary">VANTAGE TERMINAL // EVENT_INTEL_V2 // {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}