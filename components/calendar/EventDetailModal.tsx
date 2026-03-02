'use client';

import React, { useMemo } from 'react';
import { 
  X, TrendingUp, Globe, Zap, BarChart3, AlertTriangle, Eye, Activity
} from 'lucide-react';
import { EconomicEvent } from '@/lib/types';
import { formatTime } from '@/lib/date-utils';
import { getEventIntel, computeSurprise } from '@/lib/event-intelligence';
import { addAlert } from '@/lib/alerts';

interface EventDetailModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const intel = useMemo(() => getEventIntel(event), [event]);
  const surprise = useMemo(() => computeSurprise(event), [event]);

  const handleSetAlert = () => {
    // Determine a default alert type (e.g., 5 mins before)
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

  const metrics = [
    { label: 'Volatility', value: intel.volatility, icon: Zap },
    { label: 'Macro Impact', value: `${intel.macroImpact}/10`, icon: Globe },
    { label: 'Risk Level', value: event.impact === 'High' ? 'Elevated' : 'Standard', icon: AlertTriangle },
    { label: 'Surprise Threshold', value: `${intel.surpriseThresholdPct}%`, icon: Activity },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-sm">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-text-primary leading-tight flex items-center gap-3">
              {event.title}
              <button
                onClick={handleSetAlert}
                className="text-[10px] uppercase font-bold bg-accent/20 hover:bg-accent/30 text-accent px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Zap size={10} /> Set Alert
              </button>
            </h2>
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">Institutional Insight // v4.0</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Surprise Badge */}
          {surprise.classification !== 'N/A' && (
            <div className={`p-3 rounded-sm border flex items-center justify-between ${
              surprise.classification === 'HOT' ? 'bg-negative/10 border-negative/20 text-negative' :
              surprise.classification === 'COOL' ? 'bg-positive/10 border-positive/20 text-positive' :
              'bg-surface-highlight border-border text-text-secondary'
            }`}>
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Surprise Classification: {surprise.classification}</span>
              </div>
              <span className="font-mono font-bold">{surprise.surprisePct?.toFixed(2)}%</span>
            </div>
          )}

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
              <span className="text-[10px] text-text-tertiary uppercase font-bold">Impact Level</span>
              <div className={`text-xs font-mono font-bold ${event.impact === 'High' ? 'text-negative' : event.impact === 'Medium' ? 'text-warning' : 'text-positive'}`}>
                {event.impact}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary uppercase font-bold">Actual / Forecast</span>
              <div className="text-xs font-mono text-text-primary">{event.actual || '---'} / {event.forecast || '---'}</div>
            </div>
          </div>

          {/* Logic */}
          <div className="bg-background border border-border p-4 rounded-sm">
            <div className="flex items-center gap-2 mb-3 text-text-tertiary">
              <BarChart3 size={14} />
              <span className="text-[10px] font-bold uppercase">Market Logic</span>
            </div>
            <p className="text-xs text-text-primary leading-relaxed">
              {intel.logic}
            </p>
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

          {/* Scenarios */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-tertiary">
              <TrendingUp size={14} />
              <span className="text-[10px] font-bold uppercase">Probabilistic Scenarios</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {intel.scenarios.map(s => (
                <div key={s.label} className="bg-background border border-border p-3 rounded-sm flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-primary">{s.label}</span>
                    <span className="text-[10px] text-text-secondary">{s.reaction}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-accent">{s.probability}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Impacted Assets */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Globe size={14} />
              <span className="text-[10px] font-bold uppercase">Impacted Assets</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {intel.impactedAssets.map(asset => (
                <div key={asset.symbol} className="bg-background border border-border p-4 rounded-sm group hover:border-accent/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary">{asset.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-highlight rounded text-text-tertiary font-mono">Weight: {asset.weight}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${asset.direction === 'UP' ? 'bg-positive/10 text-positive' : asset.direction === 'DOWN' ? 'bg-negative/10 text-negative' : 'bg-surface-highlight text-text-secondary'}`}>
                      {asset.direction}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {asset.description}
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