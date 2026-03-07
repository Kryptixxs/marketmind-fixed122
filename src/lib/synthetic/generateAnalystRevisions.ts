import type { AnalystRevisionRow, AnalystRevisionsDataset, DataProvenance } from './contracts';
import { createSeededRandom, toDateISO } from './seed';

export function generateAnalystRevisions(symbol: string, seed: number): AnalystRevisionsDataset {
  const rng = createSeededRandom(seed + 211);
  const rows: AnalystRevisionRow[] = [];
  const points = 20;
  let eps = rng.float(0.8, 8.5);
  let target = rng.float(28, 420);

  for (let i = points - 1; i >= 0; i -= 1) {
    const quarterOffset = points - i;
    const q = ((quarterOffset - 1) % 4) + 1;
    const year = new Date().getFullYear() - Math.floor((quarterOffset - 1) / 4);
    const drift = Math.sin((seed + i) * 0.41) * 0.22 + rng.float(-0.06, 0.08);
    const revDelta = Number((drift * 100).toFixed(2));
    eps = Number((Math.max(0.01, eps * (1 + drift))).toFixed(2));
    const surprisePct = Number((Math.sin((seed + i) * 0.23) * 10 + rng.float(-2.4, 2.4)).toFixed(2));
    const targetDeltaPct = Number((Math.cos((seed + i) * 0.2) * 3.2 + rng.float(-1.1, 1.1)).toFixed(2));
    target = Number((Math.max(5, target * (1 + targetDeltaPct / 100))).toFixed(2));

    rows.push({
      date: toDateISO(i * 90),
      quarter: `${year}Q${q}`,
      epsEstimate: eps,
      epsRevisionDeltaPct: revDelta,
      surprisePct,
      targetPrice: target,
      targetDeltaPct,
    });
  }

  const positives = rows.filter((r) => r.epsRevisionDeltaPct > 0).length;
  const negatives = rows.filter((r) => r.epsRevisionDeltaPct < 0).length;
  const revisionTrendScore = Number((((positives - negatives) / Math.max(1, rows.length)) * 100).toFixed(2));
  const mean = rows.reduce((acc, r) => acc + r.epsEstimate, 0) / Math.max(1, rows.length);
  const dispersion = Math.sqrt(rows.reduce((acc, r) => acc + Math.pow(r.epsEstimate - mean, 2), 0) / Math.max(1, rows.length));

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateAnalystRevisions',
    note: `Deterministic quarterly revisions for ${symbol}`,
  };

  return {
    rows,
    revisionTrendScore,
    consensusDispersion: Number(dispersion.toFixed(3)),
    provenance,
  };
}
