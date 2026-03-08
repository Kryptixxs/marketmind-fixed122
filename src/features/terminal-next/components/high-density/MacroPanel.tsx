'use client';

import React, { useMemo } from 'react';
import { clsx } from 'clsx';

export interface MacroIndicator {
  id: string;
  label: string;
  value: string;
  change?: number;
  sparkline?: number[];
}

export interface MacroPanelProps {
  indicators: MacroIndicator[];
  className?: string;
}

function TinySparkline({ data }: { data: number[] }) {
  const path = useMemo(() => {
    if (!data.length) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 48;
    const h = 16;
    const pts = data.map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return `M ${pts.join(' L ')}`;
  }, [data]);

  return (
    <svg
      viewBox="0 0 48 16"
      className="w-12 h-4 shrink-0"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        className="text-[#5a6b7a]"
      />
    </svg>
  );
}

export function MacroPanel({ indicators, className = '' }: MacroPanelProps) {
  return (
    <div
      className={clsx(
        'grid grid-cols-3 gap-[2px] p-[2px] bg-[#000000] border border-[#1a1a1a] font-mono',
        className
      )}
      style={{ fontFamily: '"JetBrains Mono", "Roboto Mono", monospace', fontSize: '10px' }}
    >
      {indicators.map((ind) => (
        <div
          key={ind.id}
          className="flex flex-col gap-[2px] p-[2px] border border-[#1a1a1a] bg-[#0a0a0a]"
        >
          <div className="text-[#5a6b7a] uppercase tracking-wider truncate">
            {ind.label}
          </div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span
              className={clsx(
                'tabular-nums font-bold truncate',
                ind.change != null
                  ? ind.change >= 0
                    ? 'text-[#00FF00]'
                    : 'text-[#FF0000]'
                  : 'text-[#b0b8c4]'
              )}
            >
              {ind.value}
            </span>
            {ind.sparkline && ind.sparkline.length > 0 && (
              <TinySparkline data={ind.sparkline} />
            )}
          </div>
          {ind.change != null && (
            <div
              className={clsx(
                'text-[8px] tabular-nums',
                ind.change >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'
              )}
            >
              {ind.change >= 0 ? '+' : ''}{ind.change.toFixed(2)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
