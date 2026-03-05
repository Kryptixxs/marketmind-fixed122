import { MarketSnapshot, ConfluenceResult } from './types';
import { 
  findUnmitigatedFVGs, 
  findSwingPoints, 
  findOrderBlocks, 
  findVolumeImbalances,
  detectMarketStructure 
} from '@/lib/tech-math';

export class ConfluenceEngine {
  private data: MarketSnapshot;
  private newsSentiment: number;

  constructor(snapshot: MarketSnapshot, newsSentiment: number = 0) {
    this.data = snapshot;
    this.newsSentiment = newsSentiment;
  }

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

  public calculateAll(): ConfluenceResult[] {
    const quotes = this.data.quotes;
    if (!quotes || quotes.length < 50) return [];

    const last = quotes[quotes.length - 1];
    const closes = quotes.map(q => q.close);
    const volumes = quotes.map(q => q.volume);

    // Indicators
    const sma200 = this.SMA(closes, 200);
    const avgVol20 = this.SMA(volumes, 20);

    // ICT Concepts
    const obs = findOrderBlocks(quotes);
    const vis = findVolumeImbalances(quotes);
    const fvgs = findUnmitigatedFVGs(quotes);
    const structure = detectMarketStructure(quotes);
    const { swingHighs, swingLows } = findSwingPoints(quotes);

    const results: ConfluenceResult[] = [
      // Trend & Volume
      { id: 'MS_HTF', label: 'HTF Trend Alignment', category: 'STRUCTURE', isActive: last.close > sma200, score: 85, description: 'Price is above 200 SMA indicating macro uptrend.' },
      { id: 'VOL_CLIMAX', label: 'Volume Climax', category: 'VOLUME', isActive: last.volume > avgVol20 * 2.5, score: 95, description: 'Massive institutional participation detected.' },
      
      // Market Structure
      { id: 'MSS_BULL', label: 'Market Structure Shift (Bull)', category: 'SMC', isActive: structure.mss === 'BULLISH', score: 90, description: 'Trend reversal confirmed via swing high breach.' },
      { id: 'MSS_BEAR', label: 'Market Structure Shift (Bear)', category: 'SMC', isActive: structure.mss === 'BEARISH', score: 90, description: 'Trend reversal confirmed via swing low breach.' },
      
      // Order Blocks
      { id: 'OB_BULL', label: 'Bullish Order Block', category: 'SMC', isActive: obs.some(o => o.type === 'BULLISH' && last.close > o.bottom && last.close < o.top), score: 88, description: 'Price is testing an institutional buy zone.' },
      { id: 'OB_BEAR', label: 'Bearish Order Block', category: 'SMC', isActive: obs.some(o => o.type === 'BEARISH' && last.close > o.bottom && last.close < o.top), score: 88, description: 'Price is testing an institutional sell zone.' },
      
      // Imbalances
      { id: 'VI_BULL', label: 'Volume Imbalance (Bull)', category: 'VOLUME', isActive: vis.some(v => v.type === 'BULLISH' && last.close > v.bottom && last.close < v.top), score: 82, description: 'Gap in volume detected; acting as support.' },
      { id: 'VI_BEAR', label: 'Volume Imbalance (Bear)', category: 'VOLUME', isActive: vis.some(v => v.type === 'BEARISH' && last.close > v.bottom && last.close < v.top), score: 82, description: 'Gap in volume detected; acting as resistance.' },
      
      // Fair Value Gaps
      { id: 'FVG_BULL', label: 'Bullish FVG', category: 'SMC', isActive: fvgs.some(f => f.type === 'BISI' && last.close > f.bottom && last.close < f.top), score: 85, description: 'Price is within a bullish Fair Value Gap.' },
      { id: 'FVG_BEAR', label: 'Bearish FVG', category: 'SMC', isActive: fvgs.some(f => f.type === 'SIBI' && last.close > f.bottom && last.close < f.top), score: 85, description: 'Price is within a bearish Fair Value Gap.' },
      
      // Liquidity
      { id: 'LIQ_SWEEP_H', label: 'Buy-Side Sweep', category: 'SMC', isActive: last.high > Math.max(...quotes.slice(-20, -1).map(q => q.high)) && last.close < last.high, score: 92, description: 'Liquidity grab above recent highs (Turtle Soup).' },
      { id: 'LIQ_SWEEP_L', label: 'Sell-Side Sweep', category: 'SMC', isActive: last.low < Math.min(...quotes.slice(-20, -1).map(q => q.low)) && last.close > last.low, score: 92, description: 'Liquidity grab below recent lows (Turtle Soup).' }
    ];

    return results;
  }
}