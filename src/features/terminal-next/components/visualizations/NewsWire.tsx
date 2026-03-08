'use client';

import React, { memo, useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { clsx } from 'clsx';

export type HeadlineUrgency = 'normal' | 'breaking' | 'critical';

/** Sentiment: Green = bullish, Red = bearish, Grey = neutral */
export type HeadlineSentiment = 'positive' | 'negative' | 'neutral';

export interface NewsHeadline {
  id: string;
  title: string;
  time: string;
  urgency: HeadlineUrgency;
  source?: string;
  sentiment?: HeadlineSentiment;
  isTop?: boolean;
}

function deriveUrgency(title: string, index: number): HeadlineUrgency {
  const lower = title.toLowerCase();
  if (lower.includes('alert') || lower.includes('critical') || index % 7 === 6) return 'critical';
  if (lower.includes('breaking') || lower.includes('urgent') || index % 3 === 2) return 'breaking';
  return 'normal';
}

const SOURCES = ['BBG', 'Reuters', 'CNBC', 'WSJ', 'FT', 'Bloomberg'];
function deriveSource(index: number): string {
  return SOURCES[index % SOURCES.length];
}

function deriveSentiment(title: string, index: number): HeadlineSentiment {
  const lower = title.toLowerCase();
  if (lower.includes('outperform') || lower.includes('surge') || lower.includes('rally') || lower.includes('gain')) return 'positive';
  if (lower.includes('decline') || lower.includes('drop') || lower.includes('fall') || lower.includes('loss')) return 'negative';
  return index % 5 === 0 ? 'positive' : index % 5 === 1 ? 'negative' : 'neutral';
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
    return state.headlines.slice(0, 24).map((title, i) => {
      const d = new Date(state.tickMs - (24 - i) * 15 * 60 * 1000);
      const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const isTop = i % 3 === 2;
      return {
        id: `news-${i}-${activeSymbol}`,
        title: title.includes(activeSymbol) ? title : `[${activeSymbol}] ${title}`,
        time: hhmm,
        urgency: deriveUrgency(title, i) as HeadlineUrgency,
        source: deriveSource(i),
        sentiment: deriveSentiment(title, i),
        isTop,
      };
    });
  }, [headlinesProp, state.headlines, state.tickMs, activeSymbol]);

  const sentimentStripColor = (s: HeadlineSentiment) =>
    s === 'positive' ? '#00FF00' : s === 'negative' ? '#FF0000' : '#666666';

  return (
    <div
      className={clsx(
        'overflow-y-auto custom-scrollbar terminal-scrollbar bg-[#000000] border border-[#222] font-mono',
        className
      )}
      style={{ maxHeight, fontSize: '10px' }}
    >
      <div className="h-[14px] px-2 py-1 border-b border-[#222] text-[#5a6b7a] font-bold uppercase tracking-wider sticky top-0 bg-[#0a0a0a] z-10">
        News Wire • {activeSymbol}
      </div>
      {headlines.map((h) => (
        <div
          key={h.id}
          className="flex items-start gap-2 border-b border-[#111] hover:bg-[#0a0a0a] min-h-[24px] py-1"
        >
          <span className="shrink-0 tabular-nums text-[10px] w-10" style={{ color: '#FFB000' }}>
            {h.time}
          </span>
          {h.isTop && (
            <span className="shrink-0 text-[9px] font-bold uppercase text-[#FFB000]">TOP</span>
          )}
          <span
            className={clsx(
              'flex-1 min-w-0 truncate text-[11px]',
              h.isTop ? 'font-bold text-[#FFFFFF]' : 'font-normal text-[#FFFFFF]'
            )}
          >
            {h.title}
          </span>
        </div>
      ))}
    </div>
  );
});
