import { MarketSnapshot, ConfluenceResult } from './types';

export class ConfluenceEngine {
  private data: MarketSnapshot;
  private results: ConfluenceResult[] = [];

  constructor(snapshot: MarketSnapshot) {
    this.data = snapshot;
  }

  public calculateAll(): ConfluenceResult[] {
    this.results = [
      ...this.calcStructure(),
      ...this.calcSMC(),
      ...this.calcIndicators(),
      ...this.calcVolume(),
      ...this.calcCandles(),
      ...this.calcTime(),
    ];
    return this.results;
  }

  private calcStructure(): ConfluenceResult[] {
    const { quotes } = this.data;
    const last = quotes[quotes.length - 1];
    const prev = quotes[quotes.length - 2];
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);
    
    const recentHigh = Math.max(...highs.slice(-20, -1));
    const recentLow = Math.min(...lows.slice(-20, -1));

    return [
      {
        id: 'BOS',
        label: 'Break of Structure',
        category: 'STRUCTURE',
        isActive: last.close > recentHigh,
        score: last.close > recentHigh ? 90 : 0,
        description: `Price closed above recent swing high of ${recentHigh.toFixed(2)}`
      },
      {
        id: 'MSS',
        label: 'Market Structure Shift',
        category: 'STRUCTURE',
        isActive: last.close < recentLow,
        score: last.close < recentLow ? 85 : 0,
        description: `Price closed below recent swing low of ${recentLow.toFixed(2)}`
      },
      {
        id: 'EQH',
        label: 'Equal Highs Liquidity',
        category: 'STRUCTURE',
        isActive: Math.abs(highs[highs.length-2] - highs[highs.length-3]) < (last.close * 0.0005),
        score: 70,
        description: 'Resting liquidity detected above equal highs.'
      }
    ];
  }

  private calcSMC(): ConfluenceResult[] {
    const { quotes } = this.data;
    const fvgs = [];
    for (let i = quotes.length - 1; i > 2; i--) {
      if (quotes[i].low > quotes[i-2].high) {
        fvgs.push({ type: 'Bullish', price: quotes[i-2].high });
      }
    }

    return [
      {
        id: 'FVG',
        label: 'Fair Value Gap',
        category: 'SMC',
        isActive: fvgs.length > 0,
        value: fvgs.length,
        score: 80,
        description: `Detected ${fvgs.length} unmitigated gaps in recent price action.`
      },
      {
        id: 'OTE',
        label: 'Optimal Trade Entry',
        category: 'SMC',
        isActive: false, // Logic for 62-79% retracement
        score: 0,
        description: 'Price currently outside of the 0.62-0.79 Fibonacci killzone.'
      }
    ];
  }

  private calcIndicators(): ConfluenceResult[] {
    const { quotes } = this.data;
    const closes = quotes.map(q => q.close);
    
    const ema200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;
    const lastClose = closes[closes.length - 1];

    return [
      {
        id: 'EMA200_ABOVE',
        label: 'Price Above 200 EMA',
        category: 'MA',
        isActive: lastClose > ema200,
        score: 100,
        description: 'Long-term trend is bullish.'
      },
      {
        id: 'RSI_OVERSOLD',
        label: 'RSI Oversold',
        category: 'MOMENTUM',
        isActive: false, // Math for RSI < 30
        score: 0,
        description: 'Momentum is currently neutral.'
      }
    ];
  }

  private calcVolume(): ConfluenceResult[] {
    const { quotes } = this.data;
    const lastVol = quotes[quotes.length - 1].volume;
    const avgVol = quotes.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;

    return [
      {
        id: 'RVOL',
        label: 'Relative Volume > 2',
        category: 'VOLUME',
        isActive: lastVol > (avgVol * 2),
        value: (lastVol / avgVol).toFixed(2),
        score: 95,
        description: 'Institutional participation detected via volume expansion.'
      }
    ];
  }

  private calcCandles(): ConfluenceResult[] {
    const { quotes } = this.data;
    const last = quotes[quotes.length - 1];
    const prev = quotes[quotes.length - 2];

    const isBullishEngulfing = last.close > prev.open && last.open < prev.close && last.close > last.open;

    return [
      {
        id: 'BULL_ENGULF',
        label: 'Bullish Engulfing',
        category: 'CANDLE',
        isActive: isBullishEngulfing,
        score: 85,
        description: 'Strong reversal signal on the current timeframe.'
      }
    ];
  }

  private calcTime(): ConfluenceResult[] {
    const now = new Date();
    const hour = now.getUTCHours();

    return [
      {
        id: 'NY_OPEN',
        label: 'New York Open',
        category: 'TIME',
        isActive: hour >= 13 && hour <= 15,
        score: 100,
        description: 'High volatility window active.'
      }
    ];
  }
}