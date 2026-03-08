'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { appendAuditEvent } from '../commandAuditStore';

type MapRow = { id: string; external: string; internal: string; provider: string; status: 'ACTIVE' | 'PENDING' };

const COLS: DenseColumn[] = [
  { key: 'external', header: 'External Field', width: '1fr' },
  { key: 'internal', header: 'Internal Field', width: '120px' },
  { key: 'provider', header: 'Provider', width: '100px' },
  { key: 'status', header: 'Status', width: '80px' },
];

const DEFAULT_ROWS: MapRow[] = [
  { id: '1', external: 'lastPrice', internal: 'PX_LAST', provider: 'SIM', status: 'ACTIVE' },
  { id: '2', external: 'bidPrice', internal: 'PX_BID', provider: 'SIM', status: 'ACTIVE' },
  { id: '3', external: 'askPrice', internal: 'PX_ASK', provider: 'SIM', status: 'ACTIVE' },
  { id: '4', external: 'marketCap', internal: 'MARKET_CAP', provider: 'SIM', status: 'PENDING' },
];

export function FnMAP({ panelIdx = 0 }: { panelIdx?: number }) {
  const [rows, setRows] = useState<MapRow[]>(DEFAULT_ROWS);
  const [external, setExternal] = useState('');
  const [internal, setInternal] = useState('');

  const add = () => {
    if (!external.trim() || !internal.trim()) return;
    const next: MapRow = { id: `${Date.now()}`, external: external.trim(), internal: internal.trim().toUpperCase(), provider: 'SIM', status: 'PENDING' };
    setRows((prev) => [next, ...prev]);
    appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `MAP add ${next.external} -> ${next.internal}` });
    setExternal('');
    setInternal('');
  };

  const mapped = useMemo(() => rows, [rows]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="MAP • Field Mapping / Aliases" right={<StatusBadge label="SIM MAPPING" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={external} onChange={(e) => setExternal(e.target.value)} placeholder="external field" className="flex-1 bg-transparent outline-none" />
        <span>→</span>
        <input value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="internal field" className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={add}>ADD</button>
      </div>
      <DenseTable columns={COLS} rows={mapped} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" />
    </div>
  );
}
