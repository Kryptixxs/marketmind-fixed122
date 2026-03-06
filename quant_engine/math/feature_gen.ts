import { Bar } from '../core/models';

/**
 * Parkinson Volatility Estimator
 * Uses High/Low prices to provide a more efficient estimate than close-to-close.
 */
export function calculateParkinsonVol(bars: Bar[], window: number = 20): number {
  if (bars.length < window) return 0;
  const slice = bars.slice(-window);
  const sum = slice.reduce((acc, bar) => {
    return acc + Math.pow(Math.log(bar.high / bar.low), 2);
  }, 0);
  return Math.sqrt((1 / (4 * window * Math.log(2))) * sum);
}

/**
 * Fractional Differentiation (Memory Retention)
 * Achieves stationarity while preserving long-memory in price series.
 */
export function fracDiff(series: number[], d: number, threshold: number = 1e-4): number[] {
  const weights = [1];
  for (let k = 1; k < 100; k++) {
    const w = -weights[k - 1] * (d - k + 1) / k;
    if (Math.abs(w) < threshold) break;
    weights.push(w);
  }

  const result: number[] = [];
  for (let i = weights.length; i < series.length; i++) {
    let val = 0;
    for (let k = 0; k < weights.length; k++) {
      val += weights[k] * series[i - k];
    }
    result.push(val);
  }
  return result;
}