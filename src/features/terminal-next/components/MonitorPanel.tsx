'use client';

import React, { useCallback } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import type { Quote } from '../types';

const panelStyle: React.CSSProperties = {
  background: '#0c1221',
  border: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  overflow: 'auto',
  height: '100%',
};

const headerStyle: React.CSSProperties = {
  padding: '3px 4px',
  borderBottom: '1px solid #1e293b',
  color: '#475569',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  background: '#060a13',
  display: 'grid',
  gridTemplateColumns: '56px 60px 52px 52px 60px 60px 64px',
  gap: 0,
};

const cellBase: React.CSSProperties = {
  padding: '2px 4px',
  textAlign: 'right',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function QuoteRow({
  quote,
  active,
  onClick,
}: {
  quote: Quote;
  active: boolean;
  onClick: () => void;
}) {
  const isPositive = quote.changePct >= 0;
  const changeColor = quote.changePct === 0 ? '#94a3b8' : isPositive ? '#10b981' : '#ef4444';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 60px 52px 52px 60px 60px 64px',
        cursor: 'pointer',
        borderBottom: '1px solid #1e293b33',
        background: active ? '#3b82f60d' : 'transparent',
        borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#1e293b44';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? '#3b82f60d' : 'transparent';
      }}
    >
      <span style={{ ...cellBase, textAlign: 'left', color: active ? '#3b82f6' : '#e2e8f0', fontWeight: 600 }}>
        {quote.symbol}
      </span>
      <span style={{ ...cellBase, color: '#e2e8f0' }}>{quote.last.toFixed(2)}</span>
      <span style={{ ...cellBase, color: changeColor }}>
        {isPositive ? '+' : ''}{quote.change.toFixed(2)}
      </span>
      <span style={{ ...cellBase, color: changeColor }}>
        {isPositive ? '+' : ''}{quote.changePct.toFixed(2)}%
      </span>
      <span style={{ ...cellBase, color: '#94a3b8' }}>{quote.bid.toFixed(2)}</span>
      <span style={{ ...cellBase, color: '#94a3b8' }}>{quote.ask.toFixed(2)}</span>
      <span style={{ ...cellBase, color: '#475569' }}>
        {quote.volume >= 1000 ? `${(quote.volume / 1000).toFixed(1)}K` : quote.volume}
      </span>
    </div>
  );
}

export default function MonitorPanel() {
  const symbols = useTerminalStore((s) => s.symbols);
  const quotes = useTerminalStore((s) => s.quotes);
  const activeSymbol = useTerminalStore((s) => s.activeSymbol);
  const setActiveSymbol = useTerminalStore((s) => s.setActiveSymbol);

  const handleClick = useCallback(
    (sym: string) => () => setActiveSymbol(sym),
    [setActiveSymbol],
  );

  return (
    <div style={panelStyle}>
      <div style={{ padding: '3px 4px', borderBottom: '1px solid #1e293b', color: '#e2e8f0', fontSize: 9, fontWeight: 700, background: '#060a13' }}>
        MONITOR
      </div>
      <div style={headerStyle}>
        <span style={{ textAlign: 'left' }}>SYM</span>
        <span style={{ textAlign: 'right' }}>LAST</span>
        <span style={{ textAlign: 'right' }}>CHG</span>
        <span style={{ textAlign: 'right' }}>CHG%</span>
        <span style={{ textAlign: 'right' }}>BID</span>
        <span style={{ textAlign: 'right' }}>ASK</span>
        <span style={{ textAlign: 'right' }}>VOL</span>
      </div>
      {symbols.map((sym) => {
        const q = quotes[sym];
        if (!q) return null;
        return (
          <QuoteRow
            key={sym}
            quote={q}
            active={sym === activeSymbol}
            onClick={handleClick(sym)}
          />
        );
      })}
    </div>
  );
}
export { MonitorPanel };
