'use client';

import { TerminalChart } from '@/components/charts/TerminalChart';
import type { HistoricalEarningsRow } from '@/app/actions/fetchHistoricalEarnings';

function normalize(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

export function EarningsHistoryChart({ data }: { data: HistoricalEarningsRow[] }) {
  if (!data?.length) return null;
  const epsValues = data.map((r) => r.epsAct ?? r.epsEst ?? 0);
  const surpriseValues = data.map((r) => (r.surprise ?? 0) / 100);
  const epsNorm = normalize(epsValues);
  const surpriseNorm = normalize(surpriseValues);

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <TerminalChart
        type="bar"
        series={epsNorm}
        secondary={surpriseNorm}
        labels={data.map((r) => (`${r.year ?? ''}${r.quarter ?? ''}`.trim() || r.date?.slice(2, 7) || 'Q'))}
        metricLabel="EPS / SURPRISE"
        metricValue={`${(epsValues.at(-1) ?? 0).toFixed(2)} | ${(data.at(-1)?.surprise ?? 0).toFixed(1)}%`}
      />
    </div>
  );
}
