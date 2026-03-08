'use client';

import React, { memo, useState, useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { clsx } from 'clsx';

const SECTOR_COLORS = [
  '#00FF00', '#00BFFF', '#FFD700', '#FF6347', '#9370DB',
  '#20B2AA', '#FF69B4', '#FFA500', '#00CED1', '#7CFC00',
];

export interface SectorAllocationDonutProps {
  className?: string;
  size?: number;
}

export const SectorAllocationDonut = memo(function SectorAllocationDonut({ className = '', size = 120 }: SectorAllocationDonutProps) {
  const { state } = useTerminalStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sectors = state.risk.exposureBySector;
  const total = useMemo(() => sectors.reduce((s, x) => s + Math.abs(x.value), 0), [sectors]);
  const segments = useMemo(() => {
    if (total === 0) return [];
    return sectors.map((s, i) => ({
      ...s,
      index: i,
      pct: (Math.abs(s.value) / total) * 100,
      color: SECTOR_COLORS[i % SECTOR_COLORS.length],
    }));
  }, [sectors, total]);

  const paths = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = cx - 4;
    const rInner = rOuter * 0.55;
    let startAngle = -90; // 12 o'clock

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
          'flex items-center justify-center bg-[#000000] border border-[#1a1a1a] font-mono text-[10px] text-[#5a6b7a]',
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
      className={clsx('relative bg-[#000000] border border-[#1a1a1a]', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="overflow-visible">
        {paths.map(({ d, seg }, i) => (
          <path
            key={seg.sector}
            d={d}
            fill={seg.color}
            fillOpacity={hoveredIndex === i ? 1 : hoveredIndex !== null ? 0.3 : 0.85}
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
          className="absolute bottom-0 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-[9px] font-mono whitespace-nowrap z-10 pointer-events-none"
          style={{ color: segments[hoveredIndex].color }}
        >
          {segments[hoveredIndex].sector}: {segments[hoveredIndex].pct.toFixed(1)}%
        </div>
      )}
    </div>
  );
});
