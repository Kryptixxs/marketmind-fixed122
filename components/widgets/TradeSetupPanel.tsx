'use client';

import React, { useMemo } from 'react';
import { Target, Crosshair, AlertTriangle, TrendingUp, TrendingDown, Activity, ShieldCheck, Zap } from 'lucide-react';
import { Tick } from '@/lib/marketdata/types';
import { generateTradeSetup } from '@/lib/trade-setup-math';

export function TradeSetupPanel({ tick, timeframeLabel }: { tick?: Tick, timeframeLabel: string }) {
  const setup = useMemo(() => {
    if (!tick || !tick.history) return null;
    return generateTradeSetup(tick.history);
  }, [tick]);

  if (!tick || !setup) {
    return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Math Data</div>;
  }

  const isBuy = setup.signal.includes('BUY');
  const isSell = setup.signal.includes('SELL');

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="p-3 border-b border-border bg-surface shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">Algorithmic Setup</span>
        </div>
        <span className="text-[9px] font-mono text-text-tertiary">{timeframeLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        
        {/* SIGNAL HEADER */}
        <div className={`p-4 border rounded-sm flex flex-col items-center justify-center text-center relative overflow-hidden ${
          isBuy ? 'bg-positive/10 border-positive/30' : isSell ? 'bg-negative/10 border-negative/30' : 'bg-surface-highlight border-border'
        }`}>
          <div className="absolute top-2 right-2 text-[8px] font-mono opacity-60">CONF: {setup.confidence}%</div>
          <span className="text-[9px] uppercase font-bold text-text-tertiary mb-1">Execution Signal</span>
          <div className="flex items-center gap-2">
            {isBuy ? <TrendingUp size={24} className={setup.color} /> : isSell ? <TrendingDown size={24} className={setup.color} /> : <Activity size={24} className="text-text-secondary" />}
            <span className={`text-2xl font-black tracking-tighter ${setup.color}`}>{setup.signal}</span>
          </div>
          <span className="text-[10px] font-mono text-text-primary mt-2">Current Price: {tick.price.toFixed(2)}</span>
        </div>

        {/* TRADE PARAMETERS */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
            <Target size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Trade Parameters</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-surface-highlight/40 border border-border p-2 flex flex-col gap-1">
              <span className="text-[8px] text-text-tertiary uppercase font-bold">Entry Zone</span>
              <span className="text-[11px] font-mono text-text-primary">{setup.entryZone[0].toFixed(2)} - {setup.entryZone[1].toFixed(2)}</span>
            </div>
            <div className="bg-surface-highlight/40 border border-border p-2 flex flex-col gap-1">
              <span className="text-[8px] text-negative uppercase font-bold">Stop Loss (Invalidation)</span>
              <span className="text-[11px] font-mono text-negative font-bold">{setup.stopLoss > 0 ? setup.stopLoss.toFixed(2) : '---'}</span>
            </div>
            <div className="bg-surface-highlight/40 border border-border p-2 flex flex-col gap-1">
              <span className="text-[8px] text-positive uppercase font-bold">Take Profit 1</span>
              <span className="text-[11px] font-mono text-positive font-bold">{setup.takeProfit1 > 0 ? setup.takeProfit1.toFixed(2) : '---'}</span>
            </div>
            <div className="bg-surface-highlight/40 border border-border p-2 flex flex-col gap-1">
              <span className="text-[8px] text-positive uppercase font-bold">Take Profit 2</span>
              <span className="text-[11px] font-mono text-positive font-bold">{setup.takeProfit2 > 0 ? setup.takeProfit2.toFixed(2) : '---'}</span>
            </div>
          </div>
          
          {setup.riskReward > 0 && (
            <div className="bg-surface-highlight border border-border p-2 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-text-secondary">Risk / Reward Ratio</span>
              <span className={`text-[11px] font-mono font-bold ${setup.riskReward >= 2 ? 'text-positive' : setup.riskReward < 1 ? 'text-negative' : 'text-warning'}`}>
                1 : {setup.riskReward.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* KEY LEVELS */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
            <Crosshair size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Market Structure Levels</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold uppercase text-negative/70">Resistance (Supply)</span>
              {setup.resistance.length > 0 ? setup.resistance.map((r, i) => (
                <div key={i} className="px-2 py-1 bg-negative/5 border border-negative/20 text-[10px] font-mono text-text-secondary rounded-sm">
                  {r.toFixed(2)}
                </div>
              )) : <span className="text-[9px] text-text-tertiary italic">Blue sky</span>}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold uppercase text-positive/70">Support (Demand)</span>
              {setup.support.length > 0 ? setup.support.map((s, i) => (
                <div key={i} className="px-2 py-1 bg-positive/5 border border-positive/20 text-[10px] font-mono text-text-secondary rounded-sm">
                  {s.toFixed(2)}
                </div>
              )) : <span className="text-[9px] text-text-tertiary italic">Price discovery</span>}
            </div>
          </div>
        </div>

        {/* CONTEXT & WARNINGS */}
        <div className="pt-2 border-t border-border space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[8px] text-text-tertiary uppercase font-bold">Trend</div>
              <div className={`text-[10px] font-bold ${setup.context.trend === 'Bullish' ? 'text-positive' : setup.context.trend === 'Bearish' ? 'text-negative' : 'text-text-secondary'}`}>{setup.context.trend}</div>
            </div>
            <div>
              <div className="text-[8px] text-text-tertiary uppercase font-bold">RSI (14)</div>
              <div className="text-[10px] font-mono">{setup.context.rsi.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[8px] text-text-tertiary uppercase font-bold">ATR</div>
              <div className="text-[10px] font-mono">{setup.context.atr.toFixed(2)}</div>
            </div>
          </div>

          {setup.warnings.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-sm p-3 flex gap-2">
              <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-warning uppercase">Watch Out</span>
                <ul className="list-disc pl-3 text-[9px] text-text-primary space-y-1">
                  {setup.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}