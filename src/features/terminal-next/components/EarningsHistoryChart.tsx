'use client';

import type { HistoricalEarningsRow } from '@/app/actions/fetchHistoricalEarnings';

export function EarningsHistoryChart({ data }: { data: HistoricalEarningsRow[] }) {
  if (!data?.length) return null;
  const epsValues = data.map((r) => r.epsAct ?? r.epsEst ?? 0).filter((v) => v > 0);
  const maxEps = Math.max(...epsValues, 0.01);
  const labels = data.slice(0, 12).map((r) => (`${r.year} ${r.quarter}`.trim() || r.date?.slice(0, 7)) ?? '');

  return (
    <div className="w-full h-full min-h-[80px] flex flex-col">
      <div className="flex-1 flex items-end gap-[2px] px-1 py-1">
        {data.slice(0, 12).map((r, i) => {
          const val = r.epsAct ?? r.epsEst ?? 0;
          const h = maxEps > 0 ? Math.max(4, (val / maxEps) * 100) : 0;
          const beat = r.surprise != null && r.surprise > 0;
          return (
            <div
              key={`${r.date}-${i}`}
              className="flex-1 flex flex-col items-center gap-[1px]"
              title={`${r.date} EPS: ${val} ${r.surprise != null ? `(${r.surprise > 0 ? '+' : ''}${r.surprise}% surprise)` : ''}`}
            >
              <div
                className="w-full rounded-t-[1px] min-h-[2px] transition-all"
                style={{
                  height: `${h}%`,
                  backgroundColor: beat ? '#4ce0a5' : r.surprise != null && r.surprise < 0 ? '#ff7ca3' : '#63c8ff',
                }}
              />
              <span className="text-[6px] text-gray-400 truncate max-w-full">{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <div className="text-[7px] text-gray-400 px-1 border-t border-[#1a1a1a] flex justify-between">
        <span>EPS (bars)</span>
        <span>Green=Beat Red=Miss</span>
      </div>
    </div>
  );
}
