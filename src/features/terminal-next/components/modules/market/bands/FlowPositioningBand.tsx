'use client';

import { memo } from 'react';
import { TerminalChart } from '@/components/charts/TerminalChart';
import { ModuleChartData, ModuleTableRow } from '@/features/terminal-next/types';
import { MARKET_CHART_CONFIG } from '../marketChartConfig';
import { toneClass } from '../tone';

export const FlowPositioningBand = memo(function FlowPositioningBand({
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
        <span className="text-[#9bc3e8] font-bold">FLOW &amp; POSITIONING</span>
        <span className="text-[#7f99ba]">TERTIARY</span>
      </div>
      <div className="h-[10px] px-[2px] border-b border-[#111] bg-[#090909] text-[7px] text-[#8ea4bf] truncate">
        {chart.question}
      </div>
      <div className="grid grid-cols-[56%_44%] gap-px bg-black h-[calc(100%-24px)] min-h-0">
        <div className="min-h-0 overflow-y-auto custom-scrollbar">
          {rows.map((row) => (
            <div key={row.key} className="px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] text-[8px]">
              <span className="text-[#93a9c6]">{row.key}</span>
              <span className={`text-right font-bold ${toneClass(row.tone)}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="p-[1px] min-h-0 grid grid-rows-[1fr_1fr] gap-[1px]">
          <div className="min-h-0">
            <TerminalChart
              type="bar"
              series={chart.series}
              secondary={chart.secondary}
              labels={chart.labels}
              metricLabel="FLOW PRESSURE"
              metricValue="RISK LOAD"
            />
          </div>
          <div className={`${MARKET_CHART_CONFIG.compactHeightClass} min-h-0`}>
            <TerminalChart
              type="line"
              series={chart.timeframes?.[1]?.series ?? chart.series}
              secondary={chart.timeframes?.[0]?.series ?? chart.secondary}
              labels={chart.labels}
              metricLabel="POSITIONING HORIZONS"
              metricValue={MARKET_CHART_CONFIG.timeframeOrder.join('/')}
            />
          </div>
        </div>
      </div>
    </section>
  );
});
