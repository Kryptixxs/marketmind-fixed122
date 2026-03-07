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

export function StackedIntelRenderer({ blocks, className }: { blocks: StackBlock[]; className?: string }) {
  return (
    <div className={`flex flex-col overflow-y-auto h-full min-h-0 custom-scrollbar ${className ?? ''}`}>
      {blocks.map((block) => (
        <div key={block.id} className="border-b border-[#1a1a1a]">
          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center justify-between">
            <span>{block.title}</span>
            {block.provenance ? (
              <span className="text-[8px] text-[#f4cf76]">{block.provenance.label}</span>
            ) : null}
          </div>
          {block.render ? (
            block.render()
          ) : (
            <>
              {(block.rows ?? []).map((row, idx) => (
                <div key={`${block.id}-${idx}-${row.label}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_1fr] gap-1">
                  <span className="text-[#93a9c6] truncate">{row.label}</span>
                  <span className={`${toneClass[row.tone ?? 'neutral']} truncate text-right font-bold`}>{row.value}</span>
                </div>
              ))}
            </>
          )}
          {block.reason ? <div className="text-[8px] px-1 py-[1px] text-[#7fa4c8]">CHAIN: {block.reason}</div> : null}
        </div>
      ))}
    </div>
  );
}
