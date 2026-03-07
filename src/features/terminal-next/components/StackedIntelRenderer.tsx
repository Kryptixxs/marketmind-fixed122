'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { DataProvenance } from '@/lib/synthetic/contracts';

export type StackedIntelTone = 'neutral' | 'positive' | 'negative' | 'accent';

export interface StackedIntelRow {
  label: string;
  value: string;
  tone?: StackedIntelTone;
}

export interface StackBlock {
  id: string;
  title: string;
  rows?: StackedIntelRow[];
  visual?: number[];
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

function DenseVisualStrip({ id, values }: { id: string; values: number[] }) {
  const [cursor, setCursor] = useState<number | null>(null);
  const normalized = useMemo(() => normalizeSeries(values), [values]);
  const points = useMemo(
    () =>
      normalized.map((v, idx) => {
        const x = normalized.length <= 1 ? 0 : (idx / (normalized.length - 1)) * 100;
        const y = 100 - v * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }),
    [normalized],
  );
  const polyline = points.join(' ');
  const cursorValue = cursor === null || !normalized.length ? null : normalized[Math.min(cursor, normalized.length - 1)] ?? 0;
  const cursorX = cursor === null || normalized.length <= 1 ? 0 : (Math.min(cursor, normalized.length - 1) / (normalized.length - 1)) * 100;
  const ladder = normalized.slice(-16);

  if (!normalized.length) return null;

  return (
    <div className="border-b border-[#111] bg-[#05080d] px-[2px] py-[1px]">
      <div className="grid grid-cols-[1.6fr_1fr_auto] gap-[2px] items-stretch h-[24px]">
        <div
          className="relative border border-[#111] bg-[#070d16] overflow-hidden"
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const ratio = clamp01((e.clientX - rect.left) / Math.max(rect.width, 1));
            setCursor(Math.round(ratio * (normalized.length - 1)));
          }}
          onMouseLeave={() => setCursor(null)}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-label={`${id}-spark`}>
            <polyline fill="none" stroke="#2f5f8f" strokeWidth="2" points={polyline} />
            {cursorValue !== null ? <line x1={cursorX} y1={0} x2={cursorX} y2={100} stroke="#9bc3e8" strokeWidth="1" opacity="0.8" /> : null}
          </svg>
        </div>
        <div className="grid grid-cols-8 gap-[1px] border border-[#111] bg-[#070d16] p-[1px]">
          {normalized.slice(-24).map((v, idx) => (
            <button
              key={`${id}-heat-${idx}`}
              className="h-[5px] border border-[#0d141f]"
              style={{ backgroundColor: v >= 0.75 ? '#1f6f4f' : v >= 0.5 ? '#245d79' : v >= 0.25 ? '#5a4720' : '#5b1f34' }}
              title={`Heat ${idx + 1}: ${(v * 100).toFixed(1)}`}
            />
          ))}
        </div>
        <div className="w-[22px] border border-[#111] bg-[#070d16] p-[1px] flex flex-col justify-end gap-[1px]">
          {ladder.map((v, idx) => (
            <div
              key={`${id}-ladder-${idx}`}
              className="h-[1px]"
              style={{
                width: `${Math.max(15, Math.round(v * 100))}%`,
                backgroundColor: v >= 0.5 ? '#8cc7f3' : '#7a3a4e',
              }}
            />
          ))}
        </div>
      </div>
      {cursorValue !== null ? (
        <div className="h-[10px] text-[7px] text-[#7fa4c8] flex items-center justify-end">
          <span>CURSOR {(cursorValue * 100).toFixed(1)} | TILE {Math.min((cursor ?? 0) + 1, normalized.length)}</span>
        </div>
      ) : null}
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
            {block.provenance ? (
              <span className="text-[7px] text-[#f4cf76] whitespace-nowrap">{block.provenance.label}</span>
            ) : null}
          </div>
          {block.visual?.length ? <DenseVisualStrip id={block.id} values={block.visual} /> : null}
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
