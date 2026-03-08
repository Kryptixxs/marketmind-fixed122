'use client';

import { DENSITY } from '../../constants/layoutDensity';
import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { listErrorEntries } from '../errorConsoleStore';
import { makeFunction } from '../entities/types';

const COLS: DenseColumn[] = [
  { key: 'time', header: 'Time', width: '80px' },
  { key: 'kind', header: 'Kind', width: '90px' },
  { key: 'panel', header: 'P', width: '30px', align: 'right' },
  { key: 'message', header: 'Message', width: '1fr' },
  { key: 'recovery', header: 'Recovery', width: '180px' },
];

export function FnERR({ panelIdx = 0 }: { panelIdx?: number }) {
  const [filter, setFilter] = useState('');
  const rows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    return listErrorEntries(500)
      .map((e) => ({
        id: e.id,
        time: new Date(e.ts).toISOString().slice(11, 19),
        kind: e.kind,
        panel: e.panelIdx + 1,
        message: e.message,
        recovery: e.recovery,
        entity: e.entity ?? (e.kind === 'PARSER' ? 'STAT' : e.kind === 'POLICY' || e.kind === 'PERMISSION' ? 'POL' : 'ERR'),
      }))
      .filter((r) => !q || `${r.kind} ${r.message} ${r.recovery}`.toUpperCase().includes(q));
  }, [filter]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="ERR • Error Console" right={<StatusBadge label={rows.length ? `${rows.length}` : '0'} variant={rows.length ? 'stale' : 'live'} />} />
      <div className="flex items-center flex-none" style={{ height: 18, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: '0 4px' }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by kind, message, recovery..."
          className="flex-1 bg-transparent outline-none" />
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeFunction(String(r.entity), `Recovery: ${String(r.recovery)}`)}
        />
      ) : (
        <EmptyFill hint="NO USER-FACING ERRORS LOGGED" />
      )}
    </div>
  );
}
