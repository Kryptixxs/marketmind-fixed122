'use client';

import React from 'react';
import type { ModuleSlotProps } from './types';

/**
 * Chart Module – fits any grid cell.
 * Placeholder for lightweight-charts or similar; self-contained.
 */
export function ChartModule({ slotId, symbol = 'SPY', density = 'default' }: ModuleSlotProps) {
  const pad = density === 'compact' ? 2 : 4;

  return (
    <div
      className="bbg-cell h-full w-full overflow-hidden bg-[#000000] border border-[#222] flex flex-col"
      style={{ padding: `${pad}px` }}
      data-slot={slotId}
    >
      <div className="bbg-chart-header text-[11px] font-mono text-[#666] uppercase tracking-wider border-b border-[#222] pb-1 mb-1 shrink-0">
        CHART • {symbol}
      </div>
      <div className="flex-1 min-h-0 bg-[#050505] border border-[#1a1a1a] flex items-center justify-center">
        <span className="text-[10px] text-[#444] font-mono">[ Chart canvas ]</span>
      </div>
    </div>
  );
}
