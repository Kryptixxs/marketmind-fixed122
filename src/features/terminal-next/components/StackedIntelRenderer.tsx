'use client';

import type { ReactNode } from 'react';
import { TerminalChart, type TerminalChartType } from '@/components/charts/TerminalChart';
import type { DataProvenance } from '@/lib/synthetic/contracts';

export type StackedIntelTone = 'neutral' | 'positive' | 'negative' | 'accent';

export interface StackedIntelRow {
  label: string;
  value: string;
  tone?: StackedIntelTone;
}

export type StackVisualKind =
  | 'execution_microstructure'
  | 'price_technical'
  | 'financial_trajectory'
  | 'allocation_drift'
  | 'breadth_grid'
  | 'ownership_flow'
  | 'event_timeline'
  | 'options_surface'
  | 'yield_curve'
  | 'news_flow';

export interface StackVisualSpec {
  kind: StackVisualKind;
  series: number[];
  secondary?: number[];
  labels?: string[];
}

export interface StackBlock {
  id: string;
  title: string;
  rows?: StackedIntelRow[];
  visual?: StackVisualSpec;
  render?: () => ReactNode;
  provenance?: DataProvenance;
  reason?: string;
}

const toneClass: Record<StackedIntelTone, string> = {
  neutral: 'text-[#d8e6f8]',
  positive: 'text-[#4ce0a5]',
  negative: 'text-[#ff7ca3]',
  accent: 'text-[#8cc7f3]',
};

const EMPTY_BLOCK_ROWS: StackedIntelRow[] = [
  { label: 'STATUS', value: 'DATA PIPELINE STANDBY', tone: 'accent' },
  { label: 'SOURCE', value: 'SIMULATED FALLBACK', tone: 'neutral' },
  { label: 'ACTION', value: 'WAITING FOR NEXT UPDATE', tone: 'neutral' },
];

function matrixFromSeries(series: number[]): number[][] {
  const src = series.length ? series : [0.5];
  const out: number[][] = [];
  for (let r = 0; r < 4; r += 1) {
    out.push([]);
    for (let c = 0; c < 8; c += 1) out[r]!.push(src[(r * 8 + c) % src.length] ?? 0.5);
  }
  return out;
}

function chartTypes(kind: StackVisualKind): {
  primary: TerminalChartType;
  secondary: TerminalChartType;
  matrix: TerminalChartType;
  microA: TerminalChartType;
  microB: TerminalChartType;
  label: string;
} {
  if (kind === 'execution_microstructure') return { primary: 'depth', secondary: 'line', matrix: 'heatmap', microA: 'ladder', microB: 'depth', label: 'DEPTH/IMB' };
  if (kind === 'price_technical') return { primary: 'candles', secondary: 'area', matrix: 'matrix', microA: 'line', microB: 'ladder', label: 'PX/TA' };
  if (kind === 'financial_trajectory') return { primary: 'bar', secondary: 'line', matrix: 'matrix', microA: 'area', microB: 'ladder', label: 'REV/MRG' };
  if (kind === 'allocation_drift') return { primary: 'area', secondary: 'line', matrix: 'matrix', microA: 'bar', microB: 'ladder', label: 'ALLOC/DRIFT' };
  if (kind === 'breadth_grid') return { primary: 'line', secondary: 'area', matrix: 'matrix', microA: 'depth', microB: 'ladder', label: 'BREADTH/XA' };
  if (kind === 'ownership_flow') return { primary: 'bar', secondary: 'depth', matrix: 'matrix', microA: 'line', microB: 'ladder', label: 'OWN/FLOW' };
  if (kind === 'event_timeline') return { primary: 'line', secondary: 'bar', matrix: 'matrix', microA: 'area', microB: 'ladder', label: 'EVENT/IMP' };
  if (kind === 'options_surface') return { primary: 'surface', secondary: 'line', matrix: 'heatmap', microA: 'depth', microB: 'ladder', label: 'IV/SKEW' };
  if (kind === 'yield_curve') return { primary: 'line', secondary: 'area', matrix: 'matrix', microA: 'depth', microB: 'ladder', label: 'YLD/SPR' };
  return { primary: 'line', secondary: 'bar', matrix: 'matrix', microA: 'area', microB: 'ladder', label: 'NEWS/FLOW' };
}

function DenseChartDeck({ id, visual }: { id: string; visual: StackVisualSpec }) {
  const types = chartTypes(visual.kind);
  const series = visual.series;
  const secondary = visual.secondary ?? visual.series;
  const candles = series.slice(-42).map((v, i) => {
    const prev = series[i - 1] ?? v;
    const diff = (v - prev) * 0.22;
    const open = prev;
    const close = v;
    const high = Math.max(open, close) + Math.abs(diff) + 0.06;
    const low = Math.min(open, close) - Math.abs(diff) - 0.06;
    return { open, high, low, close };
  });

  return (
    <div className="border-b border-[#111] bg-[#05080d] px-[2px] py-[1px]">
      <div className="h-[12px] px-[2px] border-b border-[#111] text-[7px] text-[#8ea4bf] grid grid-cols-4 gap-[2px] items-center">
        <span className="truncate">{types.label}</span>
        <span className="text-right">PX {(series.at(-1) ?? 0).toFixed(2)}</span>
        <span className="text-right">Δ {((series.at(-1) ?? 0) - (series.at(-2) ?? 0)).toFixed(2)}</span>
        <span className="text-right">N {series.length}</span>
      </div>
      <div className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr] gap-[1px] h-[72px]">
        <div className="min-h-0">
          <TerminalChart showHeader={false} type={types.primary} series={series} secondary={secondary} candles={candles} labels={visual.labels} />
        </div>
        <div className="min-h-0">
          <TerminalChart showHeader={false} type={types.secondary} series={series} secondary={secondary} labels={visual.labels} />
        </div>
        <div className="min-h-0">
          <TerminalChart showHeader={false} type={types.matrix} series={series} secondary={secondary} matrix={matrixFromSeries(series)} labels={visual.labels} />
        </div>
        <div className="grid grid-rows-2 gap-[1px] min-h-0">
          <TerminalChart showHeader={false} type={types.microA} series={series} secondary={secondary} labels={visual.labels} />
          <TerminalChart showHeader={false} type={types.microB} series={series} secondary={secondary} labels={visual.labels} />
        </div>
      </div>
      <div className="h-[10px] text-[7px] text-[#7fa4c8] flex items-center justify-between">
        <span>{types.label}</span>
        <span>{(visual.labels?.at(-1) ?? 'T').slice(0, 16)} | N {series.length}</span>
      </div>
    </div>
  );
}

export function StackedIntelRenderer({ blocks, className }: { blocks: StackBlock[]; className?: string }) {
  return (
    <div className={`flex flex-col flex-1 w-full min-w-0 min-h-0 overflow-y-auto custom-scrollbar font-mono tracking-tight uppercase tabular-nums ${className ?? ''}`}>
      {blocks.map((block) => (
        <div key={block.id} className="border-b border-[#1a1a1a]">
          <div className="h-[14px] px-[2px] border-b border-[#111] text-[8px] text-[#9bc3e8] flex items-center justify-between leading-none">
            <span className="truncate">{block.title}</span>
            {block.provenance ? <span className="text-[7px] text-[#f4cf76] whitespace-nowrap">{block.provenance.label}</span> : null}
          </div>
          {block.visual ? <DenseChartDeck id={block.id} visual={block.visual} /> : null}
          {block.render ? (
            block.render()
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-px bg-[#090f18]">
              {((block.rows?.length ?? 0) > 0 ? block.rows! : EMPTY_BLOCK_ROWS).map((row, idx) => (
                <div key={`${block.id}-${idx}-${row.label}`} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] leading-none">
                  <span className="text-[#93a9c6] whitespace-nowrap">{row.label}</span>
                  <span className={`${toneClass[row.tone ?? 'neutral']} truncate text-right font-bold`}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
          {block.reason ? <div className="text-[7px] px-[2px] py-[1px] text-[#7fa4c8] border-t border-[#111]">CHAIN: {block.reason}</div> : null}
        </div>
      ))}
    </div>
  );
}
