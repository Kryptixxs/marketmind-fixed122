'use client';

import React, { useRef, useEffect } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import type { FeedType } from '../types';

const panelStyle: React.CSSProperties = {
  background: '#0c1221',
  border: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
};

const typeColors: Record<FeedType, string> = {
  headline: '#22d3ee',
  system: '#94a3b8',
  execution: '#10b981',
  command: '#f59e0b',
};

function formatTs(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toISOString().slice(11, 19);
}

export default function FeedPanel() {
  const feed = useTerminalStore((s) => s.feed);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feed.length]);

  return (
    <div style={panelStyle}>
      <div
        style={{
          padding: '3px 4px',
          borderBottom: '1px solid #1e293b',
          color: '#e2e8f0',
          fontSize: 9,
          fontWeight: 700,
          background: '#060a13',
          flexShrink: 0,
        }}
      >
        FEED
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '0 2px' }}>
        {feed.length === 0 && (
          <div style={{ color: '#475569', padding: '4px', fontSize: 9, textAlign: 'center' }}>
            NO FEED ITEMS
          </div>
        )}
        {feed.map((item) => {
          const color = typeColors[item.type];
          const isFill = item.type === 'execution' && item.message.includes('SELL');
          const fillColor = isFill ? '#ef4444' : color;

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 6,
                padding: '1px 4px',
                borderBottom: '1px solid #1e293b11',
                lineHeight: '14px',
              }}
            >
              <span style={{ color: '#475569', fontSize: 9, flexShrink: 0 }}>
                {formatTs(item.epochMs)}
              </span>
              {item.symbol && (
                <span style={{ color: '#3b82f6', fontSize: 9, flexShrink: 0 }}>
                  {item.symbol}
                </span>
              )}
              <span
                style={{
                  color: item.type === 'execution' ? fillColor : color,
                  fontSize: 9,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
