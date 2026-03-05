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
              <span className="text-[10px] text-accent uppercase tracking-widest mt-0.5 font-bold flex items-center gap-1">
                <FileText size={10} /> Financial Print & Equity Research // {event.date}
              </span>
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
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Extracting SEC Filings & PR</h3>
                <p className="text-[10px] text-text-tertiary mt-1">Searching live web for exact reported revenue, EPS, and forward guidance...</p>
              </div>
            </div>
          ) : null}

          {intel && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Financial Report Card */}
              <div className="bg-background border border-border rounded-sm overflow-hidden">
                <div className="bg-surface-highlight p-2 border-b border-border flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <Target size={14} className="text-accent" /> 
                    Earnings Report Card
                    <span className={`px-2 py-0.5 rounded text-[8px] ${intel.reportStatus === 'POST-EARNINGS' ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'}`}>
                      {intel.reportStatus}
                    </span>
                  </span>
                  <span className="text-[9px] text-text-tertiary font-mono">Market Cap: {event.marketCap || '---'}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
                  <div className="p-4 flex flex-col items-center text-center justify-center bg-surface/30">
                    <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Reported EPS</span>
                    <span className={`text-2xl font-mono font-black tracking-tighter ${getBeatMissColor(intel.actualEPS, intel.estimatedEPS)}`}>
                      {intel.actualEPS}
                    </span>
                    <span className="text-[9px] text-text-secondary mt-1">Est: {intel.estimatedEPS}</span>
                  </div>
                  
                  <div className="p-4 flex flex-col items-center text-center justify-center bg-surface/30">
                    <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Reported Revenue</span>
                    <span className={`text-2xl font-mono font-black tracking-tighter ${getBeatMissColor(intel.actualRevenue, intel.revenueEstimate)}`}>
                      {intel.actualRevenue}
                    </span>
                    <span className="text-[9px] text-text-secondary mt-1">Est: {intel.revenueEstimate}</span>
                  </div>

                  <div className="p-4 flex flex-col items-center text-center justify-center bg-surface/30">
                    <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1">YoY Growth</span>
                    <span className={`text-xl font-mono font-bold ${intel.yoyGrowth.includes('-') ? 'text-negative' : intel.yoyGrowth !== 'Pending' ? 'text-positive' : 'text-text-primary'}`}>
                      {intel.yoyGrowth}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col items-center text-center justify-center bg-accent/5">
                    <span className="text-[10px] text-accent uppercase font-bold mb-1">Buy-Side Whisper (EPS)</span>
                    <span className="text-xl font-mono font-bold text-text-primary">{intel.whisperNumber}</span>
                  </div>
                </div>

                <div className="border-t border-border p-4 bg-surface/50">
                  <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-1">Forward Guidance & Outlook</span>
                  <p className="text-sm text-text-primary leading-relaxed font-medium">
                    {intel.guidanceSummary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Thesis & Analysis */}
                <div className="lg:col-span-2 space-y-6">
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2 text-text-primary">
                        <Brain size={16} className="text-accent" />
                        <span className="text-sm font-bold uppercase tracking-wider">Institutional Synthesis</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase border ${
                        intel.sentiment === 'Bullish' ? 'bg-positive/10 text-positive border-positive/30' : 
                        intel.sentiment === 'Bearish' ? 'bg-negative/10 text-negative border-negative/30' : 
                        'bg-warning/10 text-warning border-warning/30'
                      }`}>
                        {intel.sentiment === 'Bullish' ? <TrendingUp size={12}/> : intel.sentiment === 'Bearish' ? <TrendingDown size={12}/> : <Minus size={12}/>}
                        {intel.sentiment} Reaction
                      </div>
                    </div>

                    <p className="text-sm text-text-primary leading-relaxed bg-surface-highlight/30 p-4 rounded border border-border/50">
                      {intel.analysis}
                    </p>
                  </div>

                </div>

                {/* Right Column: Derivatives */}
                <div className="space-y-6">
                  <div className="bg-surface border border-border rounded-sm overflow-hidden">
                    <div className="bg-surface-highlight p-2 border-b border-border flex items-center gap-2">
                      <ArrowRightLeft size={14} className="text-text-tertiary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Options Market Matrix</span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-end border-b border-border/50 pb-2">
                        <span className="text-[10px] text-text-tertiary font-bold uppercase">Implied Move</span>
                        <span className="text-lg font-mono font-black text-accent">{intel.expectedMove}</span>
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
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}