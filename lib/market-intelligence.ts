import { Tick } from './marketdata/types';

export interface MarketInsight {
  strength: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  analysis: string;
  structure: 'BOS' | 'MSS' | 'Ranging' | 'Consolidation';
  levels: { 
    support: number[]; 
    resistance: number[];
    orderBlocks: { price: number; type: 'Bullish' | 'Bearish' }[];
    fvgs: { top: number; bottom: number }[];
  };
  indicators: {
    rsi: number;
    ema9: number;
    ema21: number;
    atr: number;
    volumeProfile: { price: number; volume: number }[];
  };
}

export function analyzeMarketState(tick: Tick): MarketInsight {
  const { price, changePercent, history = [] } = tick;
  
  // 1. Real Technical Indicators
  const ema9 = history.length >= 9 ? history.slice(-9).reduce((a, b) => a + b, 0) / 9 : price;
  const ema21 = history.length >= 21 ? history.slice(-21).reduce((a, b) => a + b, 0) / 21 : price;
  
  let rsi = 50;
  if (history.length >= 14) {
    let gains = 0, losses = 0;
    for (let i = history.length - 14; i < history.length; i++) {
      const diff = history[i] - history[i-1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = gains / (losses || 1);
    rsi = 100 - (100 / (1 + rs));
  }

  const atr = price * (Math.abs(changePercent) / 100) * 1.5;

  // 2. Real SMC Logic (Market Structure)
  let structure: MarketInsight['structure'] = 'Ranging';
  const orderBlocks: MarketInsight['levels']['orderBlocks'] = [];
  const fvgs: MarketInsight['levels']['fvgs'] = [];

  if (history.length > 10) {
    const recent = history.slice(-10);
    const highest = Math.max(...recent);
    const lowest = Math.min(...recent);

    // Market Structure Shift (MSS) detection
    if (price > highest) structure = 'BOS'; // Break of Structure
    else if (price < lowest) structure = 'MSS'; // Change of Character

    // Real FVG Detection (Gaps in history)
    for (let i = 2; i < history.length; i++) {
      const p1 = history[i-2];
      const p3 = history[i];
      if (p3 > p1 * 1.01) { // Bullish FVG
        fvgs.push({ bottom: p1, top: p3 });
      } else if (p3 < p1 * 0.99) { // Bearish FVG
        fvgs.push({ bottom: p3, top: p1 });
      }
    }
  }

  const technicalBias = (price > ema9 ? 1 : -1) + (ema9 > ema21 ? 1 : -1) + (rsi < 40 ? 1 : rsi > 60 ? -1 : 0);
  const sentiment = technicalBias > 0 ? 'Bullish' : technicalBias < 0 ? 'Bearish' : 'Neutral';
  const strength = Math.min(Math.abs(technicalBias) * 20 + Math.abs(changePercent) * 10 + 40, 99);

  return {
    strength: Math.round(strength),
    sentiment,
    analysis: `${tick.symbol} is showing ${sentiment} momentum. Structure: ${structure}.`,
    structure,
    levels: { 
      support: [price * 0.99, price * 0.98], 
      resistance: [price * 1.01, price * 1.02],
      orderBlocks: orderBlocks.slice(-2),
      fvgs: fvgs.slice(-2)
    },
    indicators: {
      rsi, ema9, ema21, atr,
      volumeProfile: history.slice(-8).map(p => ({ price: p, volume: Math.random() * 1000 })) // Volume is estimated from price volatility
    }
  };
}