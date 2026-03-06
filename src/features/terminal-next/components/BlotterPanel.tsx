'use client';

import React from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import type { OrderStatus, Position } from '../types';

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

const statusColors: Record<OrderStatus, string> = {
  WORKING: '#f59e0b',
  PARTIAL: '#f59e0b',
  FILLED: '#10b981',
  CANCELLED: '#ef4444',
  REJECTED: '#ef4444',
};

const orderGridCols = '48px 50px 34px 30px 36px 36px 56px 56px';

const headerRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: orderGridCols,
  padding: '2px 4px',
  borderBottom: '1px solid #1e293b',
  color: '#475569',
  fontSize: 8,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#060a13',
};

const posGridCols = '50px 40px 60px 64px 64px 64px';

const posHeaderRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: posGridCols,
  padding: '2px 4px',
  borderBottom: '1px solid #1e293b',
  color: '#475569',
  fontSize: 8,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#060a13',
};

const cellBase: React.CSSProperties = {
  padding: '1px 3px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default function BlotterPanel() {
  const orders = useTerminalStore((s) => s.orders);
  const positions = useTerminalStore((s) => s.positions);

  const posArr = Object.values(positions).filter((p: Position) => p.qty !== 0);

  return (
    <div style={panelStyle}>
      {/* Orders section */}
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
        ORDERS ({orders.length})
      </div>
      <div style={headerRow}>
        <span>ID</span>
        <span>SYM</span>
        <span>SIDE</span>
        <span>TYPE</span>
        <span style={{ textAlign: 'right' }}>QTY</span>
        <span style={{ textAlign: 'right' }}>FILL</span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>STATUS</span>
      </div>
      <div style={{ overflow: 'auto', flex: orders.length > 0 ? 1 : undefined }}>
        {orders.length === 0 && (
          <div style={{ color: '#475569', padding: '4px', fontSize: 9, textAlign: 'center' }}>
            NO ORDERS
          </div>
        )}
        {orders.map((o) => (
          <div
            key={o.id}
            style={{
              display: 'grid',
              gridTemplateColumns: orderGridCols,
              borderBottom: '1px solid #1e293b22',
              alignItems: 'center',
            }}
          >
            <span style={{ ...cellBase, color: '#475569', fontSize: 8 }}>
              {o.id.slice(-6)}
            </span>
            <span style={{ ...cellBase, color: '#e2e8f0', fontWeight: 600 }}>{o.symbol}</span>
            <span
              style={{
                ...cellBase,
                color: o.side === 'BUY' ? '#10b981' : '#ef4444',
                fontWeight: 600,
              }}
            >
              {o.side}
            </span>
            <span style={{ ...cellBase, color: '#94a3b8' }}>{o.type}</span>
            <span style={{ ...cellBase, color: '#e2e8f0', textAlign: 'right' }}>{o.qty}</span>
            <span style={{ ...cellBase, color: '#94a3b8', textAlign: 'right' }}>{o.filledQty}</span>
            <span style={{ ...cellBase, color: '#e2e8f0', textAlign: 'right' }}>
              {o.price.toFixed(2)}
            </span>
            <span
              style={{
                ...cellBase,
                color: statusColors[o.status],
                textAlign: 'right',
                fontWeight: 600,
                fontSize: 8,
              }}
            >
              {o.status}
            </span>
          </div>
        ))}
      </div>

      {/* Positions section */}
      <div
        style={{
          padding: '3px 4px',
          borderBottom: '1px solid #1e293b',
          borderTop: '1px solid #1e293b',
          color: '#e2e8f0',
          fontSize: 9,
          fontWeight: 700,
          background: '#060a13',
          flexShrink: 0,
        }}
      >
        POSITIONS ({posArr.length})
      </div>
      <div style={posHeaderRow}>
        <span>SYM</span>
        <span style={{ textAlign: 'right' }}>QTY</span>
        <span style={{ textAlign: 'right' }}>AVG COST</span>
        <span style={{ textAlign: 'right' }}>MKT VAL</span>
        <span style={{ textAlign: 'right' }}>UNRL PnL</span>
        <span style={{ textAlign: 'right' }}>REAL PnL</span>
      </div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        {posArr.length === 0 && (
          <div style={{ color: '#475569', padding: '4px', fontSize: 9, textAlign: 'center' }}>
            NO POSITIONS
          </div>
        )}
        {posArr.map((p: Position) => (
          <div
            key={p.symbol}
            style={{
              display: 'grid',
              gridTemplateColumns: posGridCols,
              borderBottom: '1px solid #1e293b22',
              alignItems: 'center',
            }}
          >
            <span style={{ ...cellBase, color: '#e2e8f0', fontWeight: 600 }}>{p.symbol}</span>
            <span
              style={{
                ...cellBase,
                textAlign: 'right',
                color: p.qty > 0 ? '#10b981' : '#ef4444',
              }}
            >
              {p.qty}
            </span>
            <span style={{ ...cellBase, textAlign: 'right', color: '#94a3b8' }}>
              {p.avgCost.toFixed(2)}
            </span>
            <span style={{ ...cellBase, textAlign: 'right', color: '#e2e8f0' }}>
              ${p.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span
              style={{
                ...cellBase,
                textAlign: 'right',
                color: p.unrealizedPnl >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 600,
              }}
            >
              {p.unrealizedPnl >= 0 ? '+' : ''}
              ${p.unrealizedPnl.toFixed(2)}
            </span>
            <span
              style={{
                ...cellBase,
                textAlign: 'right',
                color: p.realizedPnl >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              {p.realizedPnl >= 0 ? '+' : ''}
              ${p.realizedPnl.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export { BlotterPanel };
