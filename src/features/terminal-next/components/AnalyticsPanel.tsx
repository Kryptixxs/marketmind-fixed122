'use client';

import React, { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import type { DepthLevel } from '../types';

const panelStyle: React.CSSProperties = {
  background: '#0c1221',
  border: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  overflow: 'auto',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '3px 4px',
  borderBottom: '1px solid #1e293b',
  color: '#e2e8f0',
  fontSize: 9,
  fontWeight: 700,
  background: '#060a13',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const colHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '50px 1fr 60px 1fr 50px',
  padding: '2px 4px',
  borderBottom: '1px solid #1e293b',
  color: '#475569',
  fontSize: 8,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function DepthRow({
  bid,
  ask,
  maxSize,
}: {
  bid: DepthLevel | undefined;
  ask: DepthLevel | undefined;
  maxSize: number;
}) {
  const bidPct = bid ? (bid.size / maxSize) * 100 : 0;
  const askPct = ask ? (ask.size / maxSize) * 100 : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 60px 1fr 50px',
        height: 16,
        alignItems: 'center',
        borderBottom: '1px solid #1e293b22',
      }}
    >
      <span style={{ textAlign: 'right', padding: '0 4px', color: '#10b981', fontSize: 9 }}>
        {bid ? bid.size.toLocaleString() : ''}
      </span>
      <div style={{ position: 'relative', height: 12 }}>
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: `${bidPct}%`,
            background: '#10b98120',
            borderRight: bidPct > 0 ? '1px solid #10b98166' : 'none',
          }}
        />
      </div>
      <span style={{ textAlign: 'center', padding: '0 2px', color: '#e2e8f0', fontSize: 9 }}>
        {(bid?.price ?? ask?.price ?? 0).toFixed(2)}
      </span>
      <div style={{ position: 'relative', height: 12 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${askPct}%`,
            background: '#ef444420',
            borderLeft: askPct > 0 ? '1px solid #ef444466' : 'none',
          }}
        />
      </div>
      <span style={{ textAlign: 'left', padding: '0 4px', color: '#ef4444', fontSize: 9 }}>
        {ask ? ask.size.toLocaleString() : ''}
      </span>
    </div>
  );
}

export default function AnalyticsPanel() {
  const activeSymbol = useTerminalStore((s) => s.activeSymbol);
  const depthMap = useTerminalStore((s) => s.depth);

  const snap = depthMap[activeSymbol];
  const bids = snap?.bids ?? [];
  const asks = snap?.asks ?? [];

  const maxSize = useMemo(() => {
    const allSizes = [...bids.map((l) => l.size), ...asks.map((l) => l.size)];
    return Math.max(...allSizes, 1);
  }, [bids, asks]);

  const levels = 10;
  const bidSlice = bids.slice(0, levels);
  const askSlice = asks.slice(0, levels);

  const imbalanceColor =
    (snap?.imbalance ?? 0) > 0.3
      ? '#10b981'
      : (snap?.imbalance ?? 0) < -0.3
        ? '#ef4444'
        : '#94a3b8';

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>DEPTH — {activeSymbol}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#94a3b8' }}>
            SPD: <span style={{ color: '#e2e8f0' }}>{(snap?.spreadBps ?? 0).toFixed(1)}bps</span>
          </span>
          <span style={{ color: '#94a3b8' }}>
            IMB: <span style={{ color: imbalanceColor }}>{(snap?.imbalance ?? 0).toFixed(3)}</span>
          </span>
        </span>
      </div>
      <div style={colHeaderStyle}>
        <span style={{ textAlign: 'right' }}>BID SZ</span>
        <span />
        <span style={{ textAlign: 'center' }}>PRICE</span>
        <span />
        <span style={{ textAlign: 'left' }}>ASK SZ</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {Array.from({ length: levels }).map((_, i) => {
          const askIdx = levels - 1 - i;
          return (
            <DepthRow
              key={i}
              bid={bidSlice[i]}
              ask={askSlice[askIdx]}
              maxSize={maxSize}
            />
          );
        })}
      </div>
    </div>
  );
}
export { AnalyticsPanel };
