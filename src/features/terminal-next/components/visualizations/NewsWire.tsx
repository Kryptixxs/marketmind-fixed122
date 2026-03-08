'use client';

import React, { memo, useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { clsx } from 'clsx';

export type HeadlineUrgency = 'normal' | 'breaking' | 'critical';

export interface NewsHeadline {
  id: string;
  title: string;
  time: string;
  urgency: HeadlineUrgency;
}

function deriveUrgency(title: string, index: number): HeadlineUrgency {
  const lower = title.toLowerCase();
  if (lower.includes('alert') || lower.includes('critical') || index % 7 === 6) return 'critical';
  if (lower.includes('breaking') || lower.includes('urgent') || index % 3 === 2) return 'breaking';
  return 'normal';
}

export interface NewsWireProps {
  /** Optional override; otherwise uses state.headlines + activeSymbol context */
  headlines?: NewsHeadline[];
  maxHeight?: string;
  className?: string;
}

export const NewsWire = memo(function NewsWire({
  headlines: headlinesProp,
  maxHeight = '180px',
  className = '',
}: NewsWireProps) {
  const { state } = useTerminalStore();
  const activeSymbol = state.activeSymbol;

  const headlines = useMemo(() => {
    if (headlinesProp?.length) return headlinesProp;
    const hhmm = new Date(state.tickMs).toISOString().slice(11, 16);
    return state.headlines.slice(0, 24).map((title, i) => ({
      id: `news-${i}-${activeSymbol}`,
      title: title.includes(activeSymbol) ? title : `[${activeSymbol}] ${title}`,
      time: hhmm,
      urgency: deriveUrgency(title, i) as HeadlineUrgency,
    }));
  }, [headlinesProp, state.headlines, state.tickMs, activeSymbol]);

  const urgencyClass = (u: HeadlineUrgency) =>
    u === 'critical'
      ? 'border-l-2 border-[#FF0000] bg-[#FF000008]'
      : u === 'breaking'
        ? 'border-l-2 border-[#FFD700] bg-[#FFD70008]'
        : 'border-l-2 border-[#1a1a1a]';

  return (
    <div
      className={clsx(
        'overflow-y-auto custom-scrollbar terminal-scrollbar bg-[#000000] border border-[#1a1a1a] font-mono',
        className
      )}
      style={{ maxHeight, fontSize: '10px' }}
    >
      <div className="h-[14px] px-2 py-1 border-b border-[#1a1a1a] text-[#5a6b7a] font-bold uppercase tracking-wider sticky top-0 bg-[#0a0a0a] z-10">
        News Wire • {activeSymbol}
      </div>
      {headlines.map((h) => (
        <div
          key={h.id}
          className={clsx(
            'px-2 py-[2px] border-b border-[#0d0d0d] flex items-start gap-2 hover:bg-[#0a0a0a]',
            urgencyClass(h.urgency)
          )}
        >
          <span className="text-[#5a6b7a] shrink-0 tabular-nums">{h.time}</span>
          {h.urgency !== 'normal' && (
            <span
              className={clsx(
                'shrink-0 text-[8px] font-bold uppercase',
                h.urgency === 'critical' ? 'text-[#FF0000]' : 'text-[#FFD700]'
              )}
            >
              {h.urgency === 'critical' ? 'CRITICAL' : 'BREAKING'}
            </span>
          )}
          <span className="text-[#b0b8c4] truncate flex-1 min-w-0">{h.title}</span>
        </div>
      ))}
    </div>
  );
});
