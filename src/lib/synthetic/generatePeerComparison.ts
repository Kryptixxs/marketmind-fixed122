import type { DataProvenance, PeerComparisonDataset } from './contracts';
import { createSeededRandom } from './seed';

export function generatePeerComparison(symbol: string, seed: number): PeerComparisonDataset {
  const rng = createSeededRandom(seed + 701);
  const peerCount = rng.int(5, 10);
  const peers = Array.from({ length: peerCount }, (_, i) => ({
    symbol: `${symbol}${String.fromCharCode(65 + ((i + seed) % 26))}`,
    relativeValuation: Number(rng.float(0.55, 1.85).toFixed(2)),
    relativeGrowth: Number(rng.float(0.45, 1.95).toFixed(2)),
    relativeMargins: Number(rng.float(0.4, 1.9).toFixed(2)),
    relativeRisk: Number(rng.float(0.5, 1.7).toFixed(2)),
    sectorPercentile: Number(rng.float(4, 99).toFixed(2)),
  }));

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generatePeerComparison',
    note: `Deterministic peer set for ${symbol}`,
  };
  return { peers, provenance };
}
