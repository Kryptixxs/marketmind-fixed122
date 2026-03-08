'use client';

import React from 'react';
import type { ModuleSlotProps } from './types';

/**
 * News Module – fits any grid cell.
 * Self-contained headline/ticker strip.
 */
export function NewsModule({ slotId, symbol = 'SPY', density = 'default' }: ModuleSlotProps) {
  const pad = density === 'compact' ? 2 : 4;

  return (
    <div
      className="bbg-cell h-full w-full overflow-auto bg-[#000000] border border-[#222]"
      style={{ padding: `${pad}px` }}
      data-slot={slotId}
    >
      <div className="bbg-news-header text-[11px] font-mono text-[#666] uppercase tracking-wider border-b border-[#222] pb-1 mb-1">
        NEWS • {symbol}
      </div>
      <div className="space-y-0.5">
        {['Headline Alpha', 'Headline Beta', 'Headline Gamma'].map((h, i) => (
          <div
            key={i}
            className="text-[11px] font-mono text-[#999] py-0.5 border-b border-[#1a1a1a] last:border-0"
          >
            [{10 + i}:00] {h}
          </div>
        ))}
      </div>
    </div>
  );
}
