'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { listAuditEvents } from '../commandAuditStore';
import { DENSITY } from '../../constants/layoutDensity';
import { makeFunction } from '../entities/types';
import { useTerminalStore } from '../../store/TerminalStore';

const COLS: DenseColumn[] = [
  { key: 'time', header: 'Time', width: '80px' },
  { key: 'panel', header: 'P', width: '30px', align: 'right' },
  { key: 'type', header: 'Type', width: '90px' },
  { key: 'mnemonic', header: 'Mn', width: '70px' },
  { key: 'security', header: 'Security', width: '170px' },
  { key: 'actor', header: 'Actor', width: '70px' },
  { key: 'snapshot', header: 'Snapshot', width: '90px' },
  { key: 'detail', header: 'Detail', width: '1fr' },
];

export function FnAUD({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'GO' | 'DRILL' | 'EXPORT' | 'ALERT_CREATE' | 'WORKSPACE_SAVE' | 'WORKSPACE_LOAD' | 'WORKSPACE_DELETE' | 'NOTE_ADD' | 'POLICY_BLOCK' | 'MESSAGE' | 'POLICY_CHANGE' | 'PIN_UPDATE' | 'NAV_JUMP'>('ALL');
  const [panelFilter, setPanelFilter] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');
  const [sinceMins, setSinceMins] = useState<'15' | '60' | '240' | '1440'>('240');
  const rows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    const minTs = state.tickMs - Number(sinceMins) * 60 * 1000;
    return listAuditEvents(500)
      .filter((e) => e.ts >= minTs)
      .map((e) => ({
        id: e.id,
        time: new Date(e.ts).toISOString().slice(11, 19),
        panel: e.panelIdx + 1,
        type: e.type,
        mnemonic: e.mnemonic ?? '',
        security: e.security ?? '',
        actor: e.actor,
        snapshot: e.snapshotRef ?? 'N/A',
        detail: e.detail,
      }))
      .filter((r) => (typeFilter === 'ALL' || r.type === typeFilter))
      .filter((r) => (panelFilter === 'ALL' || String(r.panel) === panelFilter))
      .filter((r) => !q || `${r.type} ${r.detail} ${r.security} ${r.mnemonic}`.toUpperCase().includes(q));
  }, [filter, typeFilter, panelFilter, sinceMins, state.tickMs]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="AUD • Command / Action Log" right={<StatusBadge label="LOCAL" variant="sim" />} />
      <div className="flex items-center flex-none" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px` }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          style={{ marginRight: 6, background: '#000', color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}>
          <option value="ALL">ALL</option>
          <option value="GO">GO</option>
          <option value="DRILL">DRILL</option>
          <option value="EXPORT">EXPORT</option>
          <option value="ALERT_CREATE">ALERT_CREATE</option>
          <option value="WORKSPACE_SAVE">WS_SAVE</option>
          <option value="WORKSPACE_LOAD">WS_LOAD</option>
          <option value="WORKSPACE_DELETE">WS_DELETE</option>
          <option value="POLICY_BLOCK">POLICY_BLOCK</option>
          <option value="POLICY_CHANGE">POLICY_CHANGE</option>
          <option value="MESSAGE">MESSAGE</option>
          <option value="PIN_UPDATE">PIN_UPDATE</option>
          <option value="NAV_JUMP">NAV_JUMP</option>
        </select>
        <select value={panelFilter} onChange={(e) => setPanelFilter(e.target.value as typeof panelFilter)}
          style={{ marginRight: 6, background: '#000', color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}>
          <option value="ALL">P:ALL</option>
          <option value="1">P1</option>
          <option value="2">P2</option>
          <option value="3">P3</option>
          <option value="4">P4</option>
        </select>
        <select value={sinceMins} onChange={(e) => setSinceMins(e.target.value as typeof sinceMins)}
          style={{ marginRight: 6, background: '#000', color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}>
          <option value="15">15m</option>
          <option value="60">1h</option>
          <option value="240">4h</option>
          <option value="1440">24h</option>
        </select>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter audit events..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          keyboardNav
          rowEntity={(r) => makeFunction(String(r.mnemonic || 'NAV'), 'Audit replay')}
        />
      ) : (
        <EmptyFill hint="NO AUDIT EVENTS YET — RUN GO / DRILL / WS ACTIONS" />
      )}
    </div>
  );
}
