'use client';

import React, { useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { appendAuditEvent } from '../commandAuditStore';
import { appendWave4Item, listWave4Store, replaceWave4Store } from '../wave4Store';
import { useTerminalStore } from '../../store/TerminalStore';
import { makeFunction, makeSecurity } from '../entities/types';
import { checkPolicy, loadPolicyState, savePolicyState } from '../policyStore';
import { isAllowedByRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';
import { useDrill } from '../entities/DrillContext';

function ts(v?: number) { return v ? new Date(v).toISOString().slice(11, 19) : '—'; }

export function FnCHAT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [msg, setMsg] = useState('');
  const [, setRefresh] = useState(0);
  const rows = listWave4Store('chats').map((r) => ({ ...r, time: ts(r.ts) }));
  const cols: DenseColumn[] = [{ key: 'time', header: 'Time', width: '80px' }, { key: 'from', header: 'From', width: '70px' }, { key: 'text', header: 'Message', width: '1fr' }, { key: 'link', header: 'Context', width: '170px' }];
  const send = () => {
    if (!msg.trim()) return;
    const policy = loadPolicyState();
    const gate = checkPolicy('MESSAGE', policy.activeRole);
    if (!isAllowedByRole(policy.activeRole, 'MESSAGE') || !gate.allowed) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: `CHAT blocked: ${gate.reason ?? 'Role denied'}`, mnemonic: 'CHAT', security: p.activeSecurity, policyReason: gate.reason });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Chat send blocked.', recovery: 'Review ENT/COMP/POL for MESSAGE access.', entity: 'CHAT' });
      return;
    }
    appendWave4Item('chats', { from: 'YOU', to: 'DESK', text: msg.trim(), link: `${p.activeSecurity} ${p.activeMnemonic}`, ts: Date.now() });
    appendAuditEvent({ panelIdx, type: 'MESSAGE', actor: 'USER', detail: 'CHAT message sent', mnemonic: 'CHAT', security: p.activeSecurity });
    setMsg('');
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="CHAT • Panel-linked Chat" right={<StatusBadge label="SIM DESK" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message with context link..." className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={send}>SEND</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeFunction(String(r.link).split(' ').at(-1) ?? 'DES', 'Open chat context')} /> : <EmptyFill hint="NO CHAT MESSAGES" />}
    </div>
  );
}

export function FnSHAR({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const p = panels[panelIdx]!;
  const [, setRefresh] = useState(0);
  const shares = listWave4Store('shares');
  const rows = shares.map((s) => ({ id: s.id, kind: s.kind, token: s.token, security: s.security ?? '—', mnemonic: s.mnemonic ?? '—', opens: s.opens ?? 0, ts: ts(s.ts) }));
  const cols: DenseColumn[] = [{ key: 'kind', header: 'Kind', width: '70px' }, { key: 'token', header: 'LinkToken', width: '1fr' }, { key: 'security', header: 'Security', width: '150px' }, { key: 'mnemonic', header: 'Fn', width: '60px' }, { key: 'opens', header: 'Opens', width: '60px', align: 'right' }, { key: 'ts', header: 'Time', width: '90px' }];
  const sharePanel = () => {
    const policy = loadPolicyState();
    const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
    if (!isAllowedByRole(policy.activeRole, 'SEND_TO_PANEL') || !gate.allowed) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'SHAR panel blocked', mnemonic: 'SHAR', security: p.activeSecurity, policyReason: gate.reason ?? 'SEND_TO_PANEL denied' });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Share panel blocked by policy.', recovery: 'Review ENT/COMP/POL send permissions.', entity: 'SHAR' });
      return;
    }
    appendWave4Item('shares', { kind: 'PANEL', token: `mm://panel/${Date.now().toString(36)}`, security: p.activeSecurity, mnemonic: p.activeMnemonic, workspace: undefined, ts: Date.now() });
    appendAuditEvent({ panelIdx, type: 'GO', actor: policy.activeRole, detail: `SHAR panel ${p.activeSecurity} ${p.activeMnemonic}`, mnemonic: 'SHAR', security: p.activeSecurity });
    setRefresh((v) => v + 1);
  };
  const shareWorkspace = () => {
    appendWave4Item('shares', {
      kind: 'WORKSPACE',
      token: `mm://workspace/${Date.now().toString(36)}`,
      workspace: 'CURRENT-DOCK',
      panels: panels.map((x) => ({ mnemonic: x.activeMnemonic, security: x.activeSecurity, sector: x.marketSector })),
      ts: Date.now(),
    });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'SHAR workspace CURRENT-DOCK', mnemonic: 'SHAR' });
    setRefresh((v) => v + 1);
  };
  const openShare = (id: string) => {
    const all = listWave4Store('shares');
    const row = all.find((s) => s.id === id);
    if (!row) return;
    if (row.kind === 'PANEL' && row.mnemonic && row.security) {
      drill(makeSecurity(row.security), 'OPEN_IN_PLACE', panelIdx);
      drill(makeFunction(row.mnemonic), 'OPEN_IN_PLACE', panelIdx);
    }
    if (row.kind === 'WORKSPACE' && row.panels?.length) {
      row.panels.slice(0, panels.length).forEach((sp, idx) => {
        drill(makeSecurity(sp.security), 'OPEN_IN_PLACE', idx);
        drill(makeFunction(sp.mnemonic), 'OPEN_IN_PLACE', idx);
      });
    }
    replaceWave4Store('shares', all.map((s) => (s.id === id ? { ...s, opens: (s.opens ?? 0) + 1 } : s)));
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `SHAR open ${row.token}`, mnemonic: 'SHAR', security: row.security });
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="SHAR • Share Workspace / Panel" right={<StatusBadge label={`${rows.length} LINKS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={sharePanel}>SHARE CURRENT PANEL</button>
        <button type="button" onClick={shareWorkspace}>SHARE WORKSPACE</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => openShare(String(r.id))} /> : <EmptyFill hint="NO SHARE LINKS YET" />}
    </div>
  );
}

export function FnNOTE({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [scope, setScope] = useState<'SECURITY' | 'FUNCTION' | 'GLOBAL'>('SECURITY');
  const [text, setText] = useState('');
  const [tags, setTags] = useState('idea');
  const [, setRefresh] = useState(0);
  const notes = listWave4Store('notes');
  const rows = notes.map((n) => ({ id: n.id, scope: n.scope, target: n.target, text: n.text, tags: n.tags.join(','), pin: n.pinned ? 'PIN' : '', ts: ts(n.ts) }));
  const cols: DenseColumn[] = [{ key: 'scope', header: 'Scope', width: '80px' }, { key: 'target', header: 'Target', width: '150px' }, { key: 'text', header: 'Note', width: '1fr' }, { key: 'tags', header: 'Tags', width: '120px' }, { key: 'pin', header: 'Pin', width: '50px' }, { key: 'ts', header: 'Time', width: '80px' }];
  const add = () => {
    if (!text.trim()) return;
    const target = scope === 'SECURITY' ? p.activeSecurity : scope === 'FUNCTION' ? p.activeMnemonic : 'GLOBAL';
    const refs = text.match(/[A-Z]{1,6}\s(?:US|LN|JP)\sEQUITY/g) ?? [];
    appendWave4Item('notes', { scope, target, text: text.trim(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean), author: 'USER', pinned: false, ts: Date.now(), refs });
    appendAuditEvent({ panelIdx, type: 'NOTE_ADD', actor: 'USER', detail: `NOTE add ${scope} ${target}`, mnemonic: 'NOTE', security: p.activeSecurity });
    setText(''); setRefresh((v) => v + 1);
  };
  const togglePin = (id: string) => {
    const next = listWave4Store('notes').map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    replaceWave4Store('notes', next);
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NOTE • Structured Notes" right={<StatusBadge label={`${rows.length} NOTES`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}` }}>
          <option value="SECURITY">SECURITY</option><option value="FUNCTION">FUNCTION</option><option value="GLOBAL">GLOBAL</option>
        </select>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags csv" className="w-32 bg-transparent outline-none" />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Note text..." className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={add}>ADD</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => togglePin(String(r.id))} rowEntity={(r) => makeFunction(String(r.scope === 'FUNCTION' ? r.target : 'DES'), 'Note link')} /> : <EmptyFill hint="NO STRUCTURED NOTES" />}
    </div>
  );
}

export function FnTASK({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const { state } = useTerminalStore();
  const p = panels[panelIdx]!;
  const [title, setTitle] = useState('');
  const [, setRefresh] = useState(0);
  const tasks = listWave4Store('tasks');
  const rows = tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority ?? 'MED', source: t.source ?? 'MANUAL', security: t.security ?? '—', mnemonic: t.mnemonic ?? '—', due: t.dueTs ? new Date(t.dueTs).toISOString().slice(0, 10) : '—' }));
  const cols: DenseColumn[] = [{ key: 'title', header: 'Task', width: '1fr' }, { key: 'status', header: 'Status', width: '80px' }, { key: 'priority', header: 'Pri', width: '60px' }, { key: 'source', header: 'Src', width: '90px' }, { key: 'security', header: 'Security', width: '150px' }, { key: 'mnemonic', header: 'Fn', width: '60px' }, { key: 'due', header: 'Due', width: '90px' }];
  const add = () => {
    if (!title.trim()) return;
    appendWave4Item('tasks', { title: title.trim(), status: 'OPEN', priority: 'MED', source: 'MANUAL', security: p.activeSecurity, mnemonic: p.activeMnemonic, dueTs: Date.now() + 86_400_000 });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `TASK add ${title.trim()}`, mnemonic: 'TASK', security: p.activeSecurity });
    setTitle(''); setRefresh((v) => v + 1);
  };
  const fromAlerts = () => {
    state.alerts.slice(0, 3).forEach((a) => {
      appendWave4Item('tasks', { title: a.slice(0, 80), status: 'OPEN', priority: 'HIGH', source: 'ALERT', security: p.activeSecurity, mnemonic: 'ALRT', dueTs: Date.now() + 4 * 60 * 60 * 1000 });
    });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'TASK import from alerts', mnemonic: 'TASK', security: p.activeSecurity });
    setRefresh((v) => v + 1);
  };
  const toggleDone = (id: string) => {
    const next = listWave4Store('tasks').map((t) => {
      if (t.id !== id) return t;
      return { ...t, status: (t.status === 'OPEN' ? 'DONE' : 'OPEN') as 'OPEN' | 'DONE' };
    });
    replaceWave4Store('tasks', next);
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="TASK • Desk Ops Tasks" right={<StatusBadge label={`${rows.filter((r) => r.status === 'OPEN').length} OPEN`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={add}>ADD TASK</button>
        <button type="button" onClick={fromAlerts}>FROM ALERTS</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => {
        toggleDone(String(r.id));
        if (String(r.security) !== '—') {
          drill(makeSecurity(String(r.security)), 'OPEN_IN_PLACE', panelIdx);
          drill(makeFunction(String(r.mnemonic)), 'OPEN_IN_PLACE', panelIdx);
        }
      }} rowEntity={(r) => makeSecurity(String(r.security !== '—' ? r.security : p.activeSecurity))} /> : <EmptyFill hint="NO TASKS" />}
    </div>
  );
}

export function FnTCA({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const rows = state.blotter.slice(0, 40).map((b) => {
    const mid = b.last;
    const arrival = b.avg * (1 + (b.side === 'BUY' ? -0.0008 : 0.0008));
    const vwap = b.avg * (1 + 0.0004);
    const slipMidBps = ((b.avg - mid) / Math.max(0.01, mid)) * 10000;
    const slipArrivalBps = ((b.avg - arrival) / Math.max(0.01, arrival)) * 10000;
    const slipVWAPBps = ((b.avg - vwap) / Math.max(0.01, vwap)) * 10000;
    const venue = ['NYSE', 'NASDAQ', 'ARCA', 'BATS'][Math.abs(b.id.length + b.qty) % 4];
    return { id: b.id, symbol: b.symbol, side: b.side, qty: b.qty, avg: b.avg, venue, mid: mid.toFixed(2), arrBps: slipArrivalBps.toFixed(1), vwapBps: slipVWAPBps.toFixed(1), midBps: slipMidBps.toFixed(1) };
  });
  const cols: DenseColumn[] = [
    { key: 'symbol', header: 'Symbol', width: '130px' }, { key: 'side', header: 'Side', width: '60px' }, { key: 'qty', header: 'Qty', width: '70px', align: 'right' }, { key: 'avg', header: 'Avg', width: '70px', align: 'right' }, { key: 'venue', header: 'Venue', width: '80px' }, { key: 'midBps', header: 'vsMid', width: '70px', align: 'right', tone: true }, { key: 'arrBps', header: 'vsArr', width: '70px', align: 'right', tone: true }, { key: 'vwapBps', header: 'vsVWAP', width: '80px', align: 'right', tone: true },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="TCA • Transaction Cost Analysis (Sim)" right={<StatusBadge label={`${rows.length} FILLS`} variant="sim" />} />{rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.symbol))} /> : <EmptyFill hint="NO FILLS FOR TCA" />}</div>;
}

export function FnVEN({ panelIdx = 0 }: { panelIdx?: number }) {
  const venues = ['NYSE', 'NASDAQ', 'ARCA', 'BATS', 'IEX', 'DARK-A', 'DARK-B'];
  const rows = venues.map((v, i) => ({ id: v, venue: v, fillRate: `${(85 + (i * 2)).toFixed(1)}%`, slippage: `${(2.5 + i * 0.6).toFixed(1)}bps`, reject: `${(0.2 + i * 0.2).toFixed(2)}%`, latency: `${(6 + i * 2)}ms`, reco: i < 2 ? 'PREF' : i > 5 ? 'AVOID' : 'NEUTRAL' }));
  const cols: DenseColumn[] = [{ key: 'venue', header: 'Venue', width: '120px' }, { key: 'fillRate', header: 'FillRate', width: '90px' }, { key: 'slippage', header: 'Slip', width: '80px' }, { key: 'reject', header: 'Reject', width: '80px' }, { key: 'latency', header: 'Latency', width: '80px' }, { key: 'reco', header: 'Reco', width: '90px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="VEN • Venue Map (Sim)" right={<StatusBadge label="ROUTING" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('LAT', 'Venue latency trend')} /></div>;
}

export function FnIMP({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const quote = state.quotes[0];
  const [qty, setQty] = useState(10000);
  const adv = (quote?.volumeM ?? 20) * 1_000_000;
  const participation = qty / Math.max(1, adv);
  const spreadBps = state.microstructure.insideSpreadBps;
  const vol = state.risk.realizedVol;
  const impactBps = Math.max(0.5, participation * 900 + spreadBps * 0.4 + vol * 0.15);
  const rows = [{ id: '1', metric: 'Qty', value: qty }, { id: '2', metric: 'ADV', value: Math.round(adv) }, { id: '3', metric: 'Participation', value: `${(participation * 100).toFixed(3)}%` }, { id: '4', metric: 'Spread', value: `${spreadBps.toFixed(2)}bps` }, { id: '5', metric: 'Vol', value: vol.toFixed(2) }, { id: '6', metric: 'Expected Impact', value: `${impactBps.toFixed(2)}bps` }];
  const cols: DenseColumn[] = [{ key: 'metric', header: 'Metric', width: '1fr' }, { key: 'value', header: 'Value', width: '140px', align: 'right' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="IMP • Impact Model (Sim)" right={<StatusBadge label={`${impactBps.toFixed(1)}bps`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Order Qty</span>
        <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} className="w-28 bg-transparent outline-none" />
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" />
    </div>
  );
}

export function FnKILL({ panelIdx = 0 }: { panelIdx?: number }) {
  const existing = listWave4Store('kill')[0];
  const [haltOrders, setHaltOrders] = useState(existing?.haltOrders ?? false);
  const [cancelWorking, setCancelWorking] = useState(existing?.cancelWorking ?? false);
  const [freezeOps, setFreezeOps] = useState(existing?.freezeOps ?? false);
  const rows = [
    { id: 'h', control: 'Halt New Orders', value: haltOrders ? 'ACTIVE' : 'OFF' },
    { id: 'c', control: 'Cancel Working Orders', value: cancelWorking ? 'TRIGGERED' : 'OFF' },
    { id: 'f', control: 'Freeze Ops', value: freezeOps ? 'ACTIVE' : 'OFF' },
  ];
  const cols: DenseColumn[] = [{ key: 'control', header: 'Control', width: '1fr' }, { key: 'value', header: 'State', width: '120px' }];
  const toggle = (id: string) => {
    const policy = loadPolicyState();
    const gate = checkPolicy('POLICY_CHANGE', policy.activeRole);
    if (!gate.allowed) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: `KILL blocked ${id}`, mnemonic: 'KILL', policyReason: gate.reason });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'KILL action blocked by policy.', recovery: 'Use ADMIN/OPS role or adjust POL.', entity: 'KILL' });
      return;
    }
    let nextHalt = haltOrders;
    let nextCancel = cancelWorking;
    let nextFreeze = freezeOps;
    if (id === 'h') setHaltOrders((v) => !v);
    if (id === 'c') setCancelWorking((v) => !v);
    if (id === 'f') {
      nextFreeze = !freezeOps;
      setFreezeOps(nextFreeze);
      savePolicyState({ ...policy, mode: nextFreeze ? 'frozen' : 'normal' });
    }
    if (id === 'h') nextHalt = !haltOrders;
    if (id === 'c') nextCancel = !cancelWorking;
    replaceWave4Store('kill', [{ id: 'kill-state', haltOrders: nextHalt, cancelWorking: nextCancel, freezeOps: nextFreeze, ts: Date.now() }]);
    appendAuditEvent({ panelIdx, type: 'POLICY_CHANGE', actor: 'USER', detail: `KILL toggle ${id}`, mnemonic: 'KILL' });
  };
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="KILL • Kill Switch Panel" right={<StatusBadge label={haltOrders || freezeOps ? 'ARMED' : 'IDLE'} variant={haltOrders || freezeOps ? 'stale' : 'sim'} />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => toggle(String(r.id))} /></div>;
}

