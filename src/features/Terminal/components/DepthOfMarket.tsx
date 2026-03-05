'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tick } from '@/features/MarketData/services/marketdata/types';

export function DepthOfMarket({ tick }: { tick?: Tick }) {
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    if (!tick) return;
    
    const price = tick.price;
    const step = 0.25; // Standard ES tick size
    const rows = 20;
    
    const newLevels = [];
    for (let i = rows; i >= -rows; i--) {
      const levelPrice = price + (i * step);
      const isAsk = i > 0;
      const isBid = i < 0;
      const isLast = i === 0;
      
      newLevels.push({
        price: levelPrice,
        size: Math.floor(Math.random() * 500 + 50),
        isAsk,
        isBid,
        isLast,
        aggression: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'buy' : 'sell') : null
      });
    }
    setLevels(newLevels);
  }, [tick?.price]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden border-r border-border">
      <div className="futures-grid-header grid grid-cols-4 gap-1">
        <span className="text-center">Size</span>
        <span className="text-center">Bid</span>
        <span className="text-center">Price</span>
        <span className="text-center">Ask</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {levels.map((l, i) => (
          <div key={i} className={`grid grid-cols-4 gap-1 text-[10px] font-mono border-b border-border/30 h-6 items-center ${l.isLast ? 'bg-accent/20' : ''}`}>
            <div className="text-right pr-2 text-text-tertiary">{l.size}</div>
            <div className={`text-center ${l.isBid ? 'bg-positive/10 text-positive font-bold' : ''}`}>
              {l.isBid ? l.size : ''}
            </div>
            <div className={`text-center font-bold ${l.isLast ? 'text-accent' : 'text-text-primary'}`}>
              {l.price.toFixed(2)}
            </div>
            <div className={`text-center ${l.isAsk ? 'bg-negative/10 text-negative font-bold' : ''}`}>
              {l.isAsk ? l.size : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="h-8 bg-surface border-t border-border flex items-center justify-around px-2">
        <button className="bg-positive text-background font-bold text-[10px] px-4 py-1 rounded-sm uppercase">Buy Mkt</button>
        <button className="bg-negative text-background font-bold text-[10px] px-4 py-1 rounded-sm uppercase">Sell Mkt</button>
      </div>
    </div>
  );
}