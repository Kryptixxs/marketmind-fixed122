import { MarketSnapshot, ConfluenceResult } from './types';
import { findUnmitigatedFVGs, findSwingPoints } from '@/lib/tech-math';

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
      const hc = Math.abs(highs[i] - (closes[i - 1] || closes[i]));
      const lc = Math.abs(lows[i] - (closes[i - 1] || closes[i]));
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

    // Core indicators
    const ema9 = this.EMA(closes, 9);
    const ema20 = this.EMA(closes, 20);
    const sma200 = this.SMA(closes, 200);
    const rsi14 = this.RSI(closes, 14);
    const atr14 = this.ATR(highs, lows, closes, 14);
    const avgVol20 = this.SMA(volumes, 20);

    // Bollinger Bands
    const sma20 = this.SMA(closes, 20);
    const variance = closes.slice(-20).reduce((a, b) => a + Math.pow(b - sma20, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    const bbUpper = sma20 + (stdDev * 2);
    const bbLower = sma20 - (stdDev * 2);

    // SMC & Liquidity
    const { swingHighs, swingLows } = findSwingPoints(quotes);
    const fvgs = findUnmitigatedFVGs(quotes);
    
    const recentHigh = Math.max(...highs.slice(-20, -1));
    const recentLow = Math.min(...lows.slice(-20, -1));
    
    const isLiquiditySweepHigh = last.high > recentHigh && last.close < recentHigh;
    const isLiquiditySweepLow = last.low < recentLow && last.close > recentLow;

    const results: ConfluenceResult[] = [
      { id: 'MS_HTF', label: 'HTF Trend Alignment', category: 'STRUCTURE', isActive: last.close > sma200, score: 85, description: 'Price is above 200 SMA indicating macro uptrend.' },
      { id: 'VOL_CLIMAX', label: 'Volume Climax', category: 'VOLUME', isActive: last.volume > avgVol20 * 2.5, score: 95, description: 'Massive institutional participation detected.' },
      { id: 'FUN_MAC', label: 'Macro Tailwind', category: 'FUNDAMENTAL', isActive: this.newsSentiment >= 30, score: 90, description: 'Recent news headlines are highly bullish.' },
      
      // New Confluences
      { 
        id: 'BB_REV_UPPER', 
        label: 'Mean Reversion (Upper)', 
        category: 'QUANT', 
        isActive: last.close > bbUpper, 
        score: 75, 
        description: 'Price is trading outside the 2-StdDev upper Bollinger Band.' 
      },
      { 
        id: 'BB_REV_LOWER', 
        label: 'Mean Reversion (Lower)', 
        category: 'QUANT', 
        isActive: last.close < bbLower, 
        score: 75, 
        description: 'Price is trading outside the 2-StdDev lower Bollinger Band.' 
      },
      { 
        id: 'SMC_SWEEP_H', 
        label: 'Liquidity Sweep (High)', 
        category: 'SMC', 
        isActive: isLiquiditySweepHigh, 
        score: 92, 
        description: 'Price swept buy-side liquidity and rejected (Turtle Soup).' 
      },
      { 
        id: 'SMC_SWEEP_L', 
        label: 'Liquidity Sweep (Low)', 
        category: 'SMC', 
        isActive: isLiquiditySweepLow, 
        score: 92, 
        description: 'Price swept sell-side liquidity and rejected (Turtle Soup).' 
      },
      { 
        id: 'MOM_RSI_OB', 
        label: 'RSI Overbought', 
        category: 'MOMENTUM', 
        isActive: rsi14 > 70, 
        score: 70, 
        description: `RSI is in overextended territory (${rsi14.toFixed(1)}).` 
      },
      { 
        id: 'MOM_RSI_OS', 
        label: 'RSI Oversold', 
        category: 'MOMENTUM', 
        isActive: rsi14 < 30, 
        score: 70, 
        description: `RSI is in oversold territory (${rsi14.toFixed(1)}).` 
      },
      { 
        id: 'SMC_FVG_BULL', 
        label: 'Bullish Imbalance', 
        category: 'SMC', 
        isActive: fvgs.some(f => f.type === 'BISI' && last.close > f.bottom && last.close < f.top), 
        score: 88, 
        description: 'Price is currently trading within a bullish Fair Value Gap.' 
      },
      { 
        id: 'SMC_FVG_BEAR', 
        label: 'Bearish Imbalance', 
        category: 'SMC', 
        isActive: fvgs.some(f => f.type === 'SIBI' && last.close < f.top && last.close > f.bottom), 
        score: 88, 
        description: 'Price is currently trading within a bearish Fair Value Gap.' 
      }
    ];

    return results;
  }
}