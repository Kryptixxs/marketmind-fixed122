'use client';

import { DENSITY } from '../../constants/layoutDensity';
import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { makeFunction } from '../entities/types';

const COLS: DenseColumn[] = [
  { key: 'check', header: 'Check', width: '1fr' },
  { key: 'value', header: 'Value', width: '90px', align: 'right' },
  { key: 'status', header: 'Status', width: '80px' },
  { key: 'impact', header: 'Impact', width: '130px' },
];

export function FnQLT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [scope, setScope] = useState<'missing' | 'stale' | 'outlier' | 'schema'>('missing');

  const rows = useMemo(() => {
    const base = [
      { id: 'm1', check: 'Missing Field Rate', value: 1.2, status: 'OK', impact: 'Low' },
      { id: 's1', check: 'Stale Value Count', value: Math.max(0, state.streamClock.quotes - state.streamClock.feed), status: 'WARN', impact: 'Medium' },
      { id: 'o1', check: 'Outlier Detection Hits', value: (state.tick % 7), status: 'OK', impact: 'Low' },
      { id: 'd1', check: 'Schema Drift Alerts', value: state.tick % 3, status: state.tick % 3 ? 'WARN' : 'OK', impact: 'High' },
    ];
    if (scope === 'missing') return [base[0]!];
    if (scope === 'stale') return [base[1]!];
    if (scope === 'outlier') return [base[2]!];
    return [base[3]!];
  }, [scope, state.streamClock, state.tick]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="QLT • Data Quality Monitor" right={<StatusBadge label="SIM QC" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: 17, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setScope('missing')}>Missing</button>
        <button type="button" onClick={() => setScope('stale')}>Stale</button>
        <button type="button" onClick={() => setScope('outlier')}>Outlier</button>
        <button type="button" onClick={() => setScope('schema')}>Schema Drift</button>
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeFunction(r.id === 'd1' ? 'ERR' : 'LINE', 'Quality Follow-up')}
        />
      ) : (
        <EmptyFill hint="NO QUALITY ISSUES" />
      )}
    </div>
  );
}
