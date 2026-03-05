'use client';

import React, { useState, useEffect } from 'react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

const CONTRACTS = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD'];
const LABELS: Record<string, string> = {
  'NAS100': 'NQ',
  'SPX500': 'ES',
  'US30': 'YM',
  'CRUDE': 'CL',
  'GOLD': 'GC'
};

interface MockMetrics {
  volume: string;
  oi: string;
  vwap: string;
  atr: string;
  range: string;
}

export function FuturesContractMonitor({ activeSymbol, onSymbolChange }: { activeSymbol: string, onSymbolChange: (s: string) => void }) {
  const { data } = useMarketData(CONTRACTS);
  const [mockMetrics, setMockMetrics] = useState<Record<string, MockMetrics>>({});

  useEffect(() => {
    const metrics: Record<string, MockMetrics> = {};
    CONTRACTS.forEach(sym => {
      metrics[sym] = {
        volume: (Math.random() * 500 + 200).toFixed(1) + 'K',
        oi: (Math.random() * 2 + 1).toFixed(1) + 'M',
        vwap: '---',
        atr: (Math.random() * 20 + 10).toFixed(2),
        range: (Math.random() * 50 + 30).toFixed(0) + ' pts'
      };
    });
    setMockMetrics(metrics);
  }, []);

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      <div className="futures-grid-header grid grid-cols-8 gap-2">
        <span>Contract</span>
        <span className="text-right">Last</span>
        <span className="text-right">Bid</span>
        <span className="text-right">Ask</span>
        <span className="text-right">Volume</span>
        <span className="text-right">VWAP</span>
        <span className="text-right">ATR</span>
        <span className="text-right">Range</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {CONTRACTS.map(sym => {
          const tick = data[sym];
          const metrics = mockMetrics[sym] || { volume: '---', oi: '---', vwap: '---', atr: '---', range: '---' };
          const label = LABELS[sym] || sym;
          
          return (
            <div 
              key={sym}
              onClick={() => onSymbolChange(sym)}
              className={`grid grid-cols-8 gap-2 futures-cell cursor-pointer hover:bg-white/5 transition-colors ${activeSymbol === sym ? 'bg-accent/10 border-l-2 border-l-accent' : ''}`}
            >
              <span className="font-bold text-accent">{label}</span>
              <span className="text-right font-mono">{(tick?.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-right font-mono text-positive">{(tick?.price ? tick.price - 0.25 : 0).toFixed(2)}</span>
              <span className="text-right font-mono text-negative">{(tick?.price ? tick.price + 0.25 : 0).toFixed(2)}</span>
              <span className="text-right font-mono text-text-tertiary">{metrics.volume}</span>
              <span className="text-right font-mono text-text-tertiary">{(tick?.price ? tick.price - 2.5 : 0).toFixed(2)}</span>
              <span className="text-right font-mono text-text-tertiary">{metrics.atr}</span>
              <span className="text-right font-mono text-text-tertiary">{metrics.range}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}