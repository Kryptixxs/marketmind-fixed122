import type { DataProvenance, RiskProfileDataset } from './contracts';
import { createSeededRandom } from './seed';

export function generateRiskProfile(symbol: string, seed: number): RiskProfileDataset {
  const rng = createSeededRandom(seed + 503);
  const baseDebt = rng.float(12_000, 85_000);
  const debtMaturityLadder = [
    { bucket: '<1Y', amount: Number((baseDebt * rng.float(0.08, 0.18)).toFixed(2)), pctOfDebt: 0 },
    { bucket: '1-3Y', amount: Number((baseDebt * rng.float(0.18, 0.28)).toFixed(2)), pctOfDebt: 0 },
    { bucket: '3-5Y', amount: Number((baseDebt * rng.float(0.2, 0.32)).toFixed(2)), pctOfDebt: 0 },
    { bucket: '5-10Y', amount: Number((baseDebt * rng.float(0.22, 0.36)).toFixed(2)), pctOfDebt: 0 },
    { bucket: '10Y+', amount: Number((baseDebt * rng.float(0.08, 0.17)).toFixed(2)), pctOfDebt: 0 },
  ];
  const totalDebt = debtMaturityLadder.reduce((acc, item) => acc + item.amount, 0);
  debtMaturityLadder.forEach((item) => {
    item.pctOfDebt = Number(((item.amount / Math.max(1, totalDebt)) * 100).toFixed(2));
  });

  const now = new Date().getFullYear();
  const interestCoverageTrend = Array.from({ length: 10 }, (_, i) => {
    const year = now - (9 - i);
    const ratio = Number((rng.float(2.1, 8.2) + Math.sin((seed + i) * 0.3) * 0.7).toFixed(2));
    return { year, ratio };
  });

  const countryRevenuePct = [
    { country: 'US', pct: Number(rng.float(28, 47).toFixed(2)) },
    { country: 'EU', pct: Number(rng.float(12, 25).toFixed(2)) },
    { country: 'APAC', pct: Number(rng.float(15, 28).toFixed(2)) },
    { country: 'LATAM', pct: Number(rng.float(4, 10).toFixed(2)) },
    { country: 'MEA', pct: Number(rng.float(3, 8).toFixed(2)) },
  ];
  const countryTotal = countryRevenuePct.reduce((acc, c) => acc + c.pct, 0);
  countryRevenuePct.forEach((c) => {
    c.pct = Number(((c.pct / Math.max(1, countryTotal)) * 100).toFixed(2));
  });

  const fxExposurePct = [
    { currency: 'USD', pct: Number(rng.float(40, 60).toFixed(2)) },
    { currency: 'EUR', pct: Number(rng.float(12, 26).toFixed(2)) },
    { currency: 'JPY', pct: Number(rng.float(5, 13).toFixed(2)) },
    { currency: 'GBP', pct: Number(rng.float(3, 9).toFixed(2)) },
    { currency: 'CNY', pct: Number(rng.float(8, 18).toFixed(2)) },
  ];
  const fxTotal = fxExposurePct.reduce((acc, x) => acc + x.pct, 0);
  fxExposurePct.forEach((x) => {
    x.pct = Number(((x.pct / Math.max(1, fxTotal)) * 100).toFixed(2));
  });

  const regulatoryRiskScore = Number(rng.float(18, 87).toFixed(2));
  const sanctionsRiskFlag = countryRevenuePct.some((c) => c.country === 'MEA' && c.pct > 7.5) || regulatoryRiskScore > 72;

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateRiskProfile',
    note: `Deterministic risk profile for ${symbol}`,
  };

  return {
    debtMaturityLadder,
    interestCoverageTrend,
    countryRevenuePct,
    fxExposurePct,
    sanctionsRiskFlag,
    regulatoryRiskScore,
    provenance,
  };
}
