'use client';

import React from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import type { RegimeType } from '../types';

const FKEYS: { key: string; label: string }[] = [
  { key: 'F1', label: 'HELP' },
  { key: 'F2', label: 'DES' },
  { key: 'F3', label: 'CHART' },
  { key: 'F5', label: 'DEPTH' },
  { key: 'F8', label: 'NEWS' },
];

const regimeColors: Record<RegimeType, string> = {
  'trend-up': '#10b981',
  'trend-down': '#ef4444',
  'mean-revert': '#3b82f6',
  'vol-expansion': '#f59e0b',
};

const barStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '2px 4px',
  background: '#0c1221',
  borderBottom: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
};

const btnStyle: React.CSSProperties = {
  background: '#1e293b',
  color: '#94a3b8',
  border: '1px solid #334155',
  borderRadius: 2,
  padding: '1px 6px',
  fontSize: 9,
  fontFamily: 'JetBrains Mono, monospace',
  cursor: 'pointer',
  lineHeight: '14px',
};

export default function CommandKeyBar() {
  const regime = useTerminalStore((s) => s.regime);

  return (
    <div style={barStyle}>
      {FKEYS.map((fk) => (
        <button key={fk.key} style={btnStyle}>
          <span style={{ color: '#475569' }}>{fk.key}</span>
          <span style={{ color: '#e2e8f0', marginLeft: 2 }}>{fk.label}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 2,
          background: regimeColors[regime.current] + '22',
          color: regimeColors[regime.current],
          border: `1px solid ${regimeColors[regime.current]}44`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {regime.current}
      </span>
    </div>
  );
}
