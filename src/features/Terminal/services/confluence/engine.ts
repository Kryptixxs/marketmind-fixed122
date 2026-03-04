import { MarketSnapshot, ConfluenceResult } from './types';
import { findUnmitigatedFVGs } from '@/lib/tech-math';

export class ConfluenceEngine {
  private data: MarketSnapshot;
  private newsSentiment: number; // -100 to 100

  constructor(snapshot: MarketSnapshot, newsSentiment: number = 0) {
    this.data = snapshot;
    this.newsSentiment = newsSentiment;
  }

  // Technical Analysis Math Helpers
  private SMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    return data.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  private EMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    const k = 2 / (period + 1);
    let ema = data[data.length - period];
    for (let i = data.length - period + 1; i < data.length; i++) {
      ema = (data[i] - ema) * k + ema;
    }
    return ema;
  }

  private RSI(data: number[], period: number): number {
    if (data.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = (gains / period) / ((losses / period) || 1);
    return 100 - (100 / (1 + rs));
  }

  private ATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length <= period) return 0;
    let trSum = 0;
    for (let i = highs.length - period; i < highs.length; i++) {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      trSum += Math.max(hl, hc, lc);
    }
    return trSum / period;
  }

  public calculateAll(): ConfluenceResult[] {
    const quotes = this.data.quotes;
    if (!quotes || quotes.length < 50) return [];

    const closes = quotes.map(q => q.close);
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);
    const volumes = quotes.map(q => q.volume);

    const last = quotes[quotes.length - 1];
    const prev = quotes[quotes.length - 2];
    const prev2 = quotes[quotes.length - 3];

    // Core indicators
    const ema9 = this.EMA(closes, 9);
    const ema20 = this.EMA(closes, 20);
    const ema50 = this.EMA(closes, 50);
    const sma200 = this.SMA(closes, 200);

    const rsi14 = this.RSI(closes, 14);
    const atr14 = this.ATR(highs, lows, closes, 14);
    const avgVol20 = this.SMA(volumes, 20);

    const recentHigh20 = Math.max(...highs.slice(-21, -1));
    const recentLow20 = Math.min(...lows.slice(-21, -1));

    // Strict Candlestick Math
    const bodySize = Math.abs(last.close - last.open);
    const range = last.high - last.low;
    const upperWick = last.high - Math.max(last.open, last.close);
    const lowerWick = Math.min(last.open, last.close) - last.low;

    const isBullEngulf = last.close > prev.open && last.open < prev.close && last.close > prev.high;
    const isBearEngulf = last.close < prev.open && last.open > prev.close && last.close < prev.low;
    const isHammer = lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && range > atr14 * 0.8;
    const isShootingStar = upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && range > atr14 * 0.8;

    // Advanced SMC
    const fvgs = findUnmitigatedFVGs(quotes);
    const hasBullFVG = fvgs.some(f => f.type === 'BISI' && last.close > f.bottom && last.close < f.top + (atr14 * 0.5));
    const hasBearFVG = fvgs.some(f => f.type === 'SIBI' && last.close < f.top && last.close > f.bottom - (atr14 * 0.5));

    return [
      // === STRUCTURE ===
      { id: 'MS_HTF', label: 'Higher timeframe trend alignment', category: 'STRUCTURE', isActive: last.close > sma200, score: 85, description: 'Price is above 200 SMA indicating macro uptrend.' },
      { id: 'MS_MSS', label: 'Market structure shift (MSS)', category: 'STRUCTURE', isActive: last.close < recentLow20, score: 95, description: 'Price closed below recent 20-period swing low.' },

      // === SMC ===
      { id: 'SMC_BISI', label: 'Active BISI (Demand FVG)', category: 'SMC', isActive: hasBullFVG, score: 90, description: 'Price is respecting an unmitigated bullish price imbalance.' },
      { id: 'SMC_SIBI', label: 'Active SIBI (Supply FVG)', category: 'SMC', isActive: hasBearFVG, score: 90, description: 'Price is rejecting an unmitigated bearish price imbalance.' },
      { id: 'SMC_OTE', label: 'Optimal trade entry (OTE 62–79%)', category: 'SMC', isActive: last.close >= recentLow20 + (recentHigh20 - recentLow20) * 0.62 && last.close <= recentLow20 + (recentHigh20 - recentLow20) * 0.79, score: 95, description: 'Deep retracement into algorithmic killzone.' },

      // === CANDLES ===
      { id: 'CAN_BULL_ENG', label: 'True Bullish Engulfing', category: 'CANDLE', isActive: isBullEngulf, score: 85, description: 'Body fully engulfs prior red candle AND takes its high.' },
      { id: 'CAN_BEAR_ENG', label: 'True Bearish Engulfing', category: 'CANDLE', isActive: isBearEngulf, score: 85, description: 'Body fully engulfs prior green candle AND takes its low.' },
      { id: 'CAN_HAM', label: 'Hammer Rejection', category: 'CANDLE', isActive: isHammer, score: 80, description: 'Long wick rejecting lower prices with high confidence.' },
      { id: 'CAN_STAR', label: 'Shooting Star Rejection', category: 'CANDLE', isActive: isShootingStar, score: 80, description: 'Aggressive selling at the highs.' },

      // === MOMENTUM & VOL ===
      { id: 'MOM_RSI_OS', label: 'RSI oversold', category: 'MOMENTUM', isActive: rsi14 < 30, score: 80, description: `RSI reading severely depressed (${rsi14.toFixed(1)}).` },
      { id: 'MOM_RSI_OB', label: 'RSI overbought', category: 'MOMENTUM', isActive: rsi14 > 70, score: 80, description: `RSI reading highly extended (${rsi14.toFixed(1)}).` },
      { id: 'VOL_CLIMAX', label: 'Volume climax', category: 'VOLUME', isActive: last.volume > avgVol20 * 3, score: 95, description: 'Massive institutional participation (>3x avg).' },

      // === FUNDAMENTAL / NEWS (Injected dynamically) ===
      { id: 'FUN_MAC', label: 'Macro/News Tailwind', category: 'FUNDAMENTAL', isActive: this.newsSentiment >= 30, score: 90, description: 'Recent news headlines are highly bullish, providing a fundamental tailwind.' },
      { id: 'FUN_HEAD', label: 'Macro/News Headwind', category: 'FUNDAMENTAL', isActive: this.newsSentiment <= -30, score: 90, description: 'Recent news headlines are highly bearish, creating heavy selling pressure.' }
    ];
  }
}