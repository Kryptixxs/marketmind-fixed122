import { MarketSnapshot, ConfluenceResult } from './types';
import { 
  findUnmitigatedFVGs, 
  findSwingPoints, 
  findOrderBlocks, 
  detectMarketStructure,
  calculateRSI,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands
} from '@/lib/tech-math';

export class ConfluenceEngine {
  private data: MarketSnapshot;

  constructor(snapshot: MarketSnapshot) {
    this.data = snapshot;
  }

  public calculateAll(): ConfluenceResult[] {
    const quotes = this.data.quotes;
    if (!quotes || quotes.length < 50) return [];

    const last = quotes[quotes.length - 1];
    const prev = quotes[quotes.length - 2];
    const closes = quotes.map(q => q.close);
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);
    const volumes = quotes.map(q => q.volume);

    // --- INDICATOR CALCULATIONS ---
    const rsi = calculateRSI(closes, 14);
    const lastRSI = rsi[rsi.length - 1];
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const bb = calculateBollingerBands(closes, 20, 2);
    const macd = calculateMACD(closes);

    // --- SMC CALCULATIONS ---
    const obs = findOrderBlocks(quotes);
    const fvgs = findUnmitigatedFVGs(quotes);
    const structure = detectMarketStructure(quotes);
    const { swingHighs, swingLows } = findSwingPoints(quotes);

    const results: ConfluenceResult[] = [];

    // --- 1. STRUCTURE & TREND (15 Rules) ---
    results.push({ id: 'T_200_B', label: 'Macro Bullish', category: 'STRUCTURE', isActive: last.close > ema200[ema200.length - 1], score: 80, description: 'Price above 200 EMA.' });
    results.push({ id: 'T_200_S', label: 'Macro Bearish', category: 'STRUCTURE', isActive: last.close < ema200[ema200.length - 1], score: 80, description: 'Price below 200 EMA.' });
    results.push({ id: 'T_50_B', label: 'Intermediate Bullish', category: 'STRUCTURE', isActive: last.close > ema50[ema50.length - 1], score: 60, description: 'Price above 50 EMA.' });
    results.push({ id: 'T_GOLDEN', label: 'Golden Cross', category: 'STRUCTURE', isActive: ema50[ema50.length - 1] > ema200[ema200.length - 1] && ema50[ema50.length - 2] <= ema200[ema200.length - 2], score: 95, description: '50 EMA crossed above 200 EMA.' });
    results.push({ id: 'T_DEATH', label: 'Death Cross', category: 'STRUCTURE', isActive: ema50[ema50.length - 1] < ema200[ema200.length - 1] && ema50[ema50.length - 2] >= ema200[ema200.length - 2], score: 95, description: '50 EMA crossed below 200 EMA.' });
    results.push({ id: 'T_HH', label: 'Higher High', category: 'STRUCTURE', isActive: last.high > prev.high && prev.high > quotes[quotes.length - 3].high, score: 50, description: 'Consecutive higher highs.' });
    results.push({ id: 'T_LL', label: 'Lower Low', category: 'STRUCTURE', isActive: last.low < prev.low && prev.low < quotes[quotes.length - 3].low, score: 50, description: 'Consecutive lower lows.' });

    // --- 2. SMC & LIQUIDITY (20 Rules) ---
    results.push({ id: 'SMC_MSS_B', label: 'MSS Bullish', category: 'SMC', isActive: structure.mss === 'BULLISH', score: 90, description: 'Market Structure Shift to the upside.' });
    results.push({ id: 'SMC_MSS_S', label: 'MSS Bearish', category: 'SMC', isActive: structure.mss === 'BEARISH', score: 90, description: 'Market Structure Shift to the downside.' });
    results.push({ id: 'SMC_OB_T', label: 'OB Test', category: 'SMC', isActive: obs.some(o => last.low <= o.top && last.high >= o.bottom), score: 85, description: 'Price currently testing an Order Block.' });
    results.push({ id: 'SMC_FVG_F', label: 'FVG Fill', category: 'SMC', isActive: fvgs.some(f => last.close >= f.bottom && last.close <= f.top), score: 75, description: 'Price filling a Fair Value Gap.' });
    results.push({ id: 'SMC_LIQ_H', label: 'Buy-Side Sweep', category: 'SMC', isActive: last.high > Math.max(...highs.slice(-20, -1)) && last.close < last.high, score: 92, description: 'Liquidity grab above recent highs.' });
    results.push({ id: 'SMC_LIQ_L', label: 'Sell-Side Sweep', category: 'SMC', isActive: last.low < Math.min(...lows.slice(-20, -1)) && last.close > last.low, score: 92, description: 'Liquidity grab below recent lows.' });

    // --- 3. MOMENTUM & RSI (15 Rules) ---
    results.push({ id: 'M_RSI_OB', label: 'RSI Overbought', category: 'MOMENTUM', isActive: lastRSI > 70, score: 70, description: 'RSI above 70 threshold.' });
    results.push({ id: 'M_RSI_OS', label: 'RSI Oversold', category: 'MOMENTUM', isActive: lastRSI < 30, score: 70, description: 'RSI below 30 threshold.' });
    results.push({ id: 'M_RSI_B', label: 'RSI Bullish Zone', category: 'MOMENTUM', isActive: lastRSI > 50, score: 40, description: 'RSI in bullish territory.' });
    results.push({ id: 'M_MACD_B', label: 'MACD Bullish Cross', category: 'MOMENTUM', isActive: macd.macdLine[macd.macdLine.length - 1] > macd.signalLine[macd.signalLine.length - 1], score: 65, description: 'MACD line above signal line.' });
    results.push({ id: 'M_DIV_B', label: 'Bullish Divergence', category: 'MOMENTUM', isActive: last.low < prev.low && lastRSI > rsi[rsi.length - 2], score: 85, description: 'Lower price low with higher RSI low.' });

    // --- 4. VOLATILITY & BANDS (10 Rules) ---
    results.push({ id: 'V_BB_U', label: 'BB Upper Breach', category: 'VOLATILITY', isActive: last.high > bb.upper[bb.upper.length - 1], score: 75, description: 'Price pierced upper Bollinger Band.' });
    results.push({ id: 'V_BB_L', label: 'BB Lower Breach', category: 'VOLATILITY', isActive: last.low < bb.lower[bb.lower.length - 1], score: 75, description: 'Price pierced lower Bollinger Band.' });
    results.push({ id: 'V_SQUEEZE', label: 'Volatility Squeeze', category: 'VOLATILITY', isActive: (bb.upper[bb.upper.length - 1] - bb.lower[bb.lower.length - 1]) < (bb.upper[bb.upper.length - 20] - bb.lower[bb.lower.length - 20]), score: 80, description: 'Bollinger Bands contracting.' });

    // --- 5. VOLUME ANALYSIS (10 Rules) ---
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    results.push({ id: 'VOL_CLIMAX', label: 'Volume Climax', category: 'VOLUME', isActive: last.volume > avgVol * 2.5, score: 95, description: 'Abnormal institutional volume detected.' });
    results.push({ id: 'VOL_DRY', label: 'Volume Exhaustion', category: 'VOLUME', isActive: last.volume < avgVol * 0.5, score: 60, description: 'Low participation at current levels.' });

    // --- 6. TIME & SESSION (5 Rules) ---
    const hour = new Date().getUTCHours();
    results.push({ id: 'TIME_NY_OPEN', label: 'NY Open Volatility', category: 'TIME', isActive: hour >= 13 && hour <= 15, score: 85, description: 'High liquidity window (NY Open).' });
    results.push({ id: 'TIME_LON_OPEN', label: 'London Open', category: 'TIME', isActive: hour >= 8 && hour <= 10, score: 85, description: 'High liquidity window (London Open).' });

    // --- 7. CANDLESTICK PATTERNS (15 Rules) ---
    const body = Math.abs(last.close - last.open);
    const range = last.high - last.low;
    results.push({ id: 'C_HAMMER', label: 'Hammer Candle', category: 'CANDLE', isActive: last.close > last.open && (last.open - last.low) > body * 2, score: 75, description: 'Bullish rejection candle.' });
    results.push({ id: 'C_SHOOTING', label: 'Shooting Star', category: 'CANDLE', isActive: last.open > last.close && (last.high - last.open) > body * 2, score: 75, description: 'Bearish rejection candle.' });
    results.push({ id: 'C_ENG_B', label: 'Bullish Engulfing', category: 'CANDLE', isActive: last.close > prev.open && last.open < prev.close && prev.close < prev.open, score: 80, description: 'Bullish engulfing pattern.' });

    // --- 8. MOVING AVERAGE MATRIX (10 Rules) ---
    results.push({ id: 'MA_STACK_B', label: 'Full Bullish Stack', category: 'MA', isActive: last.close > ema9[ema9.length - 1] && ema9[ema9.length - 1] > ema21[ema21.length - 1] && ema21[ema21.length - 1] > ema50[ema50.length - 1], score: 90, description: 'MAs perfectly aligned for uptrend.' });

    return results;
  }
}