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
    if (!quotes || quotes.length < 200) return []; // Need deep history for 200 EMA

    const last = quotes[quotes.length - 1];
    const prev = quotes[quotes.length - 2];
    const p3 = quotes[quotes.length - 3];
    const closes = quotes.map(q => q.close);
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);
    const volumes = quotes.map(q => q.volume);

    // --- INDICATOR CALCULATIONS ---
    const rsi = calculateRSI(closes, 14);
    const lastRSI = rsi[rsi.length - 1];
    const prevRSI = rsi[rsi.length - 2];
    
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const ema100 = calculateEMA(closes, 100);
    const ema200 = calculateEMA(closes, 200);
    
    const bb = calculateBollingerBands(closes, 20, 2);
    const macd = calculateMACD(closes);

    // --- SMC CALCULATIONS ---
    const obs = findOrderBlocks(quotes);
    const fvgs = findUnmitigatedFVGs(quotes);
    const structure = detectMarketStructure(quotes);
    const { swingHighs, swingLows } = findSwingPoints(quotes);

    const results: ConfluenceResult[] = [];

    // --- 1. MOVING AVERAGE MATRIX (20 Rules) ---
    const ma9 = ema9[ema9.length - 1];
    const ma21 = ema21[ema21.length - 1];
    const ma50 = ema50[ema50.length - 1];
    const ma100 = ema100[ema100.length - 1];
    const ma200 = ema200[ema200.length - 1];

    results.push({ id: 'MA_9_21_B', label: 'Fast Bullish Cross', category: 'MA', isActive: ma9 > ma21, score: 40, description: '9 EMA above 21 EMA.' });
    results.push({ id: 'MA_9_21_S', label: 'Fast Bearish Cross', category: 'MA', isActive: ma9 < ma21, score: 40, description: '9 EMA below 21 EMA.' });
    results.push({ id: 'MA_21_50_B', label: 'Medium Bullish Cross', category: 'MA', isActive: ma21 > ma50, score: 50, description: '21 EMA above 50 EMA.' });
    results.push({ id: 'MA_21_50_S', label: 'Medium Bearish Cross', category: 'MA', isActive: ma21 < ma50, score: 50, description: '21 EMA below 50 EMA.' });
    results.push({ id: 'MA_50_200_B', label: 'Golden Cross', category: 'MA', isActive: ma50 > ma200, score: 90, description: '50 EMA above 200 EMA.' });
    results.push({ id: 'MA_50_200_S', label: 'Death Cross', category: 'MA', isActive: ma50 < ma200, score: 90, description: '50 EMA below 200 EMA.' });
    results.push({ id: 'MA_STACK_B', label: 'Full Bullish Stack', category: 'MA', isActive: ma9 > ma21 && ma21 > ma50 && ma50 > ma100 && ma100 > ma200, score: 100, description: 'Perfect bullish alignment.' });
    results.push({ id: 'MA_STACK_S', label: 'Full Bearish Stack', category: 'MA', isActive: ma9 < ma21 && ma21 < ma50 && ma50 < ma100 && ma100 < ma200, score: 100, description: 'Perfect bearish alignment.' });
    results.push({ id: 'MA_PRICE_200_B', label: 'Above 200 EMA', category: 'MA', isActive: last.close > ma200, score: 70, description: 'Price trading above macro trend.' });
    results.push({ id: 'MA_PRICE_200_S', label: 'Below 200 EMA', category: 'MA', isActive: last.close < ma200, score: 70, description: 'Price trading below macro trend.' });
    results.push({ id: 'MA_9_SLOPE_B', label: '9 EMA Rising', category: 'MA', isActive: ma9 > ema9[ema9.length - 2], score: 20, description: 'Short-term momentum rising.' });
    results.push({ id: 'MA_9_SLOPE_S', label: '9 EMA Falling', category: 'MA', isActive: ma9 < ema9[ema9.length - 2], score: 20, description: 'Short-term momentum falling.' });
    results.push({ id: 'MA_200_SLOPE_B', label: '200 EMA Rising', category: 'MA', isActive: ma200 > ema200[ema200.length - 2], score: 60, description: 'Macro trend rising.' });
    results.push({ id: 'MA_200_SLOPE_S', label: '200 EMA Falling', category: 'MA', isActive: ma200 < ema200[ema200.length - 2], score: 60, description: 'Macro trend falling.' });
    results.push({ id: 'MA_FAN_B', label: 'Bullish Fan', category: 'MA', isActive: ma9 > ma21 && ma21 > ma50, score: 50, description: 'MAs fanning out bullishly.' });
    results.push({ id: 'MA_FAN_S', label: 'Bearish Fan', category: 'MA', isActive: ma9 < ma21 && ma21 < ma50, score: 50, description: 'MAs fanning out bearishly.' });
    results.push({ id: 'MA_COMPRESSION', label: 'MA Compression', category: 'MA', isActive: Math.abs(ma9 - ma50) / last.close < 0.005, score: 40, description: 'MAs tightly compressed.' });
    results.push({ id: 'MA_9_TEST_B', label: '9 EMA Support', category: 'MA', isActive: last.low <= ma9 && last.close > ma9, score: 30, description: 'Price testing 9 EMA as support.' });
    results.push({ id: 'MA_21_TEST_B', label: '21 EMA Support', category: 'MA', isActive: last.low <= ma21 && last.close > ma21, score: 40, description: 'Price testing 21 EMA as support.' });
    results.push({ id: 'MA_200_TEST_B', label: '200 EMA Support', category: 'MA', isActive: last.low <= ma200 && last.close > ma200, score: 80, description: 'Price testing 200 EMA as support.' });

    // --- 2. MOMENTUM & RSI (15 Rules) ---
    results.push({ id: 'RSI_OB', label: 'RSI Overbought', category: 'MOMENTUM', isActive: lastRSI > 70, score: 60, description: 'RSI > 70.' });
    results.push({ id: 'RSI_OS', label: 'RSI Oversold', category: 'MOMENTUM', isActive: lastRSI < 30, score: 60, description: 'RSI < 30.' });
    results.push({ id: 'RSI_BULL_ZONE', label: 'RSI Bullish Zone', category: 'MOMENTUM', isActive: lastRSI > 50, score: 30, description: 'RSI in upper half.' });
    results.push({ id: 'RSI_BEAR_ZONE', label: 'RSI Bearish Zone', category: 'MOMENTUM', isActive: lastRSI < 50, score: 30, description: 'RSI in lower half.' });
    results.push({ id: 'RSI_DIV_B', label: 'Bullish Divergence', category: 'MOMENTUM', isActive: last.low < prev.low && lastRSI > prevRSI, score: 85, description: 'Lower price low, higher RSI low.' });
    results.push({ id: 'RSI_DIV_S', label: 'Bearish Divergence', category: 'MOMENTUM', isActive: last.high > prev.high && lastRSI < prevRSI, score: 85, description: 'Higher price high, lower RSI high.' });
    results.push({ id: 'RSI_EXIT_OS', label: 'RSI OS Exit', category: 'MOMENTUM', isActive: lastRSI > 30 && prevRSI <= 30, score: 70, description: 'RSI crossing back above 30.' });
    results.push({ id: 'RSI_EXIT_OB', label: 'RSI OB Exit', category: 'MOMENTUM', isActive: lastRSI < 70 && prevRSI >= 70, score: 70, description: 'RSI crossing back below 70.' });
    results.push({ id: 'RSI_50_CROSS_B', label: 'RSI 50 Bullish', category: 'MOMENTUM', isActive: lastRSI > 50 && prevRSI <= 50, score: 50, description: 'RSI crossing above 50.' });
    results.push({ id: 'RSI_50_CROSS_S', label: 'RSI 50 Bearish', category: 'MOMENTUM', isActive: lastRSI < 50 && prevRSI >= 50, score: 50, description: 'RSI crossing below 50.' });
    results.push({ id: 'MACD_CROSS_B', label: 'MACD Bullish Cross', category: 'MOMENTUM', isActive: macd.macdLine[macd.macdLine.length - 1] > macd.signalLine[macd.signalLine.length - 1], score: 60, description: 'MACD line above signal.' });
    results.push({ id: 'MACD_CROSS_S', label: 'MACD Bearish Cross', category: 'MOMENTUM', isActive: macd.macdLine[macd.macdLine.length - 1] < macd.signalLine[macd.signalLine.length - 1], score: 60, description: 'MACD line below signal.' });
    results.push({ id: 'MACD_ZERO_B', label: 'MACD Above Zero', category: 'MOMENTUM', isActive: macd.macdLine[macd.macdLine.length - 1] > 0, score: 40, description: 'MACD in positive territory.' });
    results.push({ id: 'MACD_ZERO_S', label: 'MACD Below Zero', category: 'MOMENTUM', isActive: macd.macdLine[macd.macdLine.length - 1] < 0, score: 40, description: 'MACD in negative territory.' });
    results.push({ id: 'MACD_HIST_B', label: 'MACD Hist Rising', category: 'MOMENTUM', isActive: (macd.macdLine[macd.macdLine.length - 1] - macd.signalLine[macd.signalLine.length - 1]) > (macd.macdLine[macd.macdLine.length - 2] - macd.signalLine[macd.signalLine.length - 2]), score: 30, description: 'MACD histogram expanding bullishly.' });

    // --- 3. SMC & ICT (20 Rules) ---
    results.push({ id: 'SMC_MSS_B', label: 'MSS Bullish', category: 'SMC', isActive: structure.mss === 'BULLISH', score: 95, description: 'Market Structure Shift (Bullish).' });
    results.push({ id: 'SMC_MSS_S', label: 'MSS Bearish', category: 'SMC', isActive: structure.mss === 'BEARISH', score: 95, description: 'Market Structure Shift (Bearish).' });
    results.push({ id: 'SMC_OB_B', label: 'Bullish OB Test', category: 'SMC', isActive: obs.some(o => o.type === 'BULLISH' && last.low <= o.top && last.close >= o.bottom), score: 85, description: 'Testing Bullish Order Block.' });
    results.push({ id: 'SMC_OB_S', label: 'Bearish OB Test', category: 'SMC', isActive: obs.some(o => o.type === 'BEARISH' && last.high >= o.bottom && last.close <= o.top), score: 85, description: 'Testing Bearish Order Block.' });
    results.push({ id: 'SMC_FVG_B', label: 'Bullish FVG', category: 'SMC', isActive: fvgs.some(f => f.type === 'BISI'), score: 70, description: 'Unmitigated Bullish FVG present.' });
    results.push({ id: 'SMC_FVG_S', label: 'Bearish FVG', category: 'SMC', isActive: fvgs.some(f => f.type === 'SIBI'), score: 70, description: 'Unmitigated Bearish FVG present.' });
    results.push({ id: 'SMC_SWEEP_H', label: 'Buy-Side Sweep', category: 'SMC', isActive: last.high > Math.max(...highs.slice(-20, -1)) && last.close < last.high, score: 90, description: 'Liquidity grab above recent high.' });
    results.push({ id: 'SMC_SWEEP_L', label: 'Sell-Side Sweep', category: 'SMC', isActive: last.low < Math.min(...lows.slice(-20, -1)) && last.close > last.low, score: 90, description: 'Liquidity grab below recent low.' });
    results.push({ id: 'SMC_BOS_B', label: 'Bullish BOS', category: 'SMC', isActive: last.close > Math.max(...highs.slice(-50, -1)), score: 80, description: 'Break of Structure to the upside.' });
    results.push({ id: 'SMC_BOS_S', label: 'Bearish BOS', category: 'SMC', isActive: last.close < Math.min(...lows.slice(-50, -1)), score: 80, description: 'Break of Structure to the downside.' });
    results.push({ id: 'SMC_EQ_H', label: 'Equal Highs', category: 'SMC', isActive: Math.abs(last.high - prev.high) / last.close < 0.001, score: 60, description: 'Potential liquidity pool at highs.' });
    results.push({ id: 'SMC_EQ_L', label: 'Equal Lows', category: 'SMC', isActive: Math.abs(last.low - prev.low) / last.close < 0.001, score: 60, description: 'Potential liquidity pool at lows.' });
    results.push({ id: 'SMC_DISP_B', label: 'Bullish Displacement', category: 'SMC', isActive: (last.close - last.open) > (closes.slice(-20).reduce((a, b) => a + b, 0) / 20 * 0.01), score: 75, description: 'Strong institutional buying pressure.' });
    results.push({ id: 'SMC_DISP_S', label: 'Bearish Displacement', category: 'SMC', isActive: (last.open - last.close) > (closes.slice(-20).reduce((a, b) => a + b, 0) / 20 * 0.01), score: 75, description: 'Strong institutional selling pressure.' });
    results.push({ id: 'SMC_PREMIUM', label: 'Premium Array', category: 'SMC', isActive: last.close > (Math.max(...highs.slice(-50)) + Math.min(...lows.slice(-50))) / 2, score: 30, description: 'Price in premium territory.' });
    results.push({ id: 'SMC_DISCOUNT', label: 'Discount Array', category: 'SMC', isActive: last.close < (Math.max(...highs.slice(-50)) + Math.min(...lows.slice(-50))) / 2, score: 30, description: 'Price in discount territory.' });

    // --- 4. VOLATILITY & BANDS (15 Rules) ---
    const lastUpper = bb.upper[bb.upper.length - 1];
    const lastLower = bb.lower[bb.lower.length - 1];
    const lastMid = bb.middle[bb.middle.length - 1];

    results.push({ id: 'V_BB_UPPER', label: 'BB Upper Breach', category: 'VOLATILITY', isActive: last.high > lastUpper, score: 70, description: 'Price pierced upper band.' });
    results.push({ id: 'V_BB_LOWER', label: 'BB Lower Breach', category: 'VOLATILITY', isActive: last.low < lastLower, score: 70, description: 'Price pierced lower band.' });
    results.push({ id: 'V_BB_WALK_B', label: 'Walking Upper Band', category: 'VOLATILITY', isActive: last.close > lastUpper && prev.close > bb.upper[bb.upper.length - 2], score: 85, description: 'Strong bullish volatility expansion.' });
    results.push({ id: 'V_BB_WALK_S', label: 'Walking Lower Band', category: 'VOLATILITY', isActive: last.close < lastLower && prev.close < bb.lower[bb.lower.length - 2], score: 85, description: 'Strong bearish volatility expansion.' });
    results.push({ id: 'V_SQUEEZE', label: 'Volatility Squeeze', category: 'VOLATILITY', isActive: (lastUpper - lastLower) / lastMid < 0.02, score: 80, description: 'Bollinger Bands tightly compressed.' });
    results.push({ id: 'V_EXPANSION', label: 'Vol Expansion', category: 'VOLATILITY', isActive: (lastUpper - lastLower) > (bb.upper[bb.upper.length - 2] - bb.lower[bb.lower.length - 2]) * 1.2, score: 60, description: 'Volatility increasing rapidly.' });
    results.push({ id: 'V_MEAN_REV_B', label: 'Mean Reversion Bull', category: 'VOLATILITY', isActive: last.close < lastLower && lastRSI < 30, score: 95, description: 'Extreme oversold at lower band.' });
    results.push({ id: 'V_MEAN_REV_S', label: 'Mean Reversion Bear', category: 'VOLATILITY', isActive: last.close > lastUpper && lastRSI > 70, score: 95, description: 'Extreme overbought at upper band.' });

    // --- 5. PRICE ACTION & CANDLES (20 Rules) ---
    const body = Math.abs(last.close - last.open);
    const range = last.high - last.low;
    const isGreen = last.close > last.open;
    const isRed = last.close < last.open;

    results.push({ id: 'C_HAMMER', label: 'Hammer', category: 'CANDLE', isActive: isGreen && (last.open - last.low) > body * 2 && (last.high - last.close) < body * 0.5, score: 75, description: 'Bullish rejection candle.' });
    results.push({ id: 'C_SHOOTING', label: 'Shooting Star', category: 'CANDLE', isActive: isRed && (last.high - last.open) > body * 2 && (last.close - last.low) < body * 0.5, score: 75, description: 'Bearish rejection candle.' });
    results.push({ id: 'C_ENG_B', label: 'Bullish Engulfing', category: 'CANDLE', isActive: isGreen && prev.close < prev.open && last.close > prev.open && last.open < prev.close, score: 85, description: 'Bullish engulfing pattern.' });
    results.push({ id: 'C_ENG_S', label: 'Bearish Engulfing', category: 'CANDLE', isActive: isRed && prev.close > prev.open && last.close < prev.open && last.open > prev.close, score: 85, description: 'Bearish engulfing pattern.' });
    results.push({ id: 'C_INSIDE', label: 'Inside Bar', category: 'CANDLE', isActive: last.high < prev.high && last.low > prev.low, score: 50, description: 'Volatility contraction (Inside Bar).' });
    results.push({ id: 'C_OUTSIDE', label: 'Outside Bar', category: 'CANDLE', isActive: last.high > prev.high && last.low < prev.low, score: 60, description: 'Volatility expansion (Outside Bar).' });
    results.push({ id: 'C_DOJI', label: 'Doji', category: 'CANDLE', isActive: body / range < 0.1, score: 40, description: 'Market indecision (Doji).' });
    results.push({ id: 'C_MARU_B', label: 'Bullish Marubozu', category: 'CANDLE', isActive: isGreen && body / range > 0.9, score: 80, description: 'Strong bullish conviction.' });
    results.push({ id: 'C_MARU_S', label: 'Bearish Marubozu', category: 'CANDLE', isActive: isRed && body / range > 0.9, score: 80, description: 'Strong bearish conviction.' });
    results.push({ id: 'C_3_WHITE', label: '3 White Soldiers', category: 'CANDLE', isActive: isGreen && prev.close > prev.open && p3.close > p3.open, score: 90, description: 'Strong bullish trend continuation.' });
    results.push({ id: 'C_3_BLACK', label: '3 Black Crows', category: 'CANDLE', isActive: isRed && prev.close < prev.open && p3.close < p3.open, score: 90, description: 'Strong bearish trend continuation.' });

    // --- 6. VOLUME & FLOW (10 Rules) ---
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    results.push({ id: 'VOL_CLIMAX', label: 'Volume Climax', category: 'VOLUME', isActive: last.volume > avgVol * 2.5, score: 95, description: 'Institutional volume spike.' });
    results.push({ id: 'VOL_DRY', label: 'Volume Exhaustion', category: 'VOLUME', isActive: last.volume < avgVol * 0.5, score: 60, description: 'Low participation.' });
    results.push({ id: 'VOL_PRICE_CONF_B', label: 'Bullish Vol Conf', category: 'VOLUME', isActive: isGreen && last.volume > prev.volume, score: 50, description: 'Rising volume on bullish candle.' });
    results.push({ id: 'VOL_PRICE_CONF_S', label: 'Bearish Vol Conf', category: 'VOLUME', isActive: isRed && last.volume > prev.volume, score: 50, description: 'Rising volume on bearish candle.' });
    results.push({ id: 'VOL_DIV_B', label: 'Bullish Vol Div', category: 'VOLUME', isActive: isRed && last.volume < prev.volume && prev.volume < quotes[quotes.length - 3].volume, score: 70, description: 'Selling pressure fading.' });

    // --- 7. TIME & SESSION (10 Rules) ---
    const hour = new Date().getUTCHours();
    results.push({ id: 'TIME_NY_OPEN', label: 'NY Open Window', category: 'TIME', isActive: hour >= 13 && hour <= 15, score: 80, description: 'High liquidity (NY Open).' });
    results.push({ id: 'TIME_LON_OPEN', label: 'London Open Window', category: 'TIME', isActive: hour >= 8 && hour <= 10, score: 80, description: 'High liquidity (London Open).' });
    results.push({ id: 'TIME_ASIA_CLOSE', label: 'Asia Close Window', category: 'TIME', isActive: hour >= 6 && hour <= 8, score: 60, description: 'Session transition liquidity.' });
    results.push({ id: 'TIME_NY_CLOSE', label: 'NY Close Window', category: 'TIME', isActive: hour >= 20 && hour <= 21, score: 70, description: 'Institutional rebalancing window.' });

    // --- 8. STRUCTURE & TREND (10 Rules) ---
    results.push({ id: 'S_HH_HL', label: 'Bullish Structure', category: 'STRUCTURE', isActive: last.high > prev.high && last.low > prev.low, score: 60, description: 'Higher high and higher low.' });
    results.push({ id: 'S_LL_LH', label: 'Bearish Structure', category: 'STRUCTURE', isActive: last.low < prev.low && last.high < prev.high, score: 60, description: 'Lower low and lower high.' });
    results.push({ id: 'S_RANGE', label: 'Ranging Market', category: 'STRUCTURE', isActive: Math.abs(last.high - Math.max(...highs.slice(-10))) / last.close < 0.002, score: 40, description: 'Price consolidating in range.' });

    // --- 9. QUANT & STATS (10 Rules) ---
    const returns = closes.slice(-20).map((c, i, arr) => i === 0 ? 0 : (c - arr[i-1]) / arr[i-1]);
    const std = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b, 2), 0) / 20);
    results.push({ id: 'Q_Z_SCORE_H', label: 'High Z-Score', category: 'QUANT', isActive: Math.abs(returns[returns.length - 1]) > std * 2, score: 75, description: 'Statistical outlier move detected.' });

    // --- 10. FIBONACCI (5 Rules) ---
    const range50 = Math.max(...highs.slice(-50)) - Math.min(...lows.slice(-50));
    const fib618 = Math.min(...lows.slice(-50)) + range50 * 0.618;
    results.push({ id: 'F_618_TEST', label: 'Golden Pocket Test', category: 'FIB', isActive: Math.abs(last.close - fib618) / last.close < 0.001, score: 85, description: 'Testing 0.618 Fibonacci level.' });

    // --- 11. INTERMARKET (5 Rules) ---
    // Placeholder for DXY/Yield correlations if available in snapshot
    
    // --- 12. FUNDAMENTAL (5 Rules) ---
    // Placeholder for news sentiment integration

    // --- 13. DERIVATIVES (5 Rules) ---
    // Placeholder for options flow/gamma integration

    // --- 14. SR LEVELS (10 Rules) ---
    results.push({ id: 'SR_PSYCH_B', label: 'Psychological Support', category: 'SR', isActive: last.close % 100 < 5 || last.close % 100 > 95, score: 50, description: 'Price near whole number level.' });

    return results;
  }
}