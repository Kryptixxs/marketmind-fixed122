'use client';

import React, { useMemo } from 'react';
import { Clock, ArrowUp, ArrowDown, Globe } from 'lucide-react';
import { Tick } from '@/features/MarketData/services/marketdata/types';

interface SessionRange {
  name: string;
  start: number; // UTC Hour
  end: number;   // UTC Hour
  color: string;
  label: string;
}

const SESSIONS: SessionRange[] = [
  { name: 'London', start: 8, end: 14, color: 'text-blue-400', label: 'LON' },
  { name: 'New York', start: 13, end: 21, color: 'text-accent', label: 'NY' },
  { name: 'Tokyo', start: 0, end: 8, color: 'text-purple-400', label: 'TYO' }
];

export function SessionTracker({ tick }: { tick?: Tick }) {
  const sessionData = useMemo(() => {
    if (!tick || !tick.history || tick.history.length === 0) return null;

    const now = new Date();
    const currentUtcHour = now.getUTCHours();

    return SESSIONS.map(session => {
      // Check if session is currently active
      let isActive = false;
      if (session.start < session.end) {
        isActive = currentUtcHour >= session.start && currentUtcHour < session.end;
      } else {
        // Over midnight (Tokyo)
        isActive = currentUtcHour >= session.start || currentUtcHour < session.end;
      }

      // Calculate High/Low for the session from history
      const sessionBars = tick.history!.filter(bar => {
        const barDate = new Date(bar.timestamp);
        const barHour = barDate.getUTCHours();
        
        if (session.start < session.end) {
          return barHour >= session.start && barHour < session.end;
        } else {
          return barHour >= session.start || barHour < session.end;
        }
      });

      if (sessionBars.length === 0) return { ...session, isActive, high: null, low: null };

      const high = Math.max(...sessionBars.map(b => b.high));
      const low = Math.min(...sessionBars.map(b => b.low));

      return {
        ...session,
        isActive,
        high,
        low
      };
    });
  }, [tick]);

  if (!tick || !sessionData) {
    return (
      <div className="p-3 h-full flex items-center justify-center opacity-30">
        <Clock size={16} className="animate-pulse" />
      </div>
    );
  }

  const formatPrice = (p: number) => p > 1000 ? p.toFixed(1) : p.toFixed(2);

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex justify-between items-center mb-1">
        <div className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1">
          <Globe size={10} /> Session High/Low Monitor
        </div>
        <span className="text-[9px] font-mono text-accent">LIVE_FEED</span>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
        {sessionData.map(s => (
          <div key={s.name} className={`p-2 border rounded-sm transition-all ${s.isActive ? 'bg-accent/5 border-accent/20' : 'bg-surface-highlight/30 border-border/50 opacity-60'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${s.isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {s.name}
              </span>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm ${s.isActive ? 'bg-positive/20 text-positive' : 'bg-surface-highlight text-text-tertiary'}`}>
                {s.isActive ? 'ACTIVE' : 'CLOSED'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1">
                  <ArrowUp size={8} className="text-positive" /> High
                </span>
                <span className="text-[10px] font-mono text-text-primary">
                  {s.high ? formatPrice(s.high) : '---'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1">
                  <ArrowDown size={8} className="text-negative" /> Low
                </span>
                <span className="text-[10px] font-mono text-text-primary">
                  {s.low ? formatPrice(s.low) : '---'}
                </span>
              </div>
            </div>

            {s.isActive && s.high && s.low && (
              <div className="mt-2 h-1 w-full bg-surface-highlight rounded-full overflow-hidden relative">
                {/* Visual representation of where current price is within session range */}
                <div 
                  className="absolute h-full bg-accent transition-all duration-500"
                  style={{ 
                    left: `${Math.max(0, Math.min(100, ((tick.price - s.low) / (s.high - s.low)) * 100))}%`,
                    width: '2px'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}