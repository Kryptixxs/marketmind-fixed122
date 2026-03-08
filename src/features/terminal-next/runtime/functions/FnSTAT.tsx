'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { DENSITY } from '../../constants/layoutDensity';
import { makeFunction, makeField } from '../entities/types';

const METRIC_COLS: DenseColumn[] = [
  { key: 'metric', header: 'Metric', width: '1fr' },
  { key: 'value', header: 'Value', width: '110px', align: 'right' },
  { key: 'status', header: 'Status', width: '90px' },
  { key: 'provenance', header: 'Prov', width: '70px' },
];

const EVENT_COLS: DenseColumn[] = [
  { key: 'time', header: 'Time', width: '80px' },
  { key: 'topic', header: 'Topic', width: '110px' },
  { key: 'latMs', header: 'Lat(ms)', width: '80px', align: 'right' },
  { key: 'note', header: 'Note', width: '1fr' },
];

export function FnSTAT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [tab, setTab] = useState<'summary' | 'events'>('summary');

  const metrics = useMemo(() => {
    const fps = state.workerAnalytics?.uiFps ?? 0;
    const workerLatency = state.workerAnalytics?.workerLatencyMs ?? 0;
    const memMb = ((globalThis as { performance?: { memory?: { usedJSHeapSize?: number } } }).performance?.memory?.usedJSHeapSize ?? 0) / (1024 * 1024);
    const dropProxy = Math.max(0, state.streamClock.quotes - state.streamClock.feed);
    return [
      { id: 'mode', metric: 'Runtime Mode', value: 'SIM', status: 'ACTIVE', provenance: 'SIM' },
      { id: 'quotes', metric: 'Quotes Feed Tick', value: String(state.streamClock.quotes), status: 'UP', provenance: 'LIVE' },
      { id: 'depth', metric: 'Depth Feed Tick', value: String(state.streamClock.depth), status: 'UP', provenance: 'LIVE' },
      { id: 'execution', metric: 'Orders Feed Tick', value: String(state.streamClock.execution), status: 'UP', provenance: 'LIVE' },
      { id: 'feed', metric: 'News Feed Tick', value: String(state.streamClock.feed), status: 'UP', provenance: 'LIVE' },
      { id: 'fps', metric: 'UI FPS', value: String(fps), status: fps < 45 ? 'WARN' : 'OK', provenance: 'SIM' },
      { id: 'lat', metric: 'Worker Latency', value: `${workerLatency}`, status: workerLatency > 150 ? 'WARN' : 'OK', provenance: 'SIM' },
      { id: 'drop', metric: 'Dropped Update Proxy', value: String(dropProxy), status: dropProxy > 8 ? 'WARN' : 'OK', provenance: 'CALC' },
      { id: 'mem', metric: 'Memory MB', value: `${memMb.toFixed(1)}`, status: memMb > 500 ? 'WARN' : 'OK', provenance: 'SIM' },
      { id: 'panelPerf', metric: `Panel ${panelIdx + 1} Render Proxy`, value: `${Math.max(1, Math.round(1000 / Math.max(1, fps)))}ms`, status: fps < 45 ? 'WARN' : 'OK', provenance: 'CALC' },
    ];
  }, [state.streamClock, state.workerAnalytics, panelIdx]);

  const events = useMemo(() => {
    const now = state.tickMs;
    return Array.from({ length: 200 }, (_, i) => {
      const topic = i % 4 === 0 ? 'quotes' : i % 4 === 1 ? 'news' : i % 4 === 2 ? 'alerts' : 'orders';
      const latMs = 8 + ((state.tick + i) % 65);
      return {
        id: `${i}`,
        time: new Date(now - i * 550).toISOString().slice(11, 19),
        topic,
        latMs,
        note: latMs > 50 ? 'Tail latency elevated' : 'Nominal',
      };
    });
  }, [state.tick, state.tickMs]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="STAT • System Status & Feed Health" right={<StatusBadge label="OPS" variant="sim" />} />
      <div className="flex items-center gap-1 px-1" style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setTab('summary')} style={{ color: tab === 'summary' ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>SUMMARY</button>
        <button type="button" onClick={() => setTab('events')} style={{ color: tab === 'events' ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>LAST 200 EVENTS</button>
      </div>
      {tab === 'summary' ? (
        <DenseTable
          columns={METRIC_COLS}
          rows={metrics}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => {
            const id = String(r.id);
            if (id === 'quotes' || id === 'depth' || id === 'execution' || id === 'feed') return makeFunction('LAT', 'Latency Monitor');
            if (id === 'drop' || id === 'panelPerf') return makeFunction('ERR', 'Error Console');
            return makeField('PX_LAST', Number(r.value) || 0);
          }}
        />
      ) : (
        events.length > 0 ? (
          <DenseTable columns={EVENT_COLS} rows={events} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" />
        ) : (
          <EmptyFill hint="NO FEED EVENTS" />
        )
      )}
    </div>
  );
}
