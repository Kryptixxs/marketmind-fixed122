'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, TrendingUp, TrendingDown, Minus, Building2, Target, Brain, Activity, Loader2, Zap, 
  BarChart4, ArrowRightLeft, ShieldAlert, History
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
      <div className="bg-surface border border-border w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-inner">
              <img 
                src={`https://financialmodelingprep.com/image-stock/${event.ticker}.png`}
                alt={event.ticker}
                className="w-full h-full object-contain"
                onError={(el) => el.currentTarget.style.display = 'none'}
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-text-primary leading-tight flex items-center gap-2 tracking-tight">
                {event.name} <span className="text-xs text-text-secondary font-mono bg-background px-2 py-0.5 rounded border border-border tracking-normal">{event.ticker}</span>
              </h2>
              <span className="text-[10px] text-accent uppercase tracking-widest mt-0.5 font-bold">Comprehensive Equity Research // {event.date}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-sm transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          
          {loading ? (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
              <Loader2 size={32} className="animate-spin text-accent" />
              <div className="text-center">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Compiling Deep Equity Research</h3>
                <p className="text-[10px] text-text-tertiary mt-1">Aggregating options flow, analyst revisions, and whisper numbers...</p>
              </div>
            </div>
          ) : null}

          {intel && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Consensus & Estimates Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-background border border-border p-3 rounded-sm flex flex-col justify-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><Building2 size={10}/> Market Cap</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{event.marketCap || '---'}</span>
                </div>
                <div className="bg-background border border-border p-3 rounded-sm flex flex-col justify-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><BarChart4 size={10}/> Revenue Est</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{intel.revenueEstimate}</span>
                </div>
                <div className="bg-background border border-border p-3 rounded-sm flex flex-col justify-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1"><Target size={10}/> Street EPS Est</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{event.epsEst !== null ? `$${event.epsEst.toFixed(2)}` : 'N/A'}</span>
                </div>
                <div className="bg-accent/5 border border-accent/30 p-3 rounded-sm flex flex-col justify-center">
                  <span className="text-[9px] text-accent uppercase font-bold mb-1 flex items-center gap-1">Buy-Side Whisper</span>
                  <span className="text-sm font-mono font-bold text-accent">{intel.whisperNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Thesis & Options */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* AI Analysis Block */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2 text-text-primary">
                        <Brain size={16} className="text-accent" />
                        <span className="text-sm font-bold uppercase tracking-wider">Institutional Thesis</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase border ${
                        intel.sentiment === 'Bullish' ? 'bg-positive/10 text-positive border-positive/30' : 
                        intel.sentiment === 'Bearish' ? 'bg-negative/10 text-negative border-negative/30' : 
                        'bg-warning/10 text-warning border-warning/30'
                      }`}>
                        {intel.sentiment === 'Bullish' ? <TrendingUp size={12}/> : intel.sentiment === 'Bearish' ? <TrendingDown size={12}/> : <Minus size={12}/>}
                        {intel.sentiment} Bias
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      <div>
                        <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-1">Execution Summary</span>
                        <p className="text-sm text-text-primary leading-relaxed bg-surface-highlight/30 p-3 rounded border border-border/50">{intel.analysis}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-1">Smart Money Positioning</span>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">{intel.institutionalBias}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bull / Bear Scenarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-positive/5 border border-positive/20 p-4 rounded-sm flex flex-col gap-2">
                      <span className="text-[10px] text-positive uppercase font-bold flex items-center gap-1"><TrendingUp size={12}/> The Bull Case</span>
                      <p className="text-xs text-positive/90 leading-snug">{intel.bullCase}</p>
                    </div>
                    <div className="bg-negative/5 border border-negative/20 p-4 rounded-sm flex flex-col gap-2">
                      <span className="text-[10px] text-negative uppercase font-bold flex items-center gap-1"><TrendingDown size={12}/> The Bear Case</span>
                      <p className="text-xs text-negative/90 leading-snug">{intel.bearCase}</p>
                    </div>
                  </div>

                </div>

                {/* Right Column: Derivatives & Metrics */}
                <div className="space-y-6">
                  
                  {/* Options Matrix */}
                  <div className="bg-surface border border-border rounded-sm overflow-hidden">
                    <div className="bg-surface-highlight p-2 border-b border-border flex items-center gap-2">
                      <ArrowRightLeft size={14} className="text-text-tertiary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Options Market Matrix</span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="flex justify-between items-end border-b border-border/50 pb-2">
                        <span className="text-[10px] text-text-tertiary font-bold uppercase">Implied Move</span>
                        <span className="text-sm font-mono font-bold text-accent">{intel.expectedMove}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-border/50 pb-2">
                        <span className="text-[10px] text-text-tertiary font-bold uppercase">IV Rank</span>
                        <span className="text-sm font-mono font-bold text-text-primary">{intel.optionsData.ivRank}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-border/50 pb-2">
                        <span className="text-[10px] text-text-tertiary font-bold uppercase">Put/Call Ratio</span>
                        <span className="text-sm font-mono font-bold text-text-primary">{intel.optionsData.putCallRatio}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-text-tertiary font-bold uppercase">Options Skew</span>
                        <span className="text-sm font-mono font-bold text-text-primary">{intel.optionsData.skew}</span>
                      </div>
                    </div>
                  </div>

                  {/* Historical Context */}
                  <div className="bg-surface border border-border rounded-sm p-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                      <History size={12} /> Historical Reaction
                    </span>
                    <span className="text-xs text-text-primary font-mono">{intel.historicalReaction}</span>
                  </div>

                  {/* Key Metrics List */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1">
                      <ShieldAlert size={12} /> Critical KPIs
                    </span>
                    <div className="flex flex-col gap-2">
                      {intel.keyMetrics.map((metric: string, i: number) => (
                        <div key={i} className="bg-surface border border-border px-3 py-2 rounded-sm flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-surface-highlight flex items-center justify-center text-[9px] font-mono text-text-secondary shrink-0">
                            {i+1}
                          </div>
                          <span className="text-[11px] font-bold text-text-primary leading-tight">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}