'use client';

import { useMemo, useState, type ReactNode } from 'react';
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

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function normalizeSeries(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => clamp01((v - min) / (max - min)));
}

type MiniCandle = { o: number; h: number; l: number; c: number };

function buildCandles(series: number[]): MiniCandle[] {
  const out: MiniCandle[] = [];
  const src = series.slice(-32);
  for (let i = 1; i < src.length; i += 1) {
    const prev = src[i - 1] ?? src[i] ?? 0.5;
    const next = src[i] ?? prev;
    const spread = Math.abs(next - prev) * 0.32 + 0.04;
    out.push({
      o: prev,
      c: next,
      h: Math.min(1, Math.max(prev, next) + spread),
      l: Math.max(0, Math.min(prev, next) - spread),
    });
  }
  return out.length ? out : [{ o: 0.5, h: 0.62, l: 0.38, c: 0.55 }];
}

function buildMatrix(series: number[], rows = 4, cols = 8): number[] {
  const need = rows * cols;
  if (!series.length) return Array.from({ length: need }, () => 0.5);
  const out: number[] = [];
  for (let i = 0; i < need; i += 1) out.push(series[i % series.length] ?? 0.5);
  return out;
}

function visualTheme(kind: StackVisualKind) {
  if (kind === 'execution_microstructure') return { top: '#4ce0a5', bottom: '#8cc7f3', label: 'DEPTH/IMB' };
  if (kind === 'price_technical') return { top: '#f4cf76', bottom: '#8cc7f3', label: 'PX/TA' };
  if (kind === 'financial_trajectory') return { top: '#63c8ff', bottom: '#4ce0a5', label: 'REV/MRG' };
  if (kind === 'allocation_drift') return { top: '#95ca2d', bottom: '#f4cf76', label: 'ALLOC/DRIFT' };
  if (kind === 'breadth_grid') return { top: '#9bc3e8', bottom: '#4ce0a5', label: 'BREADTH/XA' };
  if (kind === 'ownership_flow') return { top: '#ffb066', bottom: '#ff7ca3', label: 'OWN/FLOW' };
  if (kind === 'event_timeline') return { top: '#ff7ca3', bottom: '#f4cf76', label: 'EVENT/IMP' };
  if (kind === 'options_surface') return { top: '#63c8ff', bottom: '#ff7ca3', label: 'IV/SKEW' };
  if (kind === 'yield_curve') return { top: '#8cc7f3', bottom: '#f4cf76', label: 'YLD/SPR' };
  return { top: '#f4cf76', bottom: '#8cc7f3', label: 'NEWS/FLOW' };
}

function DenseChartDeck({ id, visual }: { id: string; visual: StackVisualSpec }) {
  const [focus, setFocus] = useState<number | null>(null);
  const primary = useMemo(() => normalizeSeries(visual.series), [visual.series]);
  const secondary = useMemo(() => normalizeSeries((visual.secondary?.length ? visual.secondary : visual.series).slice(-primary.length || undefined)), [primary.length, visual.secondary, visual.series]);
  const candles = useMemo(() => buildCandles(primary), [primary]);
  const matrix = useMemo(() => buildMatrix(primary.slice(-32), 4, 8), [primary]);
  const points = useMemo(
    () =>
      primary.map((v, idx) => {
        const x = primary.length <= 1 ? 0 : (idx / (primary.length - 1)) * 100;
        const y = 100 - v * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }),
    [primary],
  );
  const secondaryPoints = useMemo(
    () =>
      secondary.map((v, idx) => {
        const x = secondary.length <= 1 ? 0 : (idx / (secondary.length - 1)) * 100;
        const y = 100 - v * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }),
    [secondary],
  );

  if (!primary.length) return null;

  const idx = focus ?? (primary.length - 1);
  const safeIdx = Math.min(Math.max(idx, 0), primary.length - 1);
  const p = primary[safeIdx] ?? 0;
  const prev = primary[Math.max(0, safeIdx - 1)] ?? p;
  const chg = p - prev;
  const x = primary.length <= 1 ? 0 : (safeIdx / (primary.length - 1)) * 100;
  const theme = visualTheme(visual.kind);
  const ladder = primary.slice(-16);

  return (
    <div className="border-b border-[#111] bg-[#05080d] px-[2px] py-[1px]">
      <div className="grid grid-cols-[1.55fr_1.05fr_58px] gap-[2px] h-[44px]">
        <div
          className="grid grid-rows-2 gap-[1px]"
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const ratio = clamp01((e.clientX - rect.left) / Math.max(rect.width, 1));
            setFocus(Math.round(ratio * (primary.length - 1)));
          }}
          onMouseLeave={() => setFocus(null)}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full border border-[#0f1725] bg-[#081321]">
            {candles.map((c, i) => {
              const cx = ((i + 0.5) / candles.length) * 100;
              const w = Math.max(0.9, 70 / candles.length);
              const yo = 100 - c.o * 100;
              const yc = 100 - c.c * 100;
              const yh = 100 - c.h * 100;
              const yl = 100 - c.l * 100;
              const up = c.c >= c.o;
              return (
                <g key={`${id}-c-${i}`}>
                  <line x1={cx} y1={yh} x2={cx} y2={yl} stroke={up ? theme.top : '#ff7ca3'} strokeWidth="0.9" />
                  <rect x={cx - w / 2} y={Math.min(yo, yc)} width={w} height={Math.max(1.2, Math.abs(yc - yo))} fill={up ? '#165740' : '#4e1f31'} stroke={up ? theme.top : '#ff7ca3'} strokeWidth="0.4" />
                </g>
              );
            })}
            <line x1={x} y1={0} x2={x} y2={100} stroke="#f4cf76" strokeWidth="0.8" opacity="0.8" />
          </svg>
          <svg viewBox="0 0 100 100" className="w-full h-full border border-[#0f1725] bg-[#081321]">
            <polyline fill="none" stroke={theme.bottom} strokeWidth="1.8" points={points.join(' ')} />
            <polyline fill="none" stroke={theme.top} strokeWidth="1.1" points={secondaryPoints.join(' ')} opacity="0.8" />
            {primary.map((v, i) => {
              const bx = primary.length <= 1 ? 0 : (i / (primary.length - 1)) * 100;
              const bh = 8 + v * 24;
              return <line key={`${id}-b-${i}`} x1={bx} y1={100} x2={bx} y2={100 - bh} stroke="#6d4d2b" strokeWidth="0.7" />;
            })}
          </svg>
        </div>
        <div className="grid grid-cols-8 grid-rows-4 gap-[1px] border border-[#0f1725] bg-[#081321] p-[1px]">
          {matrix.map((v, i) => {
            const globalIdx = Math.min(primary.length - 1, i + Math.max(0, primary.length - matrix.length));
            const active = globalIdx === safeIdx;
            return (
              <button
                key={`${id}-m-${i}`}
                onClick={() => setFocus(globalIdx)}
                className={`h-[8px] border ${active ? 'border-[#f4cf76]' : 'border-[#0d141f]'}`}
                style={{ backgroundColor: v >= 0.8 ? '#0e8f59' : v >= 0.6 ? '#2d5f80' : v >= 0.4 ? '#6f5222' : v >= 0.2 ? '#5b1f34' : '#351722' }}
              />
            );
          })}
        </div>
        <div className="border border-[#0f1725] bg-[#081321] p-[1px] flex flex-col gap-[1px]">
          <div className="h-[8px] border border-[#0d141f] px-[1px] text-[6px] text-[#9bc3e8] flex items-center justify-between">
            <span>{theme.label.slice(0, 3)}</span>
            <span>{(p * 100).toFixed(1)}</span>
          </div>
          <div className="h-[8px] border border-[#0d141f] px-[1px] text-[6px] flex items-center justify-between">
            <span className="text-[#8ea2bd]">Δ</span>
            <span className={chg >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{chg >= 0 ? '+' : ''}{(chg * 100).toFixed(1)}</span>
          </div>
          <div className="flex-1 border border-[#0d141f] p-[1px] flex flex-col justify-end gap-[1px]">
            {ladder.map((v, i) => (
              <div
                key={`${id}-l-${i}`}
                className="h-[1px]"
                style={{
                  width: `${Math.max(16, Math.round(v * 100))}%`,
                  backgroundColor: v >= 0.5 ? theme.bottom : '#7a3a4e',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="h-[10px] text-[7px] text-[#7fa4c8] flex items-center justify-between">
        <span>{theme.label}</span>
        <span>{(visual.labels?.[safeIdx] ?? `T${safeIdx + 1}`).slice(0, 20)} | IDX {safeIdx + 1}</span>
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
