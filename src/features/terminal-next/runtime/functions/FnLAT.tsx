'use client';

import { DENSITY } from '../../constants/layoutDensity';
import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { makeField } from '../entities/types';

const CHAIN_COLS: DenseColumn[] = [
  { key: 'event', header: 'Event', width: '1fr' },
  { key: 'pubMs', header: 'Publish', width: '80px', align: 'right' },
  { key: 'modelMs', header: 'Model', width: '70px', align: 'right' },
  { key: 'paintMs', header: 'Paint', width: '70px', align: 'right' },
  { key: 'totalMs', header: 'Total', width: '70px', align: 'right', tone: true },
];

export function FnLAT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [view, setView] = useState<'slowPanels' | 'slowMnemonics' | 'eventChain'>('slowPanels');
  const workerLatency = state.workerAnalytics?.workerLatencyMs ?? 0;
  const fps = state.workerAnalytics?.uiFps ?? 60;

  const slowPanels = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const pubMs = 2 + ((state.tick + i) % 8);
    const modelMs = 4 + ((state.tick + i * 2) % 20);
    const paintMs = Math.max(2, Math.round(1000 / Math.max(1, fps)) + (i % 4));
    const totalMs = pubMs + modelMs + paintMs + workerLatency;
    return { id: `p-${i + 1}`, row: `Panel ${(i % 4) + 1}`, pubMs, modelMs, paintMs, totalMs };
  }), [state.tick, fps, workerLatency]);

  const slowMnemonics = useMemo(() => {
    const names = ['STAT', 'LAT', 'CACH', 'ERR', 'ENT', 'AUD', 'COMP', 'POL', 'MON', 'BLTR', 'DES', 'HP', 'GP', 'WEI', 'ECO', 'FXC', 'IMAP', 'TOP', 'FA', 'RV'];
    return names.map((code, i) => {
      const pubMs = 2 + ((state.tick + i) % 7);
      const modelMs = 6 + ((state.tick + i * 3) % 18);
      const paintMs = Math.max(2, Math.round(1000 / Math.max(1, fps)) + (i % 3));
      return { id: code, row: code, pubMs, modelMs, paintMs, totalMs: pubMs + modelMs + paintMs + workerLatency };
    });
  }, [state.tick, fps, workerLatency]);

  const eventChainRows = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const pubMs = 1 + ((state.tick + i) % 9);
    const modelMs = 5 + ((state.tick + i * 2) % 25);
    const paintMs = Math.max(2, Math.round(1000 / Math.max(1, fps)));
    return {
      id: `e-${i}`,
      event: `EventChain #${String(i + 1).padStart(2, '0')}`,
      pubMs,
      modelMs,
      paintMs,
      totalMs: pubMs + modelMs + paintMs,
    };
  }), [state.tick, fps]);

  const rows = view === 'slowPanels' ? slowPanels : view === 'slowMnemonics' ? slowMnemonics : eventChainRows;

  const cols: DenseColumn[] = view === 'eventChain'
    ? CHAIN_COLS
    : [
      { key: 'row', header: view === 'slowPanels' ? 'Panel' : 'Mnemonic', width: '1fr' },
      { key: 'pubMs', header: 'Publish', width: '80px', align: 'right' },
      { key: 'modelMs', header: 'Model', width: '70px', align: 'right' },
      { key: 'paintMs', header: 'Paint', width: '70px', align: 'right' },
      { key: 'totalMs', header: 'Total', width: '70px', align: 'right', tone: true },
    ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="LAT • Latency Monitor" right={<StatusBadge label={`${workerLatency}ms`} variant={workerLatency > 150 ? 'stale' : 'live'} />} />
      <div className="flex items-center gap-2 px-1" style={{ height: 17, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setView('slowPanels')}>Slow Panels</button>
        <button type="button" onClick={() => setView('slowMnemonics')}>Slow Mnemonics</button>
        <button type="button" onClick={() => setView('eventChain')}>Event Chain</button>
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={cols}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeField('VWAP', Number(r.totalMs) || 0)}
        />
      ) : (
        <EmptyFill hint="NO LATENCY DATA" />
      )}
    </div>
  );
}
