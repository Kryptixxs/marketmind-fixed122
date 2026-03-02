'use client';

import React from 'react';
import { 
  X, Bell, TrendingUp, Info, History, Speedometer, 
  AlertTriangle, Globe, Eye, Zap, BarChart3 
} from 'lucide-react';
import { EconomicEvent } from '@/lib/types';
import { formatTime } from '@/lib/date-utils';

interface EventDetailModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  // Mocking some institutional data based on impact level
  const isHigh = event.impact === 'High';
  const importanceScore = isHigh ? 10 : event.impact === 'Medium' ? 7 : 4;
  
  const metrics = [
    { label: 'Volatility', value: isHigh ? 'Very High' : 'Moderate', icon: Zap },
    { label: 'Macro Impact', value: isHigh ? 'Very High' : 'Moderate', icon: Globe },
    { label: 'Risk Level', value: isHigh ? 'Very High' : 'Moderate', icon: AlertTriangle },
    { label: 'Popularity', value: isHigh ? 'Very High' : 'High', icon: Eye },
  ];

  const impactedAssets = [
    { name: event.currency, score: 8, sentiment: 'Bullish', desc: `Stronger ${event.title} numbers typically lead to higher ${event.currency} due to expected interest rate hikes.` },
    { name: 'US Stocks', score: 6, sentiment: 'Bullish', desc: 'Good numbers suggest economic strength, potentially boosting stock market confidence.' },
    { name: 'EUR/USD', score: 7, sentiment: 'Bearish', desc: `Improved ${event.country} employment can lead to a stronger ${event.currency}, impacting this forex pair negatively.` },
    { name: 'Gold', score: 5, sentiment: 'Bearish', desc: `Stronger ${event.currency} and potential rate hikes reduce appeal of non-yielding assets like gold.` },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              {event.title}
            </h2>
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest">Institutional Insight // v4.0</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Event Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary uppercase font-bold">Date & Time</span>
              <div className="text-xs font-mono text-text-primary">{event.date} @ {formatTime(event.time)}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary uppercase font-bold">Region</span>
              <div className="flex items-center gap-2 text-xs font-mono text-text-primary">
                <img src={`https://flagcdn.com/w20/${event.country.toLowerCase()}.png`} className="w-4 h-2.5 object-cover" alt="" />
                {event.country} ({event.currency})
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary uppercase font-bold">Frequency</span>
              <div className="text-xs font-mono text-text-primary">Monthly</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary uppercase font-bold">Status</span>
              <div className="text-xs font-mono text-accent animate-pulse">Starts in 4 days</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-sm text-xs font-bold hover:bg-accent/20 transition-all">
              <Bell size={14} /> Set Alert
            </button>
          </div>

          {/* Importance & Effect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-4 text-text-tertiary">
                <BarChart3 size={14} />
                <span className="text-[10px] font-bold uppercase">Importance Score</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-mono font-bold text-accent">{importanceScore}</span>
                <span className="text-text-tertiary text-xs mb-1">/ 10</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-2">
                {isHigh ? 'Critical market impact expected. High liquidity requirements.' : 'Moderate impact. Watch for deviations from consensus.'}
              </p>
              <div className="flex gap-1 mt-4">
                {['None', 'Low', 'Med', 'High', 'Crit'].map((l, i) => (
                  <div key={l} className={`h-1 flex-1 rounded-full ${i <= (importanceScore/2) ? 'bg-accent' : 'bg-surface-highlight'}`} />
                ))}
              </div>
            </div>

            <div className="bg-background border border-border p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-4 text-text-tertiary">
                <TrendingUp size={14} />
                <span className="text-[10px] font-bold uppercase">Usual Effect</span>
              </div>
              <p className="text-xs text-text-primary leading-relaxed">
                Higher than expected values typically strengthen <span className="text-accent font-bold">{event.currency}</span> (Bullish), while lower values weaken it (Bearish).
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {metrics.map(m => (
              <div key={m.label} className="bg-surface-highlight/30 border border-border p-3 rounded-sm flex flex-col items-center text-center">
                <m.icon size={16} className="text-text-tertiary mb-2" />
                <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1">{m.label}</span>
                <span className="text-xs font-bold text-text-primary">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Impacted Assets */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Globe size={14} />
              <span className="text-[10px] font-bold uppercase">Impacted Assets</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {impactedAssets.map(asset => (
                <div key={asset.name} className="bg-background border border-border p-4 rounded-sm group hover:border-accent/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary">{asset.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-highlight rounded text-text-tertiary font-mono">Score: {asset.score}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${asset.sentiment === 'Bullish' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                      {asset.sentiment}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {asset.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}