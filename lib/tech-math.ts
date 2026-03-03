import { OHLCV } from './marketdata/types';

/**
 * Finds True Fractal Swings (Liquidity Pools)
 * A Swing High requires N lower highs on both the left and right.
 */
export function findSwingPoints(history: OHLCV[], leftWindow = 3, rightWindow = 2) {
  const swingHighs: { price: number; index: number; mitigated: boolean }[] = [];
  const swingLows: { price: number; index: number; mitigated: boolean }[] = [];

  for (let i = leftWindow; i < history.length - rightWindow; i++) {
    const currentHigh = history[i].high;
    const currentLow = history[i].low;
    
    let isSwingHigh = true;
    let isSwingLow = true;

    // Check surrounding bars
    for (let j = i - leftWindow; j <= i + rightWindow; j++) {
      if (i === j) continue;
      if (history[j].high >= currentHigh) isSwingHigh = false;
      if (history[j].low <= currentLow) isSwingLow = false;
    }

    if (isSwingHigh) swingHighs.push({ price: currentHigh, index: i, mitigated: false });
    if (isSwingLow) swingLows.push({ price: currentLow, index: i, mitigated: false });
  }

  // Check for mitigation (sweeps) by subsequent price action
  swingHighs.forEach(sh => {
    for (let i = sh.index + 1; i < history.length; i++) {
      if (history[i].high > sh.price) {
        sh.mitigated = true;
        break;
      }
    }
  });

  swingLows.forEach(sl => {
    for (let i = sl.index + 1; i < history.length; i++) {
      if (history[i].low < sl.price) {
        sl.mitigated = true;
        break;
      }
    }
  });

  return { swingHighs, swingLows };
}

/**
 * Finds Unmitigated Fair Value Gaps (FVG / Imbalances)
 */
export function findUnmitigatedFVGs(history: OHLCV[]) {
  const fvgs: { type: 'BISI' | 'SIBI'; top: number; bottom: number; active: boolean; formedIndex: number }[] = [];

  for (let i = 0; i < history.length - 2; i++) {
    const candle1 = history[i];
    const candle3 = history[i + 2];

    // BISI: Bullish Imbalance, Sell-Side Inefficiency (Gap between C1 High and C3 Low)
    if (candle3.low > candle1.high) {
      fvgs.push({ type: 'BISI', bottom: candle1.high, top: candle3.low, active: true, formedIndex: i + 2 });
    }
    
    // SIBI: Bearish Imbalance, Buy-Side Inefficiency (Gap between C1 Low and C3 High)
    if (candle3.high < candle1.low) {
      fvgs.push({ type: 'SIBI', bottom: candle3.high, top: candle1.low, active: true, formedIndex: i + 2 });
    }
  }

  // Validate if subsequent price action filled the gap
  fvgs.forEach(fvg => {
    for (let i = fvg.formedIndex + 1; i < history.length; i++) {
      if (!fvg.active) break;
      const c = history[i];
      
      if (fvg.type === 'BISI' && c.low <= fvg.bottom) {
        fvg.active = false; // Fully mitigated
      } else if (fvg.type === 'SIBI' && c.high >= fvg.top) {
        fvg.active = false; // Fully mitigated
      }
    }
  });

  return fvgs.filter(f => f.active);
}