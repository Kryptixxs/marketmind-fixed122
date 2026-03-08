'use client';

import { memo } from 'react';
import { TerminalChart } from '@/components/charts/TerminalChart';
import { ModuleChartData, ModuleTableRow } from '@/features/terminal-next/types';
import { toneClass } from './tone';

export const MarketDeepDetailPanel = memo(function MarketDeepDetailPanel({
  expanded,
  rows,
  chart,
}: {
  expanded: boolean;
  rows: ModuleTableRow[];
  chart: ModuleChartData;
}) {
  if (!expanded) return null;

  return (
    <section className="border border-[#111] bg-black min-h-0">
      <div className="h-[12px] px-[2px] border-b border-[#111] bg-[#090909] text-[7px] flex items-center justify-between">
        <span className="text-[#9bc3e8] font-bold">DEEP DETAIL LAYER</span>
        <span className="text-[#7f99ba]">EXPANDED</span>
      </div>
      <div className="grid grid-cols-[52%_48%] gap-px bg-black h-[120px] min-h-0">
        <div className="min-h-0 overflow-y-auto custom-scrollbar">
          {rows.map((row) => (
            <div key={row.key} className="px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] text-[8px]">
              <span className="text-[#93a9c6]">{row.key}</span>
              <span className={`text-right font-bold ${toneClass(row.tone)}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="p-[1px] min-h-0">
          <TerminalChart
            type="matrix"
            series={chart.series}
            secondary={chart.secondary}
            labels={chart.labels}
            metricLabel="CORRELATION / STRESS MATRIX"
            metricValue="DEEP"
          />
        </div>
      </div>
    </section>
  );
});
