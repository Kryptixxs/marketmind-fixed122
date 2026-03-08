'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface TickerItem {
  id: string;
  symbol?: string;
  value: string;
  change?: number; // positive=green, negative=red
}

export interface HorizontalTickerProps {
  items: TickerItem[];
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

const SPEED_MS = { slow: 60, medium: 45, fast: 25 };

export function HorizontalTickerStrip({
  items,
  speed = 'medium',
  className = '',
}: HorizontalTickerProps) {
  const duration = SPEED_MS[speed];

  return (
    <div
      className={clsx(
        'overflow-hidden bg-[#000000] border-b border-[#1a1a1a]',
        className
      )}
    >
      <div
        className="flex gap-6 py-[2px] font-mono text-[10px] tabular-nums whitespace-nowrap"
        style={{
          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
          animation: `ticker-scroll-h ${duration}s linear infinite`,
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={`${item.id}-h-${i}`} className="inline-flex items-center gap-2 shrink-0">
            <span className="text-[#5a6b7a]">{item.symbol ?? item.id}</span>
            <span className="text-[#b0b8c4]">{item.value}</span>
            {item.change != null && (
              <span className={item.change >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface VerticalTickerProps {
  items: TickerItem[];
  speed?: 'slow' | 'medium' | 'fast';
  maxHeight?: string;
  className?: string;
}

export function VerticalTickerStrip({
  items,
  speed = 'medium',
  maxHeight = '200px',
  className = '',
}: VerticalTickerProps) {
  const duration = SPEED_MS[speed];

  return (
    <div
      className={clsx(
        'overflow-hidden bg-[#000000] border border-[#1a1a1a]',
        className
      )}
      style={{ maxHeight }}
    >
      <div
        className="flex flex-col gap-[2px] py-[2px] font-mono text-[10px] tabular-nums"
        style={{
          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
          animation: `ticker-scroll-v ${duration}s linear infinite`,
        }}
      >
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.id}-v-${i}`}
            className="flex items-center justify-between px-[2px] py-[2px] gap-4 shrink-0"
          >
            <span className="text-[#5a6b7a]">{item.symbol ?? item.id}</span>
            <span className="text-[#b0b8c4]">{item.value}</span>
            {item.change != null && (
              <span className={item.change >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
