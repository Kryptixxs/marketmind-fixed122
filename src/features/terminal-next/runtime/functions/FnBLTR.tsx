'use client';

import { DENSITY } from '../../constants/layoutDensity';
import React, { useMemo, useState } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { makeSecurity } from '../entities/types';
import { EmptyFill, StatusBadge } from '../primitives';

const COLS: DenseColumn[] = [
  { key: 'id', header: 'ID', width: '50px' },
  { key: 'symbol', header: 'Symbol', width: '80px' },
  { key: 'side', header: 'Side', width: '40px' },
  { key: 'qty', header: 'Qty', width: '60px', align: 'right' },
  { key: 'price', header: 'Price', width: '60px', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'status', header: 'Status', width: '70px' },
  { key: 'fills', header: 'Fills', width: '60px', align: 'right' },
  { key: 'slippage', header: 'Slip(bps)', width: '70px', align: 'right', tone: true },
  { key: 'pnl', header: 'P&L', width: '60px', align: 'right', tone: true, format: (v) => { const n = Number(v); return (n >= 0 ? '+' : '') + n.toFixed(0); } },
];

export function FnBLTR({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WORKING' | 'PARTIAL' | 'FILLED'>('ALL');
  const rows = useMemo(() => state.blotter.map((b) => ({
    id: b.id,
    symbol: b.symbol,
    side: b.side,
    qty: b.qty,
    price: b.avg,
    status: b.status,
    fills: b.status === 'FILLED' ? '100%' : b.status === 'PARTIAL' ? '40%' : '5%',
    slippage: Number((((b.last - b.avg) / Math.max(0.01, b.avg)) * 10000).toFixed(1)),
    pnl: b.pnl,
  })), [state.blotter]);

  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader
        title="BLTR • Blotter"
        right={<div className="flex items-center gap-1"><StatusBadge label="SIM" variant="sim" /></div>}
      />
      <div className="flex items-center gap-1 px-1" style={{ height: 18, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        {(['ALL', 'WORKING', 'PARTIAL', 'FILLED'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            style={{ color: statusFilter === s ? DENSITY.accentAmber : DENSITY.textSecondary, fontSize: '9px', border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.bgSurface, padding: '0 4px', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>
      {filtered.length > 0 ? (
        <DenseTable columns={COLS} rows={filtered} rowKey="id" className="flex-1 min-h-0"
          panelIdx={panelIdx}
          rowEntity={(row) => makeSecurity(row.symbol as string)}
        />
      ) : (
        <EmptyFill hint="NO MATCHING ORDERS — USE ORD TO PLACE, OR SWITCH FILTER" />
      )}
    </div>
  );
}
