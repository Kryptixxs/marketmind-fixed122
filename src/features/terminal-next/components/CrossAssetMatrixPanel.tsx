'use client';

import React from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const ASSET_CLASSES: { label: string; symbol: string }[] = [
  { label: 'Equities', symbol: 'SPX' },
  { label: 'Crypto', symbol: 'BTCUSD' },
  { label: 'Forex', symbol: 'EURUSD' },
  { label: 'Commodities', symbol: 'GC' },
  { label: 'Rates', symbol: 'UST10Y' },
];

const panelStyle: React.CSSProperties = {
  background: '#0c1221',
  border: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  overflow: 'auto',
};

const gridHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '72px 1fr 56px',
  padding: '2px 4px',
  borderBottom: '1px solid #1e293b',
  color: '#475569',
  fontSize: 8,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#060a13',
};

const rowBase: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '72px 1fr 56px',
  padding: '2px 4px',
  borderBottom: '1px solid #1e293b22',
  alignItems: 'center',
};

export default function CrossAssetMatrixPanel() {
  const quotes = useTerminalStore((s) => s.quotes);

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
        }}
      >
        CROSS-ASSET MATRIX
      </div>
      <div style={gridHeader}>
        <span>SYMBOL</span>
        <span style={{ textAlign: 'right' }}>LAST</span>
        <span style={{ textAlign: 'right' }}>CHG%</span>
      </div>
      {ASSET_CLASSES.map(({ label, symbol }) => {
        const q = quotes[symbol];
        if (!q) return null;
        const isPositive = q.changePct >= 0;
        const color = q.changePct === 0 ? '#94a3b8' : isPositive ? '#10b981' : '#ef4444';

        return (
          <div key={symbol} style={rowBase}>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 9 }}>{symbol}</span>
              <span style={{ color: '#475569', fontSize: 8 }}>{label}</span>
            </span>
            <span style={{ textAlign: 'right', color: '#e2e8f0' }}>{q.last.toFixed(2)}</span>
            <span style={{ textAlign: 'right', color }}>
              {isPositive ? '+' : ''}{q.changePct.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
