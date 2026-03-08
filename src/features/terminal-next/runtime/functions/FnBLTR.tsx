'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';

const COLS: DenseColumn[] = [
  { key: 'id', header: 'ID', width: '50px' },
  { key: 'symbol', header: 'Symbol', width: '80px' },
  { key: 'side', header: 'Side', width: '40px' },
  { key: 'qty', header: 'Qty', width: '60px', align: 'right' },
  { key: 'price', header: 'Price', width: '60px', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'status', header: 'Status', width: '60px' },
  { key: 'pnl', header: 'P&L', width: '60px', align: 'right', tone: true, format: (v) => { const n = Number(v); return (n >= 0 ? '+' : '') + n.toFixed(0); } },
];

export function FnBLTR() {
  const { state } = useTerminalStore();
  const rows = useMemo(() => state.blotter.map((b) => ({
    id: b.id,
    symbol: b.symbol,
    side: b.side,
    qty: b.qty,
    price: b.avgFillPrice,
    status: b.status,
    pnl: b.pnl,
  })), [state.blotter]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="BLTR • Blotter" />
      {rows.length > 0 ? (
        <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" />
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: '#555', fontSize: '10px', fontFamily: "'JetBrains Mono',monospace" }}>NO ACTIVE ORDERS — USE ORD TO PLACE</div>
      )}
    </div>
  );
}
