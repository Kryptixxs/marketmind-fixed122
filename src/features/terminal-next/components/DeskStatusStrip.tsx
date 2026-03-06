'use client';

import React from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const stripStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  padding: '1px 6px',
  background: '#060a13',
  borderBottom: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9,
  fontVariantNumeric: 'tabular-nums',
  color: '#94a3b8',
  height: 18,
};

const sep: React.CSSProperties = {
  margin: '0 6px',
  color: '#334155',
  userSelect: 'none',
};

export default function DeskStatusStrip() {
  const clock = useTerminalStore((s) => s.clock);
  const regime = useTerminalStore((s) => s.regime);
  const activeSymbol = useTerminalStore((s) => s.activeSymbol);
  const depth = useTerminalStore((s) => s.depth);

  const depthSnap = depth[activeSymbol];
  const spread = depthSnap?.spreadBps ?? 0;
  const imbalance = depthSnap?.imbalance ?? 0;

  const imbalanceColor =
    imbalance > 0.3 ? '#10b981' : imbalance < -0.3 ? '#ef4444' : '#94a3b8';

  return (
    <div style={stripStyle}>
      <span>
        TICK#<span style={{ color: '#e2e8f0' }}>{clock.tickId}</span>
      </span>
      <span style={sep}>|</span>
      <span>
        REGIME:{' '}
        <span
          style={{
            color:
              regime.current === 'trend-up'
                ? '#10b981'
                : regime.current === 'trend-down'
                  ? '#ef4444'
                  : regime.current === 'vol-expansion'
                    ? '#f59e0b'
                    : '#3b82f6',
            textTransform: 'uppercase',
          }}
        >
          {regime.current}
        </span>
      </span>
      <span style={sep}>|</span>
      <span>
        SPREAD: <span style={{ color: '#e2e8f0' }}>{spread.toFixed(1)}</span>bps
      </span>
      <span style={sep}>|</span>
      <span>
        IMBALANCE:{' '}
        <span style={{ color: imbalanceColor }}>{imbalance.toFixed(3)}</span>
      </span>
      <span style={sep}>|</span>
      <span>
        VOL: <span style={{ color: '#e2e8f0' }}>{regime.volBps.toFixed(1)}</span>bps
      </span>
    </div>
  );
}
