'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, TrendingUp, TrendingDown, Minus, Target, Brain, Activity, Loader2, Zap, 
  ArrowRightLeft, FileText, CheckCircle2, XCircle
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

  // Helper to colorize beats/misses
  const getBeatMissColor = (actual: string, est: string) => {
    if (actual === 'Pending' || est === 'Pending' || actual === 'N/A' || est === 'N/A') return 'text-text-primary';
    const a = parseFloat(actual.replace(/[^0-9.-]/g, ''));
    const e = parseFloat(est.replace(/[^0-9.-]/g, ''));
    if (isNaN(a) || isNaN(e)) return 'text-text-primary';
    return a >= e ? 'text-positive' : 'text-negative';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-6">
      <div className="bg-surface border border-border w-[96vw] h-[96vh] max-w-none overflow-hidden flex flex-col shadow-2xl rounded-md">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-6 py-4 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-[11px] font-black text-accent font-mono">{event.ticker.slice(0, 4)}</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-black text-text-primary leading-tight flex items-center gap-3 tracking-tight">
                {event.name} <span className="text-sm text-text-secondary font-mono bg-background px-2 py-0.5 rounded border border-border tracking-normal">{event.ticker}</span>
              </h2>
              <span className="text-xs text-accent uppercase tracking-widest mt-1 font-bold flex items-center gap-1">
                <FileText size={12} /> Financial Print & Equity Research // {event.date}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-sm transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative bg-background">
          
          {loading ? (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
              <Loader2 size={40} className="animate-spin text-accent" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest">Extracting SEC Filings & PR</h3>
                <p className="text-xs text-text-tertiary mt-2">Searching live web for exact reported revenue, EPS, and forward guidance...</p>
              </div>
            </div>
          ) : null}

          {intel && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-[1600px] mx-auto">
              
              {/* Financial Report Card */}
              <div className="bg-surface border border-border rounded-sm overflow-hidden shadow-sm">
                <div className="bg-surface-highlight p-3 md:p-4 border-b border-border flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <Target size={16} className="text-accent" /> 
                    Earnings Report Card
                    <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs ${intel.reportStatus === 'POST-EARNINGS' ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'}`}>
                      {intel.reportStatus}
                    </span>
                  </span>
                  <span className="text-xs md:text-sm text-text-tertiary font-mono">Market Cap: {event.marketCap || '---'}</span>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
                  <div className="p-6 md:p-8 flex flex-col items-center text-center justify-center bg-surface/30">
                    <span className="text-xs text-text-tertiary uppercase font-bold mb-2">Reported EPS</span>
                    <span className={`text-4xl md:text-5xl font-mono font-black tracking-tighter ${getBeatMissColor(intel.actualEPS, intel.estimatedEPS)}`}>
                      {intel.actualEPS}
                    </span>
                    <span className="text-sm text-text-secondary mt-2">Est: {intel.estimatedEPS}</span>
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col items-center text-center justify-center bg-surface/30">
                    <span className="text-xs text-text-tertiary uppercase font-bold mb-2">Reported Revenue</span>
                    <span className={`text-4xl md:text-5xl font-mono font-black tracking-tighter ${getBeatMissColor(intel.actualRevenue, intel.revenueEstimate)}`}>
                      {intel.actualRevenue}
                    </span>
                    <span className="text-sm text-text-secondary mt-2">Est: {intel.revenueEstimate}</span>
                  </div>

                  <div className="p-6 md:p-8 flex flex-col items-center text-center justify-center bg-surface/30">
                    <span className="text-xs text-text-tertiary uppercase font-bold mb-2">YoY Growth</span>
                    <span className={`text-3xl md:text-4xl font-mono font-bold ${intel.yoyGrowth.includes('-') ? 'text-negative' : intel.yoyGrowth !== 'Pending' ? 'text-positive' : 'text-text-primary'}`}>
                      {intel.yoyGrowth}
                    </span>
                  </div>

                  <div className="p-6 md:p-8 flex flex-col items-center text-center justify-center bg-accent/5">
                    <span className="text-xs text-accent uppercase font-bold mb-2">Buy-Side Whisper (EPS)</span>
                    <span className="text-3xl md:text-4xl font-mono font-bold text-text-primary">{intel.whisperNumber}</span>
                  </div>
                </div>

                <div className="border-t border-border p-6 md:p-8 bg-surface/50">
                  <span className="text-xs text-text-tertiary uppercase font-bold block mb-2">Forward Guidance & Outlook</span>
                  <p className="text-base md:text-lg text-text-primary leading-relaxed font-medium">
                    {intel.guidanceSummary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Left Column: Thesis & Analysis */}
                <div className="xl:col-span-3 space-y-6">
                  
                  {/* Synthesis */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2 text-text-primary">
                        <Brain size={20} className="text-accent" />
                        <span className="text-base md:text-lg font-bold uppercase tracking-wider">Institutional Synthesis</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold uppercase border ${
                        intel.sentiment === 'Bullish' ? 'bg-positive/10 text-positive border-positive/30' :
                        intel.sentiment === 'Bearish' ? 'bg-negative/10 text-negative border-negative/30' :
                        'bg-warning/10 text-warning border-warning/30'
                      }`}>
                        {intel.sentiment === 'Bullish' ? <TrendingUp size={16}/> : intel.sentiment === 'Bearish' ? <TrendingDown size={16}/> : <Minus size={16}/>}
                        {intel.sentiment} Reaction
                      </div>
                    </div>

                    <p className="text-base md:text-lg text-text-primary leading-relaxed bg-surface-highlight/30 p-6 rounded-md border border-border/50">
                      {intel.analysis}
                    </p>
                  </div>

                  {/* Bull vs Bear Scenarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-positive/5 border border-positive/20 p-5 rounded-md flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-positive font-bold uppercase tracking-wider text-sm">
                        <TrendingUp size={18} /> Bull Case Scenario
                      </div>
                      <p className="text-sm md:text-base text-text-primary leading-relaxed">{intel.bullCase || 'Strong execution and beat on top/bottom line.'}</p>
                    </div>
                    
                    <div className="bg-negative/5 border border-negative/20 p-5 rounded-md flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-negative font-bold uppercase tracking-wider text-sm">
                        <TrendingDown size={18} /> Bear Case Scenario
                      </div>
                      <p className="text-sm md:text-base text-text-primary leading-relaxed">{intel.bearCase || 'Miss on estimates or lowered forward guidance.'}</p>
                    </div>
                  </div>

                  {/* Institutional Context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface border border-border p-5 rounded-md">
                      <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider block mb-3">Smart Money Positioning</span>
                      <p className="text-sm md:text-base text-text-secondary leading-relaxed">{intel.institutionalBias || 'Awaiting definitive data before committing capital.'}</p>
                    </div>
                    <div className="bg-surface border border-border p-5 rounded-md">
                      <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider block mb-3">Historical Day-1 Reaction</span>
                      <p className="text-sm md:text-base text-text-secondary leading-relaxed">{intel.historicalReaction || 'Typically highly volatile on earnings release.'}</p>
                    </div>
                  </div>

                </div>

                {/* Right Column: Derivatives & KPIs */}
                <div className="space-y-6">
                  
                  {/* Options Matrix */}
                  <div className="bg-surface border border-border rounded-sm overflow-hidden shadow-sm">
                    <div className="bg-surface-highlight p-4 border-b border-border flex items-center gap-2">
                      <ArrowRightLeft size={16} className="text-text-tertiary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Options Market Matrix</span>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-end border-b border-border/50 pb-3">
                        <span className="text-xs text-text-tertiary font-bold uppercase">Implied Move</span>
                        <span className="text-2xl font-mono font-black text-accent">{intel.expectedMove}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-border/50 pb-3">
                        <span className="text-xs text-text-tertiary font-bold uppercase">IV Rank</span>
                        <span className="text-lg font-mono font-bold text-text-primary">{intel.optionsData?.ivRank || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-border/50 pb-3">
                        <span className="text-xs text-text-tertiary font-bold uppercase">Put/Call Ratio</span>
                        <span className="text-lg font-mono font-bold text-text-primary">{intel.optionsData?.putCallRatio || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-text-tertiary font-bold uppercase">Options Skew</span>
                        <span className="text-lg font-mono font-bold text-text-primary">{intel.optionsData?.skew || 'Neutral'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  {intel.keyMetrics && intel.keyMetrics.length > 0 && (
                    <div className="bg-surface border border-border rounded-sm overflow-hidden shadow-sm">
                      <div className="bg-surface-highlight p-4 border-b border-border flex items-center gap-2">
                        <Activity size={16} className="text-text-tertiary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Key KPI Focus</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {intel.keyMetrics.map((metric: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-background border border-border/50 rounded-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 shadow-[0_0_5px_rgba(0,255,157,0.5)]" />
                            <span className="text-sm text-text-primary font-medium">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}