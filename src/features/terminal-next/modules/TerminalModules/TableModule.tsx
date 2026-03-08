'use client';

import React from 'react';
import type { ModuleSlotProps } from './types';

/**
 * Table Module – fits any grid cell.
 * Self-contained, zero-margin aesthetic.
 */
export function TableModule({ slotId, symbol = 'SPY', density = 'default' }: ModuleSlotProps) {
  const pad = density === 'compact' ? 2 : 4;

  return (
    <div
      className="bbg-cell h-full w-full overflow-auto bg-[#000000] border border-[#222]"
      style={{ padding: `${pad}px` }}
      data-slot={slotId}
    >
      <div className="bbg-table-header text-[11px] font-mono text-[#666] uppercase tracking-wider border-b border-[#222] pb-1 mb-1">
        TABLE • {symbol}
      </div>
      <table className="w-full text-[11px] font-mono" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#666]">
            <th className="text-left py-0.5 pr-2 border-b border-[#222]">Symbol</th>
            <th className="text-right py-0.5 pr-2 border-b border-[#222]">Last</th>
            <th className="text-right py-0.5 pr-2 border-b border-[#222]">Chg</th>
          </tr>
        </thead>
        <tbody className="text-[#ccc]">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b border-[#1a1a1a]">
              <td className="py-0.5 pr-2">SYM{i}</td>
              <td className="text-right py-0.5 pr-2 tabular-nums">100.0{i}</td>
              <td className="text-right py-0.5 pr-2 tabular-nums text-[#4ce0a5]">+0.{i}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
