import { OHLCV } from '@/features/MarketData/services/marketdata/types';

/**
 * Finds True Fractal Swings (Liquidity Pools)
 */
export function findSwingPoints(history: OHLCV[], leftWindow = 3, rightWindow = 2) {
  const swingHighs: { price: number; index: number; mitigated: boolean }[] = [];
  const swingLows: { price: number; index: number; mitigated: boolean }[] = [];

  for (let i = leftWindow; i < history.length - rightWindow; i++) {
    const currentHigh = history[i].high;
    const currentLow = history[i].low;
    
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = i - leftWindow; j <= i + rightWindow; j++) {
      if (i === j) continue;
      if (history[j].high >= currentHigh) isSwingHigh = false;
      if (history[j].low <= currentLow) isSwingLow = false;
    }

    if (isSwingHigh) swingHighs.push({ price: currentHigh, index: i, mitigated: false });
    if (isSwingLow) swingLows.push({ price: currentLow, index: i, mitigated: false });
  }

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
 * Finds Unmitigated Fair Value Gaps (FVG)
 */
export function findUnmitigatedFVGs(history: OHLCV[]) {
  const fvgs: { type: 'BISI' | 'SIBI'; top: number; bottom: number; active: boolean; formedIndex: number }[] = [];

  for (let i = 0; i < history.length - 2; i++) {
    const candle1 = history[i];
    const candle3 = history[i + 2];

    if (candle3.low > candle1.high) {
      fvgs.push({ type: 'BISI', bottom: candle1.high, top: candle3.low, active: true, formedIndex: i + 2 });
    }
    
    if (candle3.high < candle1.low) {
      fvgs.push({ type: 'SIBI', bottom: candle3.high, top: candle1.low, active: true, formedIndex: i + 2 });
    }
  }

  fvgs.forEach(fvg => {
    for (let i = fvg.formedIndex + 1; i < history.length; i++) {
      if (!fvg.active) break;
      const c = history[i];
      if (fvg.type === 'BISI' && c.low <= fvg.bottom) fvg.active = false;
      else if (fvg.type === 'SIBI' && c.high >= fvg.top) fvg.active = false;
    }
  });

  return fvgs.filter(f => f.active);
}

/**
 * Finds Volume Imbalances (Gaps between candle bodies)
 */
export function findVolumeImbalances(history: OHLCV[]) {
  const imbalances: { type: 'BULLISH' | 'BEARISH'; top: number; bottom: number; index: number }[] = [];
  
  for (let i = 1; i < history.length; i++) {
    const curr = history[i];
    const prev = history[i-1];
    
    const currOpen = curr.open;
    const prevClose = prev.close;
    
    // Bullish VI: Open is above previous close
    if (currOpen > prevClose && curr.low > prev.high) {
      imbalances.push({ type: 'BULLISH', bottom: prevClose, top: currOpen, index: i });
    }
    // Bearish VI: Open is below previous close
    else if (currOpen < prevClose && curr.high < prev.low) {
      imbalances.push({ type: 'BEARISH', bottom: currOpen, top: prevClose, index: i });
    }
  }
  return imbalances;
}

/**
 * Detects Market Structure Shifts (MSS) and Breaks of Structure (BOS)
 */
export function detectMarketStructure(history: OHLCV[]) {
  const { swingHighs, swingLows } = findSwingPoints(history, 5, 3);
  const last = history[history.length - 1];
  
  const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
  const unmitigatedLows = swingLows.filter(l => !l.mitigated);
  
  let mss: 'BULLISH' | 'BEARISH' | null = null;
  let bos: 'BULLISH' | 'BEARISH' | null = null;
  
  if (unmitigatedHighs.length > 0) {
    const nearestHigh = unmitigatedHighs[unmitigatedHighs.length - 1];
    if (last.close > nearestHigh.price) mss = 'BULLISH';
  }
  
  if (unmitigatedLows.length > 0) {
    const nearestLow = unmitigatedLows[unmitigatedLows.length - 1];
    if (last.close < nearestLow.price) mss = 'BEARISH';
  }

  return { mss, bos };
}

/**
 * Finds Institutional Order Blocks (OB)
 */
export function findOrderBlocks(history: OHLCV[]) {
  const obs: { type: 'BULLISH' | 'BEARISH'; top: number; bottom: number; index: number; mitigated: boolean }[] = [];
  
  // Simplified OB logic: The last down candle before a strong up move (or vice versa)
  for (let i = 5; i < history.length - 1; i++) {
    const curr = history[i];
    const next = history[i+1];
    
    // Bullish OB: Down candle followed by strong expansion
    if (curr.close < curr.open && next.close > curr.high && (next.close - next.open) > (curr.open - curr.close) * 2) {
      obs.push({ type: 'BULLISH', top: curr.high, bottom: curr.low, index: i, mitigated: false });
    }
    // Bearish OB: Up candle followed by strong expansion down
    else if (curr.close > curr.open && next.close < curr.low && (next.open - next.close) > (curr.close - curr.open) * 2) {
      obs.push({ type: 'BEARISH', top: curr.high, bottom: curr.low, index: i, mitigated: false });
    }
  }
  
  // Check mitigation
  obs.forEach(ob => {
    for (let i = ob.index + 1; i < history.length; i++) {
      if (ob.type === 'BULLISH' && history[i].low < ob.bottom) { ob.mitigated = true; break; }
      if (ob.type === 'BEARISH' && history[i].high > ob.top) { ob.mitigated = true; break; }
    }
  });
  
  return obs.filter(o => !o.mitigated);
}