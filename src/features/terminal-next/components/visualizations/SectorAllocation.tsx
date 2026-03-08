'use client';

import React, { memo, useState, useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { clsx } from 'clsx';

/**
 * Donut heatmap: segment color intensity = % change.
 * Bright green +3%, dark green +0.5%, red for negative.
 */
export interface SectorAllocationProps {
  className?: string;
  size?: number;
}

function pctToColor(pct: number): string {
  if (pct >= 2) return '#00FF00';
  if (pct >= 1) return '#00DD00';
  if (pct >= 0.5) return '#00AA00';
  if (pct > 0) return '#006600';
  if (pct === 0) return '#666666';
  if (pct >= -0.5) return '#660000';
  if (pct >= -1) return '#AA0000';
  if (pct >= -2) return '#DD0000';
  return '#FF0000';
}

export const SectorAllocation = memo(function SectorAllocation({
  className = '',
  size = 140,
}: SectorAllocationProps) {
  const { state } = useTerminalStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sectors = state.risk.exposureBySector;
  const total = useMemo(
    () => sectors.reduce((s, x) => s + Math.abs(x.value), 0),
    [sectors]
  );
  const segments = useMemo(() => {
    if (total === 0) return [];
    return sectors.map((s, i) => ({
      ...s,
      index: i,
      pct: (Math.abs(s.value) / total) * 100,
      pctChange: s.pctChange ?? 0,
      color: pctToColor(s.pctChange ?? 0),
    }));
  }, [sectors, total]);

  const paths = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = cx - 6;
    const rInner = rOuter * 0.5;
    let startAngle = -90;

    return segments.map((seg) => {
      const sweep = (seg.pct / 100) * 360;
      const endAngle = startAngle + sweep;

      const x1 = cx + rOuter * Math.cos((startAngle * Math.PI) / 180);
      const y1 = cy + rOuter * Math.sin((startAngle * Math.PI) / 180);
      const x2 = cx + rOuter * Math.cos((endAngle * Math.PI) / 180);
      const y2 = cy + rOuter * Math.sin((endAngle * Math.PI) / 180);
      const x3 = cx + rInner * Math.cos((endAngle * Math.PI) / 180);
      const y3 = cy + rInner * Math.sin((endAngle * Math.PI) / 180);
      const x4 = cx + rInner * Math.cos((startAngle * Math.PI) / 180);
      const y4 = cy + rInner * Math.sin((startAngle * Math.PI) / 180);

      const large = sweep > 180 ? 1 : 0;
      const d = [
        `M ${x1} ${y1}`,
        `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');

      const result = { d, seg, startAngle, endAngle };
      startAngle = endAngle;
      return result;
    });
  }, [segments, size]);

  if (segments.length === 0) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-[#000000] border border-[#222] font-mono text-[10px] text-[#5a6b7a]',
          className
        )}
        style={{ width: size, height: size }}
      >
        No Data
      </div>
    );
  }

  return (
    <div
      className={clsx('relative bg-[#000000] border border-[#222]', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="overflow-visible">
        {paths.map(({ d, seg }, i) => (
          <path
            key={seg.sector}
            d={d}
            fill={seg.color}
            fillOpacity={hoveredIndex === i ? 1 : hoveredIndex !== null ? 0.35 : 0.9}
            stroke="#1a1a1a"
            strokeWidth="1"
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </svg>
      {hoveredIndex !== null && segments[hoveredIndex] && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0a0a0a] border border-[#222] text-[9px] font-mono whitespace-nowrap z-10 pointer-events-none"
          style={{ color: segments[hoveredIndex].color }}
        >
          {segments[hoveredIndex].sector}: {segments[hoveredIndex].pct.toFixed(1)}% •{' '}
          {(segments[hoveredIndex].pctChange ?? 0) >= 0 ? '+' : ''}
          {(segments[hoveredIndex].pctChange ?? 0).toFixed(2)}%
        </div>
      )}
    </div>
  );
});
