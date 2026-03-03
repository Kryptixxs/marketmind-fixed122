import { OHLCV } from './marketdata/types';
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
  if (history.length <= period) return 0;
  let trSum = 0;
  for (let i = history.length - period; i < history.length; i++) {
    const high = history[i].high;
    const low = history[i].low;
    const prevClose = history[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }
  return trSum / period;
}

function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = data[data.length - period];
  for (let i = data.length - period + 1; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
  }
  return ema;
}

export function generateTradeSetup(history: OHLCV[]): TradeSetup {
  if (!history || history.length < 50) {
    return {
      signal: 'NEUTRAL', confidence: 0, color: 'text-text-secondary',
      entryZone: [0, 0], stopLoss: 0, takeProfit1: 0, takeProfit2: 0, riskReward: 0,
      support: [], resistance: [], warnings: ['Insufficient historical data for calculation.'],
      context: { trend: 'Ranging', rsi: 50, atr: 0, structure: 'Unknown' }
    };
  }

  const closes = history.map(h => h.close);
  const currentPrice = closes[closes.length - 1];
  
  // 1. Technical Indicators
  const rsi = calculateRSI(closes);
  const atr = calculateATR(history);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const sma200 = closes.length >= 200 ? closes.slice(-200).reduce((a, b) => a + b, 0) / 200 : closes.slice(-50).reduce((a, b) => a + b, 0) / 50;

  // 2. SMC & Liquidity (Reusing your tech-math)
  const { swingHighs, swingLows } = findSwingPoints(history, 5, 5); // Wider window for major levels
  const fvgs = findUnmitigatedFVGs(history);

  // Extract Major Support / Resistance from unmitigated swings
  const resistanceLevels = swingHighs.filter(h => !h.mitigated && h.price > currentPrice).map(h => h.price).sort((a, b) => a - b);
  const supportLevels = swingLows.filter(l => !l.mitigated && l.price < currentPrice).map(l => l.price).sort((a, b) => b - a); // Descending (closest first)

  // 3. Scoring System for Bias
  let score = 0;
  const warnings: string[] = [];

  // Trend Alignment
  if (ema9 > ema21) score += 2; else score -= 2;
  if (currentPrice > sma200) score += 1; else score -= 1;
  const trend = score > 0 ? 'Bullish' : score < 0 ? 'Bearish' : 'Ranging';

  // Momentum
  if (rsi < 30) { score += 2; warnings.push("RSI Extremely Oversold (Reversal Risk)"); }
  else if (rsi > 70) { score -= 2; warnings.push("RSI Extremely Overbought (Reversal Risk)"); }

  // FVG Proximity
  const activeBullFVG = fvgs.find(f => f.type === 'BISI' && currentPrice >= f.bottom && currentPrice <= f.top + atr);
  const activeBearFVG = fvgs.find(f => f.type === 'SIBI' && currentPrice <= f.top && currentPrice >= f.bottom - atr);

  if (activeBullFVG) { score += 3; warnings.push(`Price testing Bullish FVG (${activeBullFVG.bottom.toFixed(2)} - ${activeBullFVG.top.toFixed(2)})`); }
  if (activeBearFVG) { score -= 3; warnings.push(`Price testing Bearish FVG (${activeBearFVG.bottom.toFixed(2)} - ${activeBearFVG.top.toFixed(2)})`); }

  // Determine Signal
  let signal: TradeSetup['signal'] = 'NEUTRAL';
  let color = 'text-text-secondary';
  let confidence = 50 + Math.abs(score) * 5;

  if (score >= 5) { signal = 'STRONG BUY'; color = 'text-positive'; }
  else if (score >= 2) { signal = 'BUY'; color = 'text-positive'; }
  else if (score <= -5) { signal = 'STRONG SELL'; color = 'text-negative'; }
  else if (score <= -2) { signal = 'SELL'; color = 'text-negative'; }

  // 4. Calculate Dynamic SL, TP, and Entries
  let entryZone: [number, number] = [currentPrice, currentPrice];
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let riskReward = 0;

  if (signal.includes('BUY')) {
    // Buy Setup
    const nearestSupport = supportLevels.length > 0 ? supportLevels[0] : currentPrice - (atr * 2);
    entryZone = [currentPrice, Math.max(nearestSupport, currentPrice - atr)];
    stopLoss = nearestSupport - (atr * 0.5); // Provide breathing room below structure
    
    takeProfit1 = resistanceLevels.length > 0 ? resistanceLevels[0] : currentPrice + (atr * 2);
    takeProfit2 = resistanceLevels.length > 1 ? resistanceLevels[1] : takeProfit1 + (atr * 2);

    // Validate risk
    const risk = currentPrice - stopLoss;
    const reward = takeProfit1 - currentPrice;
    riskReward = risk > 0 ? reward / risk : 0;

    if (riskReward < 1) warnings.push("Poor Risk/Reward to primary target.");
  } else if (signal.includes('SELL')) {
    // Sell Setup
    const nearestRes = resistanceLevels.length > 0 ? resistanceLevels[0] : currentPrice + (atr * 2);
    entryZone = [currentPrice, Math.min(nearestRes, currentPrice + atr)];
    stopLoss = nearestRes + (atr * 0.5);
    
    takeProfit1 = supportLevels.length > 0 ? supportLevels[0] : currentPrice - (atr * 2);
    takeProfit2 = supportLevels.length > 1 ? supportLevels[1] : takeProfit1 - (atr * 2);

    const risk = stopLoss - currentPrice;
    const reward = currentPrice - takeProfit1;
    riskReward = risk > 0 ? reward / risk : 0;

    if (riskReward < 1) warnings.push("Poor Risk/Reward to primary target.");
  }

  // Add structural warnings
  if (currentPrice < ema21 && signal.includes('BUY')) warnings.push("Counter-trend long (Price below EMA21).");
  if (currentPrice > ema21 && signal.includes('SELL')) warnings.push("Counter-trend short (Price above EMA21).");

  return {
    signal,
    confidence: Math.min(confidence, 99), // Cap at 99%
    color,
    entryZone,
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
      structure: score > 0 ? 'Expansion (Bull)' : score < 0 ? 'Expansion (Bear)' : 'Consolidation'
    }
  };
}