'use client';

import React, { useMemo } from 'react';

export interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Up = green, Down = red, Flat = neutral */
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}

export function MiniSparkline({
  data,
  width = 48,
  height = 16,
  trend = 'flat',
  className = '',
}: MiniSparklineProps) {
  const path = useMemo(() => {
    if (!data.length) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = width - 2;
    const h = height - 2;
    const step = data.length > 1 ? w / (data.length - 1) : 0;
    const points = data.map((v, i) => {
      const x = 1 + i * step;
      const y = 1 + h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const stroke =
    trend === 'up' ? '#00FF00' : trend === 'down' ? '#FF0000' : '#666';

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
