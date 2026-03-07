'use client';

import type { ReactNode } from 'react';
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
