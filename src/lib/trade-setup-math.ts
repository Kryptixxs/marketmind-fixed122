import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from './tech-math';

export interface TradeSetup {
  signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  confidence: number;
  color: string;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  support: number[];
  resistance: number[];
  warnings: string[];
  context: {
    trend: 'Bullish' | 'Bearish' | 'Ranging';
    rsi: number;
    atr: number;
    structure: string;
  };
}

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateATR(history: OHLCV[], period = 14): number {
  const p = Math.min(period, history.length - 1);
  if (p <= 0) return history[history.length - 1].close * 0.005; // 0.5% default fallback
  
  let trSum = 0;
  for (let i = history.length - p; i < history.length; i++) {
    const high = history[i].high;
    const low = history[i].low;
    const prevClose = history[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }
  return trSum / p;
}

function calculateEMA(data: number[], period: number): number {
  const p = Math.min(period, data.length);
  if (p === 0) return 0;
  const k = 2 / (p + 1);
  let ema = data[data.length - p];
  for (let i = data.length - p + 1; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
  }
  return ema;
}

export function generateTradeSetup(history: OHLCV[]): TradeSetup {
  if (!history || history.length < 15) {
    return {
      signal: 'NEUTRAL', confidence: 0, color: 'text-text-secondary',
      entryZone: [0, 0], stopLoss: 0, takeProfit1: 0, takeProfit2: 0, riskReward: 0,
      support: [], resistance: [], warnings: ['Warming up: Insufficient historical data for full matrix calculation.'],
      context: { trend: 'Ranging', rsi: 50, atr: 0, structure: 'Unknown' }
    };
  }

  const closes = history.map(h => h.close);
  const currentPrice = closes[closes.length - 1];
  
  const rsi = calculateRSI(closes, Math.min(14, closes.length - 1));
  const atr = calculateATR(history, Math.min(14, history.length - 1));
  const ema9 = calculateEMA(closes, Math.min(9, closes.length));
  const ema21 = calculateEMA(closes, Math.min(21, closes.length));
  
  const smaWindow = Math.min(200, closes.length);
  const sma200 = closes.slice(-smaWindow).reduce((a, b) => a + b, 0) / smaWindow;

  const windowSize = history.length < 50 ? 2 : 5; 
  const { swingHighs, swingLows } = findSwingPoints(history, windowSize, windowSize);
  const fvgs = findUnmitigatedFVGs(history);

  let resistanceLevels = swingHighs.filter(h => !h.mitigated && h.price > currentPrice).map(h => h.price).sort((a, b) => a - b);
  let supportLevels = swingLows.filter(l => !l.mitigated && l.price < currentPrice).map(l => l.price).sort((a, b) => b - a);

  if (resistanceLevels.length === 0) {
    resistanceLevels.push(currentPrice + (atr * 1.5), currentPrice + (atr * 3.0), currentPrice + (atr * 5.0));
  }
  if (supportLevels.length === 0) {
    supportLevels.push(currentPrice - (atr * 1.5), currentPrice - (atr * 3.0), currentPrice - (atr * 5.0));
  }

  let score = 0;
  const warnings: string[] = [];

  if (ema9 > ema21) score += 2; else score -= 2;
  if (currentPrice > sma200) score += 1; else score -= 1;
  const trend = score > 0 ? 'Bullish' : score < 0 ? 'Bearish' : 'Ranging';

  if (rsi < 30) { score += 2; warnings.push("RSI Oversold: Reversal Risk Elevated"); }
  else if (rsi > 70) { score -= 2; warnings.push("RSI Overbought: Reversal Risk Elevated"); }

  const activeBullFVG = fvgs.find(f => f.type === 'BISI' && currentPrice >= f.bottom && currentPrice <= f.top + atr);
  const activeBearFVG = fvgs.find(f => f.type === 'SIBI' && currentPrice <= f.top && currentPrice >= f.bottom - atr);

  if (activeBullFVG) { score += 3; warnings.push(`Testing Bullish FVG: ${activeBullFVG.bottom.toFixed(2)} - ${activeBullFVG.top.toFixed(2)}`); }
  if (activeBearFVG) { score -= 3; warnings.push(`Testing Bearish FVG: ${activeBearFVG.bottom.toFixed(2)} - ${activeBearFVG.top.toFixed(2)}`); }

  let signal: TradeSetup['signal'] = 'NEUTRAL';
  let color = 'text-text-secondary';
  let confidence = 50 + Math.abs(score) * 5;

  if (score >= 5) { signal = 'STRONG BUY'; color = 'text-positive'; }
  else if (score >= 2) { signal = 'BUY'; color = 'text-positive'; }
  else if (score <= -5) { signal = 'STRONG SELL'; color = 'text-negative'; }
  else if (score <= -2) { signal = 'SELL'; color = 'text-negative'; }

  let entryZone: [number, number] = [currentPrice, currentPrice];
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let riskReward = 0;

  const MIN_RR = 2.1; // Target slightly above 2.0 for safety

  if (signal.includes('BUY')) {
    const nearestSupport = supportLevels[0];
    stopLoss = nearestSupport - (atr * 0.5);
    const risk = currentPrice - stopLoss;
    
    // Enforce RR > 2.0
    const requiredReward = risk * MIN_RR;
    const structuralTP = resistanceLevels[0];
    
    takeProfit1 = Math.max(structuralTP, currentPrice + requiredReward);
    takeProfit2 = takeProfit1 + (atr * 1.5);
    
    if (takeProfit1 > structuralTP) {
      warnings.push("Extended Target: TP1 projected beyond immediate resistance to maintain 2.0+ RR.");
    }

    entryZone = [currentPrice, Math.max(nearestSupport, currentPrice - (risk * 0.2))];
    riskReward = (takeProfit1 - currentPrice) / risk;

  } else if (signal.includes('SELL')) {
    const nearestRes = resistanceLevels[0];
    stopLoss = nearestRes + (atr * 0.5);
    const risk = stopLoss - currentPrice;
    
    // Enforce RR > 2.0
    const requiredReward = risk * MIN_RR;
    const structuralTP = supportLevels[0];
    
    takeProfit1 = Math.min(structuralTP, currentPrice - requiredReward);
    takeProfit2 = takeProfit1 - (atr * 1.5);

    if (takeProfit1 < structuralTP) {
      warnings.push("Extended Target: TP1 projected beyond immediate support to maintain 2.0+ RR.");
    }

    entryZone = [currentPrice, Math.min(nearestRes, currentPrice + (risk * 0.2))];
    riskReward = (currentPrice - takeProfit1) / risk;
  }

  if (currentPrice < ema21 && signal.includes('BUY')) warnings.push("Counter-trend long: Price below EMA21.");
  if (currentPrice > ema21 && signal.includes('SELL')) warnings.push("Counter-trend short: Price above EMA21.");

  return {
    signal,
    confidence: Math.min(confidence, 99),
    color,
    entryZone: [Math.min(...entryZone), Math.max(...entryZone)],
    stopLoss,
    takeProfit1,
    takeProfit2,
    riskReward,
    support: supportLevels.slice(0, 3),
    resistance: resistanceLevels.slice(0, 3),
    warnings,
    context: {
      trend,
      rsi,
      atr,
      structure: score > 0 ? 'Bullish Expansion' : score < 0 ? 'Bearish Expansion' : 'Consolidation'
    }
  };
}