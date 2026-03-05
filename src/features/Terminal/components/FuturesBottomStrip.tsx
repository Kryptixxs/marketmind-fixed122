'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Zap, AlertCircle } from 'lucide-react';

export function FuturesBottomStrip() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().split(' ')[4]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-8 border-t border-border bg-background flex items-center px-4 justify-between overflow-hidden">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">Next Release</span>
          <span className="text-[11px] font-bold font-mono text-accent">04:12:05 <span className="text-text-secondary text-[9px] ml-1">US NFP</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">Market Regime</span>
          <span className="text-[11px] font-bold uppercase text-positive">Trending Bullish</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">ES/NQ Spread</span>
          <span className="text-[11px] font-bold font-mono">3.42 <span className="text-negative text-[9px]">-0.04</span></span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase text-text-tertiary">Session</span>
          <span className="text-[10px] font-bold text-accent uppercase">New York Regular</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary">
          <Clock size={12} />
          <span>{time} UTC</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
      </div>
    </div>
  );
}