'use client';

import React from 'react';
import { Shield, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

export function RiskPanel() {
  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="futures-grid-header">Risk & Exposure Matrix</div>
      <div className="p-3 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-bold uppercase text-text-tertiary">Intraday PnL</span>
            <span className="text-lg font-mono font-bold text-positive">+$1,240.50</span>
          </div>
          <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
            <div className="h-full w-[65%] bg-positive" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Position Size</div>
            <div className="text-xs font-mono font-bold text-text-primary">4 Contracts</div>
          </div>
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Margin Used</div>
            <div className="text-xs font-mono font-bold text-warning">$48,200</div>
          </div>
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Max Drawdown</div>
            <div className="text-xs font-mono font-bold text-negative">-$450.00</div>
          </div>
          <div className="bg-background border border-border p-2 rounded-sm">
            <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Daily Limit</div>
            <div className="text-xs font-mono font-bold text-text-secondary">$5,000</div>
          </div>
        </div>

        <div className="mt-auto p-2 bg-warning/5 border border-warning/20 rounded-sm flex items-center gap-2">
          <Shield size={14} className="text-warning" />
          <span className="text-[9px] text-warning font-bold uppercase">Risk Status: Within Limits</span>
        </div>
      </div>
    </div>
  );
}