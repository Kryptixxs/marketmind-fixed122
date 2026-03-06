'use client';

import React, { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import type { Quote } from '../types';

const tickerStyle: React.CSSProperties = {
  display: 'flex',
  overflow: 'hidden',
  background: '#060a13',
  borderBottom: '1px solid #1e293b',
  height: 20,
  alignItems: 'center',
  position: 'relative',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const trackStyle: React.CSSProperties = {
  display: 'inline-flex',
  animation: 'tickerScroll 30s linear infinite',
  gap: 0,
};

const keyframes = `@keyframes tickerScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}`;

function TickerItem({ quote }: { quote: Quote }) {
  const isPositive = quote.changePct >= 0;
  const color = quote.changePct === 0 ? '#94a3b8' : isPositive ? '#10b981' : '#ef4444';

  return (
    <span
      style={{
        padding: '0 10px',
        color: '#e2e8f0',
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#94a3b8', fontWeight: 600 }}>{quote.symbol}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{quote.last.toFixed(2)}</span>
      <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>
        {isPositive ? '+' : ''}{quote.changePct.toFixed(2)}%
      </span>
    </span>
  );
}

export default function TopTickerBar() {
  const quotes = useTerminalStore((s) => s.quotes);
  const symbols = useTerminalStore((s) => s.symbols);

  const items = useMemo(
    () => symbols.map((sym) => quotes[sym]).filter(Boolean),
    [symbols, quotes],
  );

  return (
    <>
      <style>{keyframes}</style>
      <div style={tickerStyle}>
        <div style={trackStyle}>
          {items.map((q) => (
            <TickerItem key={q.symbol} quote={q} />
          ))}
          {items.map((q) => (
            <TickerItem key={`dup-${q.symbol}`} quote={q} />
          ))}
        </div>
      </div>
    </>
  );
}

export { TopTickerBar };
