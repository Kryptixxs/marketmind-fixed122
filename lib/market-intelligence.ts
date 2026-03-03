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
  correlations: {
    asset: string;
    coefficient: number;
    impact: 'Positive' | 'Negative' | 'Neutral';
  }[];
}

export function analyzeMarketState(tick: Tick, allMarketData: Record<string, Tick>): MarketInsight {
  const { price, changePercent, history = [] } = tick;
  
  // 1. Advanced Technical Indicators
  const ema9 = history.length >= 9 ? history.slice(-9).reduce((a, b) => a + b, 0) / 9 : price;
  const ema21 = history.length >= 21 ? history.slice(-21).reduce((a, b) => a + b, 0) / 21 : price;
  
  // RSI Approximation
  let rsi = 50;
  if (history.length >= 14) {
    let gains = 0, losses = 0;
    for (let i = history.length - 14; i < history.length; i++) {
      const diff = history[i] - history[i-1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rs = gains / (losses || 1);
    rsi = 100 - (100 / (1 + rs));
  }

  // ATR Approximation (Volatility)
  const atr = price * (Math.abs(changePercent) / 100) * 1.5;

  // 2. ICT / SMC Logic (Market Structure & Liquidity)
  let structure: MarketInsight['structure'] = 'Ranging';
  const orderBlocks: MarketInsight['levels']['orderBlocks'] = [];
  const fvgs: MarketInsight['levels']['fvgs'] = [];

  if (history.length > 10) {
    const recent = history.slice(-10);
    const highs = recent.filter((v, i) => i > 0 && i < recent.length - 1 && v > recent[i-1] && v > recent[i+1]);
    const lows = recent.filter((v, i) => i > 0 && i < recent.length - 1 && v < recent[i-1] && v < recent[i+1]);

    // Detect BOS/MSS
    if (price > Math.max(...recent.slice(0, 5))) structure = 'BOS';
    else if (price < Math.min(...recent.slice(0, 5))) structure = 'MSS';

    // Detect Order Blocks (Last down candle before up move, etc.)
    if (structure === 'BOS') orderBlocks.push({ price: Math.min(...lows), type: 'Bullish' });
    if (structure === 'MSS') orderBlocks.push({ price: Math.max(...highs), type: 'Bearish' });

    // Detect FVGs (Gaps in history)
    for (let i = 2; i < history.length; i++) {
      if (history[i] > history[i-2] * 1.005) {
        fvgs.push({ bottom: history[i-2], top: history[i] });
      }
    }
  }

  // 3. Macro Correlations
  const correlations: MarketInsight['correlations'] = [];
  const dxy = allMarketData['DX-Y.NYB'] || allMarketData['EURUSD=X']; // Proxy if DXY missing
  if (dxy) {
    correlations.push({ 
      asset: 'DXY', 
      coefficient: -0.85, 
      impact: dxy.changePercent > 0 ? 'Negative' : 'Positive' 
    });
  }
  
  const gold = allMarketData['GC=F'];
  if (gold) {
    correlations.push({ 
      asset: 'GOLD', 
      coefficient: 0.65, 
      impact: gold.changePercent > 0 ? 'Positive' : 'Negative' 
    });
  }

  // 4. Sentiment & Strength Reasoning
  const technicalBias = (price > ema9 ? 1 : -1) + (ema9 > ema21 ? 1 : -1) + (rsi < 30 ? 1 : rsi > 70 ? -1 : 0);
  const sentiment = technicalBias > 0 ? 'Bullish' : technicalBias < 0 ? 'Bearish' : 'Neutral';
  const strength = Math.min(Math.abs(technicalBias) * 20 + Math.abs(changePercent) * 10 + 40, 99);

  const analysis = `${tick.symbol} is trading ${price > ema9 ? 'above' : 'below'} the 9 EMA (${ema9.toFixed(2)}) with ${sentiment} momentum. ${structure === 'BOS' ? 'Bullish expansion confirmed via BOS.' : structure === 'MSS' ? 'Bearish shift detected via MSS.' : 'Price is currently range-bound.'} Immediate liquidity sits at ${price * 1.002 > ema9 ? 'Premium' : 'Discount'} levels.`;

  return {
    strength: Math.round(strength),
    sentiment,
    analysis,
    structure,
    levels: { 
      support: [price * 0.992, price * 0.985], 
      resistance: [price * 1.008, price * 1.015],
      orderBlocks,
      fvgs: fvgs.slice(-2)
    },
    indicators: {
      rsi,
      ema9,
      ema21,
      atr,
      volumeProfile: Array.from({ length: 5 }, (_, i) => ({ price: price * (0.99 + i * 0.005), volume: Math.random() * 1000 }))
    },
    correlations
  };
}

export function getMacroRegime(vix: number, dxy: number, yields: number) {
  let score = 50;
  if (vix < 15) score += 20; else if (vix > 25) score -= 30;
  if (dxy < 102) score += 15; else if (dxy > 105) score -= 15;
  if (yields < 4.0) score += 10; else if (yields > 4.5) score -= 20;

  const regime = score > 65 ? 'Risk-On' : score < 35 ? 'Risk-Off' : 'Neutral';
  const narrative = score > 65 ? 'Liquidity Expansion' : score < 35 ? 'Monetary Tightening' : 'Range Compression';

  return { regime, narrative, score: Math.max(0, Math.min(100, score)) };
}