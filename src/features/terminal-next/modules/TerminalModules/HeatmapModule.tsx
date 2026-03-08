'use client';

import React from 'react';
import type { ModuleSlotProps } from './types';

/**
 * Heatmap Module – fits any grid cell.
 * Placeholder for sector/heatmap visualization.
 */
export function HeatmapModule({ slotId, symbol = 'SPY', density = 'default' }: ModuleSlotProps) {
  const pad = density === 'compact' ? 2 : 4;

  return (
    <div
      className="bbg-cell h-full w-full overflow-hidden bg-[#000000] border border-[#222] flex flex-col"
      style={{ padding: `${pad}px` }}
      data-slot={slotId}
    >
      <div className="bbg-heatmap-header text-[11px] font-mono text-[#666] uppercase tracking-wider border-b border-[#222] pb-1 mb-1 shrink-0">
        HEATMAP • {symbol}
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-3 gap-px bg-[#222]">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[9px] font-mono text-[#555] bg-[#0a0a0a]"
            style={{
              backgroundColor: `hsl(${220 - i * 15}, 40%, ${8 + i * 4}%)`,
              color: i > 4 ? '#fff' : '#666',
            }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}
