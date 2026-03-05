'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, TrendingUp, TrendingDown, Minus, Building2, Target, Brain, Activity, Loader2, Zap
} from 'lucide-react';
import { EarningsEvent } from '@/lib/types';
import { generateEarningsIntel } from '@/app/actions/generateEarningsIntel';

interface EarningsDetailModalProps {
  event: EarningsEvent;
  onClose: () => void;
}

export function EarningsDetailModal({ event, onClose }: EarningsDetailModalProps) {
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateEarningsIntel(event);
      setIntel(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    getPrediction();
  }, [getPrediction]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-surface border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden p-1 shrink-0">
              <img 
                src={`https://financialmodelingprep.com/image-stock/${event.ticker}.png`}
                alt={event.ticker}
                className="w-full h-full object-contain"
                onError={(el) => el.currentTarget.style.display = 'none'}
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-text-primary leading-tight flex items-center gap-2">
                {event.name} <span className="text-xs text-text-secondary font-mono bg-background px-1.5 py-0.5 rounded border border-border">{event.ticker}</span>
              </h2>
              <span className="text-[9px] text-text-tertiary uppercase tracking-widest mt-0.5">Corporate Earnings Report // {event.date}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-sm transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          
          {loading ? (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
              <Loader2 size={32} className="animate-spin text-accent" />
              <div className="text-center">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Compiling Equity Research</h3>
                <p className="text-[10px] text-text-tertiary mt-1">Analyzing {event.ticker} fundamentals and options flow...</p>
              </div>
            </div>
          ) : null}

          {intel && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Top Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-background border border-border p-3 rounded-sm flex flex-col justify-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><Building2 size={10}/> Market Cap</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{event.marketCap || '---'}</span>
                </div>
                <div className="bg-background border border-border p-3 rounded-sm flex flex-col justify-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><Activity size={10}/> Implied Move</span>
                  <span className="text-sm font-mono font-bold text-accent">{intel.expectedMove}</span>
                </div>
                <div className="bg-surface-highlight/50 border border-border p-3 rounded-sm flex flex-col justify-center col-span-2">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><Target size={10}/> EPS Estimate</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-mono font-bold text-text-primary">{event.epsEst !== null ? `$${event.epsEst.toFixed(2)}` : 'N/A'}</span>
                    {event.epsAct !== null && (
                      <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${event.epsAct > (event.epsEst || 0) ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                        Actual: ${event.epsAct.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Analysis Block */}
              <div className="p-5 bg-accent/5 border border-accent/20 rounded-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1.5 bg-accent text-accent-text text-[8px] font-bold uppercase flex items-center gap-1">
                  <Zap size={10} /> AI Agent V4
                </div>
                
                <div className="flex items-center justify-between border-b border-accent/10 pb-3">
                  <div className="flex items-center gap-2 text-accent">
                    <Brain size={16} />
                    <span className="text-sm font-bold uppercase tracking-wider">Institutional Bias</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase border ${
                    intel.sentiment === 'Bullish' ? 'bg-positive/10 text-positive border-positive/30' : 
                    intel.sentiment === 'Bearish' ? 'bg-negative/10 text-negative border-negative/30' : 
                    'bg-warning/10 text-warning border-warning/30'
                  }`}>
                    {intel.sentiment === 'Bullish' ? <TrendingUp size={14}/> : intel.sentiment === 'Bearish' ? <TrendingDown size={14}/> : <Minus size={14}/>}
                    {intel.sentiment}
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-1">Smart Money Positioning</span>
                    <p className="text-xs text-text-primary leading-relaxed font-medium">{intel.institutionalBias}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-1">Execution Thesis</span>
                    <p className="text-xs text-text-secondary leading-relaxed bg-background/50 p-3 rounded border border-border/50">{intel.analysis}</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics List */}
              <div className="space-y-3">
                <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1">
                  <Target size={12} /> Critical KPIs to Watch
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {intel.keyMetrics.map((metric: string, i: number) => (
                    <div key={i} className="bg-surface-highlight border border-border p-3 rounded-sm flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center text-[8px] font-mono text-text-tertiary shrink-0">
                        {i+1}
                      </div>
                      <span className="text-[11px] font-bold text-text-primary leading-tight">{metric}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}