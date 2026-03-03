'use client';

import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { ConfluenceEngine } from '@/lib/confluence/engine';
import { ConfluenceResult } from '@/lib/confluence/types';

export function ConfluenceScanner({ symbol }: { symbol: string }) {
  const [active, setActive] = useState<ConfluenceResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate engine run
    const engine = new ConfluenceEngine({
      symbol,
      interval: '15m',
      quotes: Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - i * 900000,
        open: 100, high: 105, low: 95, close: 102, volume: 1000
      }))
    });
    
    const results = engine.calculateAll().filter(r => r.isActive);
    setActive(results);
    setLoading(false);
  }, [symbol]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={14} className="animate-spin" /></div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Active Confluences</div>
        <span className="text-[8px] text-accent font-mono">{active.length} DETECTED</span>
      </div>
      
      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {active.map(res => (
          <div key={res.id} className="bg-accent/5 border border-accent/20 p-1.5 rounded-sm flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={10} className="text-positive" />
              <span className="text-[9px] font-bold text-text-primary uppercase">{res.label}</span>
            </div>
            <span className="text-[8px] font-mono text-accent">{res.score}%</span>
          </div>
        ))}
        {active.length === 0 && (
          <div className="h-full flex items-center justify-center text-[9px] text-text-tertiary italic">
            No high-probability confluences detected.
          </div>
        )}
      </div>
    </div>
  );
}