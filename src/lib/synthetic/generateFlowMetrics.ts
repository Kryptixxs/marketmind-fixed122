import type { DataProvenance, FlowMetricsDataset } from './contracts';
import { createSeededRandom, toDateISO } from './seed';

export function generateFlowMetrics(symbol: string, seed: number): FlowMetricsDataset {
  const rng = createSeededRandom(seed + 601);
  const shortInterestTrend = Array.from({ length: 80 }, (_, i) => ({
    date: toDateISO(i * 7),
    shortPctFloat: Number((rng.float(1.2, 11.8) + Math.sin((seed + i) * 0.14) * 1.2).toFixed(2)),
  })).reverse();

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateFlowMetrics',
    note: `Deterministic flow and positioning for ${symbol}`,
  };

  return {
    etfOwnershipPct: Number(rng.float(4, 39).toFixed(2)),
    passiveIndexWeightPct: Number(rng.float(0.2, 8.5).toFixed(2)),
    institutionalOwnershipPct: Number(rng.float(28, 91).toFixed(2)),
    shortInterestTrend,
    borrowCostPct: Number(rng.float(0.2, 9.5).toFixed(2)),
    volatilityPercentile: Number(rng.float(8, 98).toFixed(2)),
    provenance,
  };
}
