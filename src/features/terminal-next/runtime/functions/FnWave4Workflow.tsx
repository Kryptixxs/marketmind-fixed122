'use client';

import React, { useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { appendAuditEvent, listAuditEvents } from '../commandAuditStore';
import { appendWave4Item, listWave4Store, replaceWave4Store } from '../wave4Store';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { isAllowedByRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';
import { makeFunction } from '../entities/types';
import { parseGoCommand } from '../PanelCommandLine';
import { useTerminalStore } from '../../store/TerminalStore';

function ts(v?: number) { return v ? new Date(v).toISOString().slice(0, 19).replace('T', ' ') : '—'; }
function scheduleMs(s: string) { return s === 'OPEN' ? 30 * 60 * 1000 : s === 'HOURLY' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; }

export function FnMAC({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, navigatePanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [name, setName] = useState('');
  const [steps, setSteps] = useState('');
  const [, setRefresh] = useState(0);
  const macros = listWave4Store('macros');
  const rows = macros.map((m) => ({ id: m.id, name: m.name, steps: m.steps, runs: m.runCount ?? 0, lastRun: ts(m.lastRunTs), lastResult: m.lastResult ?? '—' }));
  const cols: DenseColumn[] = [{ key: 'name', header: 'Macro', width: '120px' }, { key: 'steps', header: 'Steps', width: '1fr' }, { key: 'runs', header: 'Runs', width: '60px', align: 'right' }, { key: 'lastRun', header: 'LastRun', width: '150px' }, { key: 'lastResult', header: 'Result', width: '70px' }];

  const add = () => {
    if (!name.trim() || !steps.trim()) return;
    appendWave4Item('macros', { name: name.trim(), steps: steps.trim(), lastRunTs: undefined, runCount: 0, lastResult: 'OK' });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `MAC add ${name.trim()}`, mnemonic: 'MAC' });
    setName(''); setSteps(''); setRefresh((v) => v + 1);
  };

  const captureRecent = () => {
    const recent = listAuditEvents(60)
      .filter((e) => e.panelIdx === panelIdx && (e.type === 'GO' || e.type === 'DRILL'))
      .slice(0, 6)
      .reverse()
      .map((e) => {
        if (e.mnemonic && e.security) return `${e.security} ${e.mnemonic} GO`;
        if (e.mnemonic) return `${e.mnemonic} GO`;
        return e.detail;
      });
    if (recent.length === 0) return;
    setSteps(recent.join('; '));
  };

  const run = (id: string) => {
    const macro = listWave4Store('macros').find((m) => m.id === id);
    if (!macro) return;
    let ok = true;
    const commands = macro.steps.split(';').map((s) => s.trim()).filter(Boolean);
    commands.forEach((cmd) => {
      try {
        const parsed = parseGoCommand(cmd, p.activeSecurity, p.activeMnemonic);
        const mn = parsed.mnemonic ?? p.activeMnemonic;
        const sec = parsed.security ?? p.activeSecurity;
        const sector = parsed.sector ?? p.marketSector;
        navigatePanel(panelIdx, mn, sec, sector);
      } catch {
        ok = false;
      }
    });
    if (!ok) {
      appendErrorEntry({ panelIdx, kind: 'PARSER', message: `Macro run partially failed: ${macro.name}`, recovery: 'Validate command sequence in MAC.' });
    }
    const next = listWave4Store('macros').map((m) => (m.id === id ? { ...m, lastRunTs: Date.now(), runCount: (m.runCount ?? 0) + 1, lastResult: (ok ? 'OK' : 'FAIL') as 'OK' | 'FAIL' } : m));
    replaceWave4Store('macros', next);
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `MAC run ${macro.name} (${commands.length} steps)`, mnemonic: 'MAC', security: p.activeSecurity });
    setRefresh((v) => v + 1);
  };

  const schedule = (id: string) => {
    const macro = listWave4Store('macros').find((m) => m.id === id);
    if (!macro) return;
    appendWave4Item('jobs', { name: `MACRO:${macro.name}`, schedule: 'HOURLY', status: 'IDLE', lastRunTs: undefined, nextRunTs: Date.now() + scheduleMs('HOURLY'), runCount: 0 });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `MAC scheduled ${macro.name}`, mnemonic: 'JOB' });
    setRefresh((v) => v + 1);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="MAC • Macro Recorder" right={<StatusBadge label={`${rows.length} MACROS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Macro name" className="flex-1 bg-transparent outline-none" />
        <input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="AAPL DES GO; CN GO; GP 1Y GO" className="flex-[2] bg-transparent outline-none" />
        <button type="button" onClick={captureRecent}>CAPTURE</button>
        <button type="button" onClick={add}>SAVE</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => run(String(r.id))} rowEntity={() => makeFunction('JOB', 'Schedule macro')} /> : <EmptyFill hint="NO MACROS — SAVE A COMMAND CHAIN" />}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderTop: `1px solid ${DENSITY.gridlineColor}` }}>
          <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Select macro ID to schedule hourly:</span>
          <select defaultValue="" onChange={(e) => { if (e.target.value) schedule(e.target.value); e.target.value = ''; }} style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}` }}>
            <option value="">Choose...</option>
            {rows.map((r) => <option key={String(r.id)} value={String(r.id)}>{String(r.name)}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export function FnJOB({ panelIdx = 0 }: { panelIdx?: number }) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('HOURLY');
  const [, setRefresh] = useState(0);
  const jobs = listWave4Store('jobs');
  const rows = jobs.map((j) => ({ id: j.id, name: j.name, schedule: j.schedule, status: j.status, runs: j.runCount ?? 0, lastRun: ts(j.lastRunTs), nextRun: ts(j.nextRunTs), error: j.lastError ?? '—' }));
  const cols: DenseColumn[] = [{ key: 'name', header: 'Job', width: '1fr' }, { key: 'schedule', header: 'Schedule', width: '90px' }, { key: 'status', header: 'Status', width: '80px' }, { key: 'runs', header: 'Runs', width: '60px', align: 'right' }, { key: 'lastRun', header: 'LastRun', width: '140px' }, { key: 'nextRun', header: 'NextRun', width: '140px' }, { key: 'error', header: 'LastError', width: '1fr' }];
  const add = () => {
    if (!name.trim()) return;
    appendWave4Item('jobs', { name: name.trim(), schedule, status: 'IDLE', lastRunTs: undefined, nextRunTs: Date.now() + scheduleMs(schedule), runCount: 0, lastError: undefined });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `JOB add ${name.trim()} ${schedule}`, mnemonic: 'JOB' });
    setName(''); setRefresh((v) => v + 1);
  };
  const runNow = (id: string) => {
    const next = listWave4Store('jobs').map((j) => {
      if (j.id !== id) return j;
      const failed = (j.name.length + (j.runCount ?? 0)) % 5 === 0;
      return {
        ...j,
        status: (failed ? 'FAIL' : 'OK') as 'FAIL' | 'OK',
        lastRunTs: Date.now(),
        nextRunTs: Date.now() + scheduleMs(j.schedule),
        runCount: (j.runCount ?? 0) + 1,
        lastError: failed ? 'Simulated timeout' : undefined,
      };
    });
    replaceWave4Store('jobs', next);
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `JOB run ${id}`, mnemonic: 'JOB' });
    if (next.find((j) => j.id === id)?.status === 'FAIL') {
      appendErrorEntry({ panelIdx, kind: 'FEED', message: 'Scheduled job failed.', recovery: 'Open JOB row and rerun manually.', entity: 'JOB' });
    }
    setRefresh((v) => v + 1);
  };
  const runDue = () => {
    const now = Date.now();
    listWave4Store('jobs').filter((j) => (j.nextRunTs ?? 0) <= now).forEach((j) => runNow(j.id));
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="JOB • Scheduled Jobs (Sim)" right={<StatusBadge label={`${rows.length} JOBS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Job name" className="flex-1 bg-transparent outline-none" />
        <select value={schedule} onChange={(e) => setSchedule(e.target.value)} style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}` }}>
          <option>HOURLY</option><option>EOD</option><option>OPEN</option>
        </select>
        <button type="button" onClick={add}>ADD</button>
        <button type="button" onClick={runDue}>RUN DUE</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => runNow(String(r.id))} rowEntity={() => makeFunction('AUD', 'Job logs')} /> : <EmptyFill hint="NO JOBS — CREATE A SCHEDULED TASK" />}
    </div>
  );
}

export function FnHOT({ panelIdx = 0 }: { panelIdx?: number }) {
  const [keybind, setKeybind] = useState('');
  const [target, setTarget] = useState('DES');
  const [, setRefresh] = useState(0);
  const binds = listWave4Store('hotkeys');
  const rows = binds.map((h) => ({ id: h.id, key: h.key, action: h.action, target: h.target, status: h.enabled ? 'ENABLED' : 'DISABLED', conflict: binds.some((x) => x.id !== h.id && x.key === h.key) ? 'YES' : 'NO' }));
  const cols: DenseColumn[] = [{ key: 'key', header: 'Key', width: '120px' }, { key: 'action', header: 'Action', width: '120px' }, { key: 'target', header: 'Target', width: '90px' }, { key: 'status', header: 'Status', width: '80px' }, { key: 'conflict', header: 'Conflict', width: '80px' }];
  const add = () => {
    if (!keybind.trim()) return;
    appendWave4Item('hotkeys', { key: keybind.trim().toUpperCase(), action: 'OPEN_MNEMONIC', target, enabled: true });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `HOT bind ${keybind} -> ${target}`, mnemonic: 'HOT' });
    setKeybind(''); setRefresh((v) => v + 1);
  };
  const toggle = (id: string) => {
    const next = listWave4Store('hotkeys').map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h));
    replaceWave4Store('hotkeys', next);
    setRefresh((v) => v + 1);
  };
  const restoreDefaults = () => {
    replaceWave4Store('hotkeys', [
      { id: 'hot-default-1', key: 'CTRL+1', action: 'OPEN_MNEMONIC', target: 'DES', enabled: true },
      { id: 'hot-default-2', key: 'CTRL+2', action: 'OPEN_MNEMONIC', target: 'GP', enabled: true },
      { id: 'hot-default-3', key: 'CTRL+3', action: 'OPEN_MNEMONIC', target: 'TOP', enabled: true },
    ]);
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'HOT restore defaults', mnemonic: 'HOT' });
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="HOT • Hotkey Editor" right={<StatusBadge label="KEYBOARD-FIRST" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={keybind} onChange={(e) => setKeybind(e.target.value)} placeholder="Ctrl+Shift+1" className="flex-1 bg-transparent outline-none" />
        <input value={target} onChange={(e) => setTarget(e.target.value.toUpperCase())} placeholder="Mnemonic" className="w-24 bg-transparent outline-none" />
        <button type="button" onClick={add}>BIND</button>
        <button type="button" onClick={restoreDefaults}>RESTORE</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => toggle(String(r.id))} /> : <EmptyFill hint="NO HOTKEYS — DEFINE A BINDING" />}
    </div>
  );
}

export function FnTPL({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, navigatePanel } = useTerminalOS();
  const [name, setName] = useState('');
  const [, setRefresh] = useState(0);
  const templates = listWave4Store('templates');
  const rows = templates.map((t) => ({ id: t.id, name: t.name, layout: t.panels.map((p) => p.mnemonic).join(' | '), count: t.panels.length }));
  const cols: DenseColumn[] = [{ key: 'name', header: 'Template', width: '160px' }, { key: 'layout', header: 'Panels', width: '1fr' }, { key: 'count', header: '#', width: '50px', align: 'right' }];
  const saveCurrent = () => {
    if (!name.trim()) return;
    appendWave4Item('templates', {
      name: name.trim(),
      panels: panels.map((p) => ({ mnemonic: p.activeMnemonic, security: p.activeSecurity, sector: p.marketSector })),
    });
    appendAuditEvent({ panelIdx, type: 'WORKSPACE_SAVE', actor: 'USER', detail: `TPL save ${name.trim()}`, mnemonic: 'TPL' });
    setName('');
    setRefresh((v) => v + 1);
  };
  const applyTemplate = (id: string) => {
    const tpl = listWave4Store('templates').find((t) => t.id === id);
    if (!tpl) return;
    tpl.panels.slice(0, panels.length).forEach((p, idx) => navigatePanel(idx, p.mnemonic, p.security, p.sector as never));
    appendAuditEvent({ panelIdx, type: 'WORKSPACE_LOAD', actor: 'USER', detail: `TPL load ${tpl.name}`, mnemonic: 'TPL' });
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="TPL • Layout Templates" right={<StatusBadge label={`${rows.length} TEMPLATES`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={saveCurrent}>SAVE CURRENT</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => applyTemplate(String(r.id))} /> : <EmptyFill hint="NO TEMPLATES — SAVE CURRENT DOCK LAYOUT" />}
    </div>
  );
}

export function FnRPT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState('DES,HP,CN');
  const [, setRefresh] = useState(0);
  const { state } = useTerminalStore();
  const reports = listWave4Store('reports');
  const rows = reports.map((r) => ({ id: r.id, title: r.title, sections: r.sections.join(','), created: ts(r.createdTs) }));
  const cols: DenseColumn[] = [{ key: 'title', header: 'Report', width: '180px' }, { key: 'sections', header: 'Sections', width: '1fr' }, { key: 'created', header: 'Created', width: '150px' }];
  const build = () => {
    if (!title.trim()) return;
    const sec = sections.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    const bodyHtml = [
      `<h3>${title.trim()}</h3>`,
      `<div>Security: ${panels[panelIdx]?.activeSecurity ?? ''}</div>`,
      `<div>Sections: ${sec.join(', ')}</div>`,
      `<ul>${state.quotes.slice(0, 6).map((q) => `<li>${q.symbol}: ${q.last.toFixed(2)} (${q.pct.toFixed(2)}%)</li>`).join('')}</ul>`,
      `<ol>${state.headlines.slice(0, 5).map((h) => `<li>${h}</li>`).join('')}</ol>`,
    ].join('');
    appendWave4Item('reports', { title: title.trim(), sections: sec, createdTs: Date.now(), security: panels[panelIdx]?.activeSecurity, bodyHtml });
    appendAuditEvent({ panelIdx, type: 'EXPORT', actor: 'USER', detail: `RPT build ${title.trim()} (${sec.join(',')})`, mnemonic: 'RPT', security: panels[panelIdx]?.activeSecurity });
    appendWave4Item('exports', { kind: 'REPORT', label: title.trim(), by: 'USER', why: 'RPT export', ts: Date.now(), ref: `RPT-${title.trim()}` });
    setTitle(''); setRefresh((v) => v + 1);
  };
  const preview = (id: string) => {
    const rpt = listWave4Store('reports').find((r) => r.id === id);
    if (!rpt?.bodyHtml) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.title = `RPT ${rpt.title}`;
    w.document.body.innerHTML = `<div style="font-family:${DENSITY.fontFamily};background:${DENSITY.bgBase};color:${DENSITY.textPrimary};padding:16px">${rpt.bodyHtml}</div>`;
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="RPT • Report Builder" right={<StatusBadge label={`${rows.length} REPORTS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title" className="flex-1 bg-transparent outline-none" />
        <input value={sections} onChange={(e) => setSections(e.target.value)} placeholder="DES,HP,CN,OWN" className="flex-[2] bg-transparent outline-none" />
        <button type="button" onClick={build}>BUILD</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('EXP', 'View exports')} onRowClick={(r) => preview(String(r.id))} /> : <EmptyFill hint="NO REPORTS — BUILD A SECTION PACK" />}
    </div>
  );
}

export function FnEXP({ panelIdx = 0 }: { panelIdx?: number }) {
  const [, setRefresh] = useState(0);
  const [kindFilter, setKindFilter] = useState('ALL');
  const policy = loadPolicyState();
  const exportsRows = listWave4Store('exports');
  const auditExports = listAuditEvents(300).filter((e) => e.type === 'EXPORT').map((e) => ({ id: e.id, kind: 'AUDIT', label: e.detail, by: e.actor, why: e.policyReason ?? 'manual', ts: e.ts, ref: e.mnemonic }));
  const rows = [...exportsRows, ...auditExports]
    .sort((a, b) => b.ts - a.ts)
    .filter((r) => kindFilter === 'ALL' || r.kind === kindFilter)
    .map((r) => ({ ...r, at: ts(r.ts), status: (r as { status?: string }).status ?? 'OK', blockedReason: (r as { blockedReason?: string }).blockedReason ?? '—' }));
  const cols: DenseColumn[] = [{ key: 'kind', header: 'Kind', width: '90px' }, { key: 'label', header: 'Label', width: '1fr' }, { key: 'status', header: 'Status', width: '80px' }, { key: 'by', header: 'By', width: '70px' }, { key: 'why', header: 'Why', width: '120px' }, { key: 'blockedReason', header: 'BlockedReason', width: '180px' }, { key: 'at', header: 'At', width: '150px' }];
  const addExtract = () => {
    const gate = checkPolicy('EXPORT', policy.activeRole);
    if (!isAllowedByRole(policy.activeRole, 'EXPORT') || !gate.allowed) {
      const reason = gate.reason ?? 'Export not allowed';
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'EXP data extract blocked', mnemonic: 'EXP', policyReason: reason });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Export center blocked by policy.', recovery: 'Review ENT/COMP/POL', entity: 'EXP' });
      appendWave4Item('exports', { kind: 'DATA_EXTRACT', label: 'Blocked extract attempt', by: policy.activeRole, why: 'policy block', ts: Date.now(), ref: 'EXP-BLOCK', status: 'BLOCKED', blockedReason: reason });
      setRefresh((v) => v + 1);
      return;
    }
    appendWave4Item('exports', { kind: 'DATA_EXTRACT', label: 'Symbol snapshot extract', by: policy.activeRole, why: 'manual extract', ts: Date.now(), ref: 'EXP-SIM', status: 'OK' });
    appendAuditEvent({ panelIdx, type: 'EXPORT', actor: policy.activeRole, detail: 'EXP data extract executed', mnemonic: 'EXP' });
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="EXP • Export Center" right={<StatusBadge label={`${rows.length} EXPORTS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}` }}>
          <option value="ALL">ALL</option>
          <option value="REPORT">REPORT</option>
          <option value="GRAB+">GRAB+</option>
          <option value="DATA_EXTRACT">DATA_EXTRACT</option>
          <option value="AUDIT">AUDIT</option>
        </select>
        <button type="button" onClick={addExtract}>RUN DATA EXTRACT</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" /> : <EmptyFill hint="NO EXPORTS YET" />}
    </div>
  );
}

export function FnGRABPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('clip,research');
  const [, setRefresh] = useState(0);
  const clips = listWave4Store('clips');
  const rows = clips.map((c) => ({ id: c.id, title: c.title, security: c.security, mnemonic: c.mnemonic, note: c.note, ts: ts(c.ts) }));
  const cols: DenseColumn[] = [{ key: 'title', header: 'Clip', width: '140px' }, { key: 'security', header: 'Security', width: '150px' }, { key: 'mnemonic', header: 'Fn', width: '60px' }, { key: 'note', header: 'Annotation', width: '1fr' }, { key: 'ts', header: 'Time', width: '150px' }];
  const grab = () => {
    const annotation = `${new Date().toISOString()} | ${p.activeSecurity} | ${p.activeMnemonic} | ${note.trim()}`;
    appendWave4Item('clips', { title: `Clip ${p.activeMnemonic}`, note: note.trim(), security: p.activeSecurity, mnemonic: p.activeMnemonic, ts: Date.now(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean), annotation });
    appendWave4Item('exports', { kind: 'GRAB+', label: `${p.activeSecurity} ${p.activeMnemonic}`, by: 'USER', why: note.trim() || 'research clip', ts: Date.now(), ref: 'GRAB+' });
    appendAuditEvent({ panelIdx, type: 'EXPORT', actor: 'USER', detail: `GRAB+ ${p.activeSecurity} ${p.activeMnemonic}`, mnemonic: 'GRAB+', security: p.activeSecurity });
    setNote(''); setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="GRAB+ • Screenshot + Annotation" right={<StatusBadge label="SIM CLIPS" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags csv" className="w-36 bg-transparent outline-none" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotation note..." className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={grab}>SAVE CLIP</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('CLIP', 'Open clip library')} /> : <EmptyFill hint="NO CLIPS — SAVE CURRENT PANEL WITH NOTE" />}
    </div>
  );
}

export function FnCLIP({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel } = useTerminalOS();
  const [tagFilter, setTagFilter] = useState('');
  const clips = listWave4Store('clips');
  const rows = clips
    .filter((c) => !tagFilter.trim() || (c.tags ?? []).join(',').toUpperCase().includes(tagFilter.trim().toUpperCase()))
    .map((c) => ({ id: c.id, title: c.title, security: c.security, mnemonic: c.mnemonic, tags: (c.tags ?? []).join(','), note: c.note, ts: ts(c.ts) }));
  const cols: DenseColumn[] = [{ key: 'title', header: 'Clip', width: '160px' }, { key: 'security', header: 'Security', width: '150px' }, { key: 'mnemonic', header: 'Fn', width: '60px' }, { key: 'tags', header: 'Tags', width: '120px' }, { key: 'note', header: 'Note', width: '1fr' }, { key: 'ts', header: 'Time', width: '150px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="CLIP • Clip Library" right={<StatusBadge label={`${rows.length} CLIPS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Filter by tag..." className="flex-1 bg-transparent outline-none" />
      </div>
      {rows.length ? (
        <DenseTable
          columns={cols}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          onRowClick={(r) => navigatePanel(panelIdx, String(r.mnemonic), String(r.security))}
          rowEntity={(r) => makeFunction(String(r.mnemonic), 'Open original state')}
        />
      ) : <EmptyFill hint="NO CLIPS SAVED" />}
    </div>
  );
}

