import type { DataProvenance, FinancialHistoryDataset, TrendDirection, YearMetricPoint } from './contracts';
import { createSeededRandom } from './seed';

function yoy(current: number, previous: number): number {
  if (!previous) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0;
  return Number(((Math.pow(end / start, 1 / years) - 1) * 100).toFixed(2));
}

function slope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((acc, v) => acc + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }
  return Number((num / Math.max(1e-9, den)).toFixed(4));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return Number(sorted[idx].toFixed(2));
}

function trendFrom(points: YearMetricPoint[]): TrendDirection {
  if (points.length < 3) return 'FLAT';
  const first = points[0]?.revenue ?? 0;
  const last = points[points.length - 1]?.revenue ?? 0;
  const delta = ((last - first) / Math.max(1, first)) * 100;
  if (delta > 6) return 'UP';
  if (delta < -6) return 'DOWN';
  return 'FLAT';
}

export function generateFinancialHistory(symbol: string, seed: number): FinancialHistoryDataset {
  const rng = createSeededRandom(seed + 101);
  const now = new Date().getFullYear();
  const years = 10;
  const points: YearMetricPoint[] = [];

  const baseRevenue = rng.float(30_000, 280_000);
  const cycleBias = rng.float(-0.015, 0.03);
  let revenue = baseRevenue;
  let debt = baseRevenue * rng.float(0.2, 0.65);

  for (let i = years - 1; i >= 0; i -= 1) {
    const year = now - i;
    const cycle = Math.sin((seed + i) * 0.32) * 0.035;
    const drift = 0.045 + cycleBias + cycle;
    revenue *= 1 + drift;

    const marginPct = Number((rng.float(12, 34) + Math.sin((seed + i) * 0.17) * 2.2).toFixed(2));
    const ebitda = Number((revenue * (marginPct / 100)).toFixed(2));
    const netIncome = Number((ebitda * rng.float(0.55, 0.78)).toFixed(2));
    const fcf = Number((netIncome * rng.float(0.72, 1.08)).toFixed(2));
    debt = Number((Math.max(500, debt * (1 + rng.float(-0.07, 0.04)))).toFixed(2));

    const previous = points[points.length - 1];
    points.push({
      year,
      revenue: Number(revenue.toFixed(2)),
      ebitda,
      netIncome,
      fcf,
      marginPct,
      debt,
      yoyRevenuePct: yoy(revenue, previous?.revenue ?? revenue),
      yoyEbitdaPct: yoy(ebitda, previous?.ebitda ?? ebitda),
      yoyNetIncomePct: yoy(netIncome, previous?.netIncome ?? netIncome),
      yoyFcfPct: yoy(fcf, previous?.fcf ?? fcf),
    });
  }

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateFinancialHistory',
    note: `Deterministic 10Y curve for ${symbol}`,
  };

  return {
    points,
    cagrRevenuePct: cagr(points[0]?.revenue ?? 1, points[points.length - 1]?.revenue ?? 1, points.length - 1),
    cagrEbitdaPct: cagr(points[0]?.ebitda ?? 1, points[points.length - 1]?.ebitda ?? 1, points.length - 1),
    cagrNetIncomePct: cagr(points[0]?.netIncome ?? 1, points[points.length - 1]?.netIncome ?? 1, points.length - 1),
    cagrFcfPct: cagr(points[0]?.fcf ?? 1, points[points.length - 1]?.fcf ?? 1, points.length - 1),
    slopeRevenue: slope(points.map((p) => p.revenue)),
    slopeEbitda: slope(points.map((p) => p.ebitda)),
    slopeNetIncome: slope(points.map((p) => p.netIncome)),
    slopeFcf: slope(points.map((p) => p.fcf)),
    percentileBands: {
      revenue: {
        p10: percentile(points.map((p) => p.revenue), 10),
        p50: percentile(points.map((p) => p.revenue), 50),
        p90: percentile(points.map((p) => p.revenue), 90),
      },
      ebitda: {
        p10: percentile(points.map((p) => p.ebitda), 10),
        p50: percentile(points.map((p) => p.ebitda), 50),
        p90: percentile(points.map((p) => p.ebitda), 90),
      },
      netIncome: {
        p10: percentile(points.map((p) => p.netIncome), 10),
        p50: percentile(points.map((p) => p.netIncome), 50),
        p90: percentile(points.map((p) => p.netIncome), 90),
      },
      fcf: {
        p10: percentile(points.map((p) => p.fcf), 10),
        p50: percentile(points.map((p) => p.fcf), 50),
        p90: percentile(points.map((p) => p.fcf), 90),
      },
      marginPct: {
        p10: percentile(points.map((p) => p.marginPct), 10),
        p50: percentile(points.map((p) => p.marginPct), 50),
        p90: percentile(points.map((p) => p.marginPct), 90),
      },
      debt: {
        p10: percentile(points.map((p) => p.debt), 10),
        p50: percentile(points.map((p) => p.debt), 50),
        p90: percentile(points.map((p) => p.debt), 90),
      },
    },
    trend: trendFrom(points),
    provenance,
  };
}
