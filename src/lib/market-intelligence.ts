import { Tick } from '@/features/MarketData/services/marketdata/types';

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
    ema9: number;      // VWAP
    ema21: number;     // Keltner Middle
    atr: number;
    volumeProfile: { price: number; volume: number }[];
    vpaState: 'Climax' | 'Exhaustion' | 'Anomalous' | 'Normal';
  };
}

export function analyzeMarketState(tick: Tick): MarketInsight {
  const { price, changePercent, history: rawHistory = [] } = tick;

  const ohlcv = rawHistory.map((h: any) =>
    typeof h === 'number' ? { close: h, volume: 1000 } : { close: h.close || price, volume: h.volume || 1000 }
  );

  const closes = ohlcv.map(h => h.close);
  const volumes = ohlcv.map(h => h.volume);
  const currentVolume = volumes[volumes.length - 1] || 1000;

  // 1. VWAP (True Institutional Footing)
  let cumulativePrcVol = 0;
  let cumulativeVol = 0;
  for (let i = 0; i < closes.length; i++) {
    cumulativePrcVol += closes[i] * volumes[i];
    cumulativeVol += volumes[i];
  }
  const vwap = cumulativeVol > 0 ? cumulativePrcVol / cumulativeVol : price;

  // 2. Keltner Channels & ATR 
  const period = Math.min(closes.length, 20);
  let atr = price * (Math.abs(changePercent) / 100) * 1.5 || 0.01;
  let sma = price;
  let vpaState: MarketInsight['indicators']['vpaState'] = 'Normal';

  if (period >= 2) {
    // ATR Math
    let trSum = 0;
    const atrs = [];
    for (let i = closes.length - period; i < closes.length; i++) {
      const tr = Math.abs(closes[i] - (closes[i - 1] || closes[i]));
      trSum += tr;
      atrs.push(tr);
    }
    atr = trSum / period;

    // Keltner Math (EMA ± 2 ATR)
    const k = 2 / (period + 1);
    let ema = closes[closes.length - period];
    for (let i = closes.length - period + 1; i < closes.length; i++) {
      ema = (closes[i] - ema) * k + ema;
    }
    sma = ema; // Using EMA for Keltner Middle

    // Volume Price Analysis (VPA) Anomalies
    const recentVols = volumes.slice(-period);
    const avgVol = recentVols.reduce((a, b) => a + b, 0) / period;

    if (currentVolume > avgVol * 2.5) {
      vpaState = 'Climax';
    } else if (currentVolume < avgVol * 0.5) {
      vpaState = 'Exhaustion';
    }
  }

  const kcUpper = sma + (atr * 2);
  const kcLower = sma - (atr * 2);

  // 3. Volatility Compression (VCP)
  let isVCP = false;
  if (period >= 5) {
    const recentPriceRange = Math.max(...closes.slice(-5)) - Math.min(...closes.slice(-5));
    isVCP = recentPriceRange < (atr * 1.5);
  }

  // 4. Volume-Backed Market Structure
  let structure: MarketInsight['structure'] = 'Ranging';
  if (isVCP) structure = 'Consolidation';

  if (closes.length > 5) {
    const recent = closes.slice(-5);
    const highest = Math.max(...recent);
    const lowest = Math.min(...recent);

    // True Institutional Displacement (Break of structure with Volume Climax)
    if (price > highest && price > vwap && vpaState === 'Climax') structure = 'BOS';
    else if (price < lowest && price < vwap && vpaState === 'Climax') structure = 'MSS';
  }

  // 5. Scoring & NLP Generation
  let quantScore = 0;
  if (price > vwap) quantScore += 1;
  else quantScore -= 1;

  if (vpaState === 'Climax') {
    if (price > sma) quantScore += 2; // Buying climax
    else quantScore -= 2; // Selling climax
  }

  if (price > kcUpper) quantScore -= 2; // Statistical stretch
  else if (price < kcLower) quantScore += 2; // Capitulation

  const sentiment = quantScore > 0 ? 'Bullish' : quantScore < 0 ? 'Bearish' : 'Neutral';
  const strength = Math.min(Math.abs(quantScore) * 20 + (isVCP ? 20 : 0) + (vpaState === 'Climax' ? 15 : 0) + 40, 99);

  let analysisText = `${tick.symbol} is trading ${price > vwap ? 'above' : 'below'} VWAP indicating ${price > vwap ? 'institutional accumulation' : 'distribution'}. `;
  if (vpaState === 'Climax') analysisText += `Extreme Institutional Volume Climax detected. `;
  if (isVCP) analysisText += `Volatility has compressed tightly (VCP); an explosive expansion move is probable. `;
  if (price > kcUpper) analysisText += `Price is +2 ATR overextended (Mean Reversion Risk). `;
  else if (price < kcLower) analysisText += `Price has breached -2 ATR lower Keltner (Capitulation). `;

  return {
    strength: Math.round(strength),
    sentiment,
    analysis: analysisText,
    structure,
    levels: {
      support: [kcLower, vwap > price ? vwap : price - atr].map(n => Number(n.toFixed(2))),
      resistance: [kcUpper, vwap < price ? vwap : price + atr].map(n => Number(n.toFixed(2))),
      orderBlocks: [], // Handled by Alpha Agent
      fvgs: []      // Handled by Alpha Agent
    },
    indicators: {
      rsi: 50, // Deprecated in VPA
      ema9: Number(vwap.toFixed(2)), // Mapping to VWAP for backward UI compact
      ema21: Number(sma.toFixed(2)), // Mapping to Keltner Mid
      atr: Number(atr.toFixed(4)),
      volumeProfile: closes.slice(-8).map((p, i) => ({ price: p, volume: volumes[closes.length - 8 + i] || 1000 })),
      vpaState
    }
  };
}