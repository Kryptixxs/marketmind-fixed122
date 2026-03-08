'use client';

import { memo } from 'react';
import { TerminalChart } from '@/components/charts/TerminalChart';
import { ModuleChartData, ModuleTableRow } from '@/features/terminal-next/types';
import { MARKET_CHART_CONFIG } from '../marketChartConfig';
import { toneClass } from '../tone';

export const RegimeSnapshotBand = memo(function RegimeSnapshotBand({
  rows,
  chart,
  active,
}: {
  rows: ModuleTableRow[];
  chart: ModuleChartData;
  active: boolean;
}) {
  return (
    <section className={`min-h-0 bg-black border ${active ? 'border-[#2a7b60]' : 'border-[#111]'}`}>
      <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] text-[8px] flex items-center justify-between">
        <span className="text-[#9bc3e8] font-bold">REGIME SNAPSHOT</span>
        <span className="text-[#7f99ba]">PRIMARY</span>
      </div>
      <div className="h-[10px] px-[2px] border-b border-[#111] bg-[#090909] text-[7px] text-[#8ea4bf] truncate">
        {chart.question}
      </div>
      <div className="grid grid-cols-[58%_42%] gap-px bg-black h-[calc(100%-24px)] min-h-0">
        <div className="min-h-0 overflow-y-auto custom-scrollbar">
          {rows.map((row) => (
            <div key={row.key} className="px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] text-[8px]">
              <span className="text-[#93a9c6]">{row.key}</span>
              <span className={`text-right font-bold ${toneClass(row.tone)}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="p-[1px] min-h-0 flex flex-col gap-[1px]">
          <div className={`${MARKET_CHART_CONFIG.mediumHeightClass} min-h-0`}>
            <TerminalChart
              type="bar"
              series={chart.series}
              secondary={chart.secondary}
              labels={chart.labels}
              metricLabel="REGIME GRID"
              metricValue="5D/1M/3M"
            />
          </div>
          <div className={`${MARKET_CHART_CONFIG.compactHeightClass} min-h-0`}>
            <TerminalChart
              type="line"
              series={chart.timeframes?.[0]?.series ?? chart.series}
              secondary={chart.timeframes?.[1]?.series ?? chart.secondary}
              labels={chart.labels}
              metricLabel="NORMALIZED COMPARISON"
              metricValue={MARKET_CHART_CONFIG.timeframeOrder.join('/')}
            />
          </div>
        </div>
      </div>
    </section>
  );
});
