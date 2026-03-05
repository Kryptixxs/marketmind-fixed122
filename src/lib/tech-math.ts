import { OHLCV } from '@/features/MarketData/services/marketdata/types';

/**
 * Standard Technical Indicators
 */
export function calculateRSI(data: number[], period = 14): number[] {
  if (data.length <= period) return [];
  const rsi = [];
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - (100 / (1 + avgGain / (avgLoss || 1)));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = 100 - (100 / (1 + avgGain / (avgLoss || 1)));
  }
  return rsi;
}

export function calculateMACD(data: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calculateEMA(data, fast);
  const emaSlow = calculateEMA(data, slow);
  const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);
  return { macdLine, signalLine };
}

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calculateBollingerBands(data: number[], period = 20, stdDev = 2) {
  const upper = [];
  const lower = [];
  const middle = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / period;
    const sd = Math.sqrt(variance);
    middle.push(avg);
    upper.push(avg + sd * stdDev);
    lower.push(avg - sd * stdDev);
  }
  return { upper, lower, middle };
}

/**
 * SMC & ICT Primitives
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
      if (history[i].high > sh.price) { sh.mitigated = true; break; }
    }
  });

  swingLows.forEach(sl => {
    for (let i = sl.index + 1; i < history.length; i++) {
      if (history[i].low < sl.price) { sl.mitigated = true; break; }
    }
  });

  return { swingHighs, swingLows };
}

export function findUnmitigatedFVGs(history: OHLCV[]) {
  const fvgs: { type: 'BISI' | 'SIBI'; top: number; bottom: number; active: boolean; formedIndex: number }[] = [];
  for (let i = 0; i < history.length - 2; i++) {
    const c1 = history[i];
    const c3 = history[i + 2];
    if (c3.low > c1.high) fvgs.push({ type: 'BISI', bottom: c1.high, top: c3.low, active: true, formedIndex: i + 2 });
    if (c3.high < c1.low) fvgs.push({ type: 'SIBI', bottom: c3.high, top: c1.low, active: true, formedIndex: i + 2 });
  }
  fvgs.forEach(fvg => {
    for (let i = fvg.formedIndex + 1; i < history.length; i++) {
      if (!fvg.active) break;
      if (fvg.type === 'BISI' && history[i].low <= fvg.bottom) fvg.active = false;
      else if (fvg.type === 'SIBI' && history[i].high >= fvg.top) fvg.active = false;
    }
  });
  return fvgs.filter(f => f.active);
}

export function findOrderBlocks(history: OHLCV[]) {
  const obs: { type: 'BULLISH' | 'BEARISH'; top: number; bottom: number; index: number; mitigated: boolean }[] = [];
  for (let i = 5; i < history.length - 1; i++) {
    const curr = history[i];
    const next = history[i+1];
    if (curr.close < curr.open && next.close > curr.high && (next.close - next.open) > (curr.open - curr.close) * 2) {
      obs.push({ type: 'BULLISH', top: curr.high, bottom: curr.low, index: i, mitigated: false });
    } else if (curr.close > curr.open && next.close < curr.low && (next.open - next.close) > (curr.close - curr.open) * 2) {
      obs.push({ type: 'BEARISH', top: curr.high, bottom: curr.low, index: i, mitigated: false });
    }
  }
  obs.forEach(ob => {
    for (let i = ob.index + 1; i < history.length; i++) {
      if (ob.type === 'BULLISH' && history[i].low < ob.bottom) { ob.mitigated = true; break; }
      if (ob.type === 'BEARISH' && history[i].high > ob.top) { ob.mitigated = true; break; }
    }
  });
  return obs.filter(o => !o.mitigated);
}

export function detectMarketStructure(history: OHLCV[]) {
  const { swingHighs, swingLows } = findSwingPoints(history, 5, 3);
  const last = history[history.length - 1];
  const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
  const unmitigatedLows = swingLows.filter(l => !l.mitigated);
  let mss: 'BULLISH' | 'BEARISH' | null = null;
  if (unmitigatedHighs.length > 0 && last.close > unmitigatedHighs[unmitigatedHighs.length - 1].price) mss = 'BULLISH';
  if (unmitigatedLows.length > 0 && last.close < unmitigatedLows[unmitigatedLows.length - 1].price) mss = 'BEARISH';
  return { mss };
}