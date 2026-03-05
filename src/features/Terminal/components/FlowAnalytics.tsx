'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Zap, BarChart3, ShieldAlert } from 'lucide-react';

export function FlowAnalytics() {
  const [metrics, setMetrics] = useState({
    delta: 1240,
    cvd: 45200,
    imbalance: 1.4,
    blocks: 12
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        delta: prev.delta + (Math.random() * 200 - 100),
        cvd: prev.cvd + (Math.random() * 1000 - 500),
        imbalance: 1 + Math.random(),
        blocks: Math.floor(Math.random() * 20)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-surface border-b border-border">
      <div className="futures-grid-header">Flow Analytics // Real-time</div>
      <div className="p-3 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Session Delta</div>
            <div className={`text-sm font-mono font-bold ${metrics.delta > 0 ? 'text-positive' : 'text-negative'}`}>
              {metrics.delta > 0 ? '+' : ''}{metrics.delta.toFixed(0)}
            </div>
          </div>
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">CVD (Cumulative)</div>
            <div className="text-sm font-mono font-bold text-text-primary">
              {metrics.cvd.toLocaleString()}
            </div>
          </div>
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Order Imbalance</div>
            <div className="text-sm font-mono font-bold text-warning">
              {metrics.imbalance.toFixed(2)}x
            </div>
          </div>
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Block Trades</div>
            <div className="text-sm font-mono font-bold text-accent">
              {metrics.blocks}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[9px] font-bold uppercase text-text-tertiary mb-2">Recent Block Activity</div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center text-[10px] font-mono py-1 border-b border-border/30">
              <span className="text-text-secondary">14:02:12</span>
              <span className="text-negative font-bold">SELL 450</span>
              <span className="text-text-primary">5124.25</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}