'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, TrendingUp, Globe, Zap, BarChart3, AlertTriangle, Activity, Layers, Target, Info, Sparkles, Loader2, Brain, History, RefreshCw, TrendingDown, Minus
} from 'lucide-react';
import { EconomicEvent } from '@/lib/types';
import { formatTime } from '@/lib/date-utils';
import { computeSurprise } from '@/lib/event-intelligence';
import { addAlert } from '@/lib/alerts';
import { generateFullEventIntel } from '@/app/actions/generateFullEventIntel';
import { fetchEventHistory, HistoricalPrint } from '@/app/actions/fetchEventHistory';

interface EventDetailModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const surprise = useMemo(() => computeSurprise(event), [event]);
  
  const [intel, setIntel] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(true);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<(HistoricalPrint & { surprise: number, classification: string })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getPrediction = useCallback(async () => {
    setIsPredicting(true);
    try {
      const result = await generateFullEventIntel(event);
      setIntel(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPredicting(false);
    }
  }, [event]);

  useEffect(() => {
    getPrediction();
  }, [getPrediction]);

  // Lazy load the REAL history when the user clicks the "Historical Data" button
  useEffect(() => {
    if (showHistory && historyData.length === 0) {
      setLoadingHistory(true);
      fetchEventHistory(event.title, event.country).then(data => {
        const enhanced = data.map(d => {
          const surp = computeSurprise({ actual: d.actual, forecast: d.forecast });
          return {
            ...d,
            surprise: surp.surprisePct || 0,
            classification: surp.classification
          };
        });
        setHistoryData(enhanced);
        setLoadingHistory(false);
      });
    }
  }, [showHistory, event.title, event.country, historyData.length]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-6">
      <div className="bg-surface border border-border w-[96vw] h-[96vh] max-w-none overflow-hidden flex flex-col shadow-2xl rounded-md">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-6 py-4 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-bold text-text-primary uppercase tracking-tight">
                {event.title} // {event.country}
              </h2>
              <span className="text-xs text-text-tertiary uppercase tracking-widest font-mono mt-0.5">Terminal ID: {event.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-xs md:text-sm font-mono text-text-secondary bg-background px-3 py-1.5 rounded border border-border">
              <span className="text-accent font-bold">TIME: {event.time}</span>
              <span className="text-border">|</span>
              <span className="text-text-secondary">CURRENCY: {event.currency}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-sm transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative bg-background">
          
          {isPredicting && !showHistory ? (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
              <Loader2 size={40} className="animate-spin text-accent" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest">Synthesizing Live Data</h3>
                <p className="text-xs text-text-tertiary mt-2">Analyzing recent news & generating custom predictions...</p>
              </div>
            </div>
          ) : null}

          <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {showHistory ? (
               <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-3 text-text-primary border-b border-border pb-4">
                    <History size={24} className="text-accent" />
                    <h3 className="text-lg font-bold uppercase tracking-wider">Historical Data Prints</h3>
                  </div>
                  
                  <div className="bg-surface border border-border rounded-sm overflow-hidden flex-1 relative shadow-sm">
                    {loadingHistory ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 gap-4">
                        <Loader2 size={32} className="animate-spin text-accent" />
                        <span className="text-xs uppercase font-bold text-text-tertiary tracking-widest">Fetching Past Data from Web...</span>
                      </div>
                    ) : historyData.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-text-tertiary uppercase font-bold tracking-widest">
                        Historical data unavailable
                      </div>
                    ) : null}

                    <table className="w-full text-left text-base">
                      <thead className="bg-surface-highlight border-b border-border text-sm text-text-tertiary uppercase font-bold">
                        <tr>
                          <th className="p-4">Release Date</th>
                          <th className="p-4">Actual</th>
                          <th className="p-4">Forecast</th>
                          <th className="p-4 text-right">Surprise Mag.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr className="bg-accent/5">
                          <td className="p-4 font-mono font-bold text-accent">{event.date} (Current)</td>
                          <td className="p-4 font-mono font-bold text-lg">{event.actual || 'Pending'}</td>
                          <td className="p-4 font-mono text-text-secondary text-lg">{event.forecast || 'N/A'}</td>
                          <td className="p-4 font-mono text-right font-bold text-lg">{surprise.classification !== 'N/A' ? `${surprise.surprisePct?.toFixed(2)}%` : '---'}</td>
                        </tr>
                        {historyData.map((row, i) => (
                          <tr key={i} className="hover:bg-surface-highlight/50 transition-colors">
                            <td className="p-4 font-mono text-text-secondary">{row.date}</td>
                            <td className="p-4 font-mono text-text-primary">{row.actual}</td>
                            <td className="p-4 font-mono text-text-secondary">{row.forecast}</td>
                            <td className={`p-4 font-mono text-right ${row.surprise > 0 ? 'text-positive' : row.surprise < 0 ? 'text-negative' : 'text-text-tertiary'}`}>
                              {row.surprise > 0 ? '+' : ''}{row.surprise.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            ) : !intel ? (
              <div className="flex-1 h-full flex flex-col items-center justify-center gap-6 opacity-80">
                <AlertTriangle size={48} className="text-warning" />
                <div className="text-center">
                  <h3 className="text-xl font-bold text-text-primary uppercase tracking-widest">API Rate Limit Reached</h3>
                  <p className="text-sm text-text-tertiary mt-2">The intelligence agent failed to connect after 3 retries.</p>
                </div>
                <button 
                  onClick={getPrediction}
                  className="flex items-center gap-2 px-6 py-3 bg-surface-highlight border border-border hover:bg-white/5 transition-colors rounded-sm text-sm font-bold uppercase tracking-widest mt-4"
                >
                  <RefreshCw size={16} /> Retry Analysis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in duration-300">
                
                {/* LEFT COL: Live AI Insights */}
                <div className="xl:col-span-3 space-y-6">
                  
                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-sm space-y-4 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-2 bg-accent text-accent-text text-[10px] font-bold uppercase flex items-center gap-1">
                      <Sparkles size={12} /> Live AI Context
                    </div>
                    
                    <div className="flex items-center gap-2 text-accent pb-2 border-b border-accent/10">
                      <Brain size={18} />
                      <span className="text-sm font-bold uppercase tracking-wider">Algorithmic Market Prediction</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2">
                        <span className="text-xs text-text-tertiary uppercase font-bold">Institutional Bias</span>
                        <div className={`text-xl font-black uppercase ${intel.liveBias?.includes('Bullish') ? 'text-positive' : intel.liveBias?.includes('Bearish') ? 'text-negative' : 'text-warning'}`}>
                          {intel.liveBias || 'Neutral'}
                          <span className="text-xs text-text-secondary font-mono ml-3">({intel.predictionAccuracy || 50}% CONF)</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs text-text-tertiary uppercase font-bold">Smart Money Positioning</span>
                        <p className="text-sm text-text-primary leading-snug">{intel.smartMoneyPositioning || 'Awaiting data'}</p>
                      </div>
                      <div className="col-span-2 space-y-2 border-t border-accent/10 pt-4">
                        <span className="text-xs text-text-tertiary uppercase font-bold">Specific Execution Strategy</span>
                        <p className="text-base text-text-primary leading-relaxed font-medium">{intel.specificPrediction || 'Trading on technicals until data release.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-text-tertiary">
                      <Info size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Historical Macro Narrative</span>
                    </div>
                    <p className="text-base text-text-secondary leading-relaxed bg-surface-highlight/30 p-5 border-l-2 border-border rounded-r-md">
                      {intel.narrative || 'Standard economic release.'}
                    </p>
                  </div>

                  {intel.scenarios && intel.scenarios.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <Layers size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Probabilistic Scenario Tree</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {intel.scenarios.map((s: any) => (
                          <div key={s.label} className="bg-surface border border-border p-4 flex flex-col gap-2 rounded-sm shadow-sm hover:border-accent/30 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-text-primary">{s.label}</span>
                              <span className="text-base font-mono font-bold text-accent">{s.probability}%</span>
                            </div>
                            <p className="text-xs text-text-tertiary leading-relaxed min-h-[40px]">{s.reaction}</p>
                            <div className="w-full h-1 bg-surface-highlight mt-2 rounded-full overflow-hidden">
                              <div className={`h-full ${s.bias === 'BULLISH' ? 'bg-positive/60' : s.bias === 'BEARISH' ? 'bg-negative/60' : 'bg-warning/60'} transition-all duration-1000`} style={{ width: `${s.probability}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* RIGHT COL: Data & Sensitivities */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-2 bg-surface-highlight/50 border border-border rounded-sm p-2 shadow-sm">
                    {[
                      { label: 'Volatility Regime', value: intel.volatility || 'Moderate', color: 'text-accent' },
                      { label: 'Macro Impact', value: `${intel.macroImpact || 5}/10`, color: 'text-text-primary' },
                      { label: 'Surprise Threshold', value: `${intel.surpriseThresholdPct || 10}%`, color: 'text-text-secondary' }
                    ].map(s => (
                      <div key={s.label} className="bg-background p-4 flex items-center justify-between rounded-sm border border-border/50">
                        <span className="text-xs text-text-tertiary uppercase font-bold">{s.label}</span>
                        <span className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {intel.sensitivities && intel.sensitivities.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-text-tertiary border-b border-border pb-2">
                        <Target size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Asset Sensitivity</span>
                      </div>
                      <div className="space-y-2">
                        {intel.sensitivities.map((asset: any) => (
                          <div key={asset.symbol} className="bg-surface border border-border p-4 flex items-center justify-between rounded-sm shadow-sm hover:border-accent/30 transition-colors">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-text-primary">{asset.symbol}</span>
                              <span className="text-xs text-text-tertiary uppercase font-mono">{asset.expectedMove}</span>
                            </div>
                            <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                  )}

                  {surprise.classification !== 'N/A' && (
                    <div className="pt-6 border-t border-border space-y-4">
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <Activity size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Live Reaction Engine</span>
                      </div>
                      <div className="bg-surface border border-border p-5 flex flex-col gap-4 rounded-sm shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 bottom-0 w-1 ${surprise.classification === 'HOT' ? 'bg-negative' : surprise.classification === 'COOL' ? 'bg-positive' : 'bg-surface-highlight'}`} />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-secondary uppercase">Magnitude</span>
                          <span className="text-lg font-mono font-bold text-text-primary">{surprise.surprisePct?.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-3">
                          <span className="text-xs font-bold text-text-secondary uppercase">Classification</span>
                          <span className="text-xl font-black tracking-tighter uppercase text-accent">
                            {surprise.classification === 'HOT' ? 'HAWKISH' : surprise.classification === 'COOL' ? 'DOVISH' : 'NEUTRAL'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-border bg-surface-highlight flex justify-between items-center shrink-0">
          <div className="flex gap-4">
            <button onClick={handleSetAlert} className="px-5 py-2.5 bg-accent text-accent-text text-xs font-bold uppercase rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              <Zap size={16} /> Set Alert
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className={`px-5 py-2.5 border text-xs font-bold uppercase rounded-sm transition-colors flex items-center gap-2 ${showHistory ? 'bg-background border-border text-text-primary' : 'bg-surface border-border text-text-secondary hover:text-text-primary'}`}
            >
              {showHistory ? 'Close History' : 'Historical Data'}
            </button>
          </div>
          <span className="hidden sm:block text-xs font-mono text-text-tertiary">VANTAGE TERMINAL // {showHistory ? 'DATA_TABLE' : 'AI_INTEL_V4'} // {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}