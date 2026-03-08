'use client';

import React, { useState } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { listWorkspaces } from '../workspaceManager';
import { loadMonitorList, saveMonitorList } from '../monitorListStore';
import { listSecurityNotes } from '../securityNotesStore';
import { loadAllCommandHistories } from '../commandHistoryStore';
import { loadPolicyState, savePolicyState } from '../policyStore';
import { useTerminalStore } from '../../store/TerminalStore';

const COLS: DenseColumn[] = [
  { key: 'cache', header: 'Cache', width: '1fr' },
  { key: 'entries', header: 'Entries', width: '90px', align: 'right' },
  { key: 'status', header: 'Status', width: '90px' },
  { key: 'stale', header: 'Stale', width: '70px' },
];

export function FnCACH({ panelIdx = 0 }: { panelIdx?: number }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [cachePolicy, setCachePolicy] = useState<'aggressive' | 'minimal'>(() => {
    if (typeof window === 'undefined') return 'aggressive';
    return (localStorage.getItem('vantage-cache-policy') as 'aggressive' | 'minimal') ?? 'aggressive';
  });
  const policy = loadPolicyState();
  const { state } = useTerminalStore();

  const ws = listWorkspaces();
  const monitors = loadMonitorList();
  const cmd = loadAllCommandHistories(4).flat();
  const notes = listSecurityNotes('AAPL US EQUITY');
  const rows = [
    { id: 'ws', cache: 'Workspaces', entries: ws.length, status: 'READY', stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'mon', cache: 'Monitor Lists', entries: monitors.length, status: 'READY', stale: policy.mode !== 'normal' ? 'YES' : 'NO' },
    { id: 'cmd', cache: 'Command History', entries: cmd.length, status: 'READY', stale: 'NO' },
    { id: 'notes', cache: 'Security Notes', entries: notes.length, status: 'READY', stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'recovery', cache: 'Recovery Snapshot', entries: 1, status: 'READY', stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'quotes', cache: 'Last Quotes Cache', entries: state.quotes.length, status: 'READY', stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'news', cache: 'Last News Cache', entries: state.headlines.length, status: 'READY', stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
  ];

  const setMode = (mode: 'normal' | 'restricted' | 'frozen') => {
    savePolicyState({ ...policy, mode });
    setRefreshTick((v) => v + 1);
  };

  const clearMonitors = () => {
    saveMonitorList([]);
    setRefreshTick((v) => v + 1);
  };

  const setPolicyPreset = (preset: 'aggressive' | 'minimal') => {
    setCachePolicy(preset);
    if (typeof window !== 'undefined') localStorage.setItem('vantage-cache-policy', preset);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="CACH • Cache & Offline Behavior" right={<StatusBadge label={policy.mode.toUpperCase()} variant={policy.mode === 'normal' ? 'live' : 'stale'} />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setMode('normal')}>Normal</button>
        <button type="button" onClick={() => setMode('restricted')}>Restricted</button>
        <button type="button" onClick={() => setMode('frozen')}>Feed Down</button>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Cache:</span>
        <button type="button" onClick={() => setPolicyPreset('aggressive')} style={{ color: cachePolicy === 'aggressive' ? DENSITY.accentAmber : DENSITY.textMuted }}>Aggressive</button>
        <button type="button" onClick={() => setPolicyPreset('minimal')} style={{ color: cachePolicy === 'minimal' ? DENSITY.accentAmber : DENSITY.textMuted }}>Minimal</button>
        <button type="button" onClick={clearMonitors}>Clear Monitors</button>
      </div>
      <DenseTable columns={COLS} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" />
    </div>
  );
}
