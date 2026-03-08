'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { addBookmark, addTrailStep, listBookmarks, listTrailSteps, removeBookmark } from '../navigationIntelStore';
import { appendAuditEvent } from '../commandAuditStore';
import { makeFunction, makeSecurity } from '../entities/types';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { isAllowedByRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';
import type { MarketSector } from '../panelState';
import type { EntityRef } from '../entities/types';
import { guardRuntimeAction } from '../actionGuard';

function restorePanelSnapshot(
  panelIdx: number,
  dispatchPanel: (panelIdx: number, action: {
    type: 'NAVIGATE';
    mnemonic: string;
    security?: string;
    sector?: MarketSector;
    timeframe?: string;
  } | {
    type: 'SET_CURSOR';
    row: number;
  } | {
    type: 'SET_SCROLL';
    pos: number;
  }) => void,
  row: Record<string, unknown>,
  sourceMnemonic: 'NAVG' | 'BKMK' | 'TRAIL',
) {
  dispatchPanel(panelIdx, {
    type: 'NAVIGATE',
    mnemonic: String(row.mnemonic),
    security: String(row.security),
    timeframe: String(row.timeframe ?? '1Y'),
    sector: String(row.sector ?? 'EQUITY') as MarketSector,
  });
  const cursor = Number(row.selectionCursor ?? 0);
  const scroll = Number(row.scrollPosition ?? 0);
  if (Number.isFinite(cursor) && cursor >= 0) dispatchPanel(panelIdx, { type: 'SET_CURSOR', row: cursor });
  if (Number.isFinite(scroll) && scroll >= 0) dispatchPanel(panelIdx, { type: 'SET_SCROLL', pos: scroll });
  appendAuditEvent({
    panelIdx,
    type: 'NAV_JUMP',
    actor: 'USER',
    detail: `${sourceMnemonic} restore ${String(row.mnemonic)} ${String(row.security)}`,
    mnemonic: sourceMnemonic,
    security: String(row.security),
  });
}

export function FnNAVG({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const trails = listTrailSteps(panelIdx).slice(0, 50).map((t) => ({
    id: t.id,
    ts: new Date(t.ts).toISOString().slice(11, 19),
    action: t.action,
    mnemonic: t.mnemonic,
    security: t.security,
    timeframe: t.timeframe ?? '1Y',
    sector: t.sector ?? 'EQUITY',
    selectionCursor: t.selectionCursor ?? 0,
    scrollPosition: t.scrollPosition ?? 0,
  }));
  const cols: DenseColumn[] = [{ key: 'ts', header: 'Time', width: '70px' }, { key: 'action', header: 'Action', width: '120px' }, { key: 'mnemonic', header: 'Fn', width: '70px' }, { key: 'security', header: 'Security', width: '1fr' }, { key: 'timeframe', header: 'TF', width: '50px' }, { key: 'sector', header: 'Sec', width: '60px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NAVG • Navigation Graph Per Panel" right={<StatusBadge label={`${trails.length} NODES`} variant="sim" />} />
      {trails.length ? <DenseTable columns={cols} rows={trails} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => restorePanelSnapshot(panelIdx, dispatchPanel, r, 'NAVG')} rowEntity={(r) => makeFunction(String(r.mnemonic), 'Restore state')} /> : <EmptyFill hint={`NO TRAIL FOR PANEL ${panels[panelIdx]?.id ?? panelIdx}`} />}
    </div>
  );
}

export function FnBKMK({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [label, setLabel] = useState('');
  const [refresh, setRefresh] = useState(0);
  const rows = listBookmarks().map((b) => ({ id: b.id, label: b.label, panel: b.panelIdx, mnemonic: b.mnemonic, security: b.security, sector: b.sector ?? 'EQUITY', timeframe: b.timeframe ?? '1Y', selectionCursor: b.selectionCursor ?? 0, scrollPosition: b.scrollPosition ?? 0, filters: b.filters ?? '', created: new Date(b.createdTs).toISOString().slice(0, 19).replace('T', ' ') }));
  const cols: DenseColumn[] = [{ key: 'label', header: 'Bookmark', width: '1fr' }, { key: 'mnemonic', header: 'Fn', width: '70px' }, { key: 'security', header: 'Security', width: '170px' }, { key: 'timeframe', header: 'TF', width: '50px' }, { key: 'sector', header: 'Sec', width: '60px' }, { key: 'filters', header: 'Filters', width: '120px' }, { key: 'created', header: 'Created', width: '150px' }];
  const add = () => {
    const policy = loadPolicyState();
    const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
    if (!isAllowedByRole(policy.activeRole, 'SEND_TO_PANEL') || !gate.allowed) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'BKMK save blocked', mnemonic: 'BKMK', security: p.activeSecurity, policyReason: gate.reason ?? 'SEND_TO_PANEL denied' });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Bookmark save blocked by policy.', recovery: 'Use ADMIN/OPS/TRADER/PM or adjust policy.', entity: 'BKMK' });
      return;
    }
    addBookmark({
      panelIdx,
      mnemonic: p.activeMnemonic,
      security: p.activeSecurity,
      sector: p.marketSector,
      timeframe: p.timeframe,
      selectionCursor: p.selectionCursor,
      scrollPosition: p.scrollPosition,
      filters: `sector:${p.marketSector}`,
      label: label.trim() || `${p.activeMnemonic} ${p.activeSecurity}`,
    });
    appendAuditEvent({ panelIdx, type: 'GO', actor: policy.activeRole, detail: `BKMK add ${p.activeMnemonic} ${p.activeSecurity}`, mnemonic: 'BKMK', security: p.activeSecurity });
    setLabel('');
    setRefresh((v) => v + 1);
  };
  void refresh;
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="BKMK • Bookmarks Stateful" right={<StatusBadge label={`${rows.length} BOOKMARKS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input className="flex-1 bg-transparent outline-none" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bookmark label..." />
        <button type="button" onClick={add}>SAVE</button>
      </div>
      {rows.length ? (
        <DenseTable
          columns={cols}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          onRowClick={(r) => restorePanelSnapshot(panelIdx, dispatchPanel, r, 'BKMK')}
          rowEntity={(r) => makeSecurity(String(r.security))}
        />
      ) : <EmptyFill hint="NO BOOKMARKS SAVED" />}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderTop: '1px solid #111' }}>
          <span style={{ color: DENSITY.textMuted }}>Delete:</span>
          <select defaultValue="" onChange={(e) => {
            if (e.target.value) {
              const policy = loadPolicyState();
              const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
              if (!isAllowedByRole(policy.activeRole, 'SEND_TO_PANEL') || !gate.allowed) {
                appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'BKMK delete blocked', mnemonic: 'BKMK', policyReason: gate.reason ?? 'SEND_TO_PANEL denied' });
                appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Bookmark delete blocked by policy.', recovery: 'Adjust policy role/locks.', entity: 'BKMK' });
              } else {
                removeBookmark(e.target.value);
                appendAuditEvent({ panelIdx, type: 'GO', actor: policy.activeRole, detail: `BKMK delete ${e.target.value}`, mnemonic: 'BKMK', security: p.activeSecurity });
                setRefresh((v) => v + 1);
              }
            }
            e.target.value = '';
          }} style={{ background: '#000', border: '1px solid #222' }}>
            <option value="">Choose...</option>
            {rows.map((r) => <option key={String(r.id)} value={String(r.id)}>{String(r.label)}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export function FnTRAIL({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const rows = listTrailSteps(panelIdx).slice(0, 100).map((t) => ({ id: t.id, ts: new Date(t.ts).toISOString().slice(11, 19), action: t.action, mnemonic: t.mnemonic, security: t.security, timeframe: t.timeframe ?? '1Y', sector: t.sector ?? 'EQUITY', selectionCursor: t.selectionCursor ?? 0, scrollPosition: t.scrollPosition ?? 0 }));
  const cols: DenseColumn[] = [{ key: 'ts', header: 'Time', width: '70px' }, { key: 'action', header: 'Action', width: '120px' }, { key: 'mnemonic', header: 'Fn', width: '70px' }, { key: 'security', header: 'Security', width: '1fr' }, { key: 'timeframe', header: 'TF', width: '50px' }, { key: 'sector', header: 'Sec', width: '60px' }];
  const capture = () => {
    addTrailStep({ panelIdx, action: 'snapshot', mnemonic: p.activeMnemonic, security: p.activeSecurity, sector: p.marketSector, timeframe: p.timeframe, selectionCursor: p.selectionCursor, scrollPosition: p.scrollPosition });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `TRAIL capture ${p.activeMnemonic}`, mnemonic: 'TRAIL', security: p.activeSecurity });
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="TRAIL • Session Replay" right={<StatusBadge label={`${rows.length} STEPS`} variant="sim" />} />
      <div className="flex items-center px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={capture}>CAPTURE STEP</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => restorePanelSnapshot(panelIdx, dispatchPanel, r, 'TRAIL')} rowEntity={() => makeFunction('AUD', 'Open audit event')} /> : <EmptyFill hint="NO TRAIL STEPS" />}
    </div>
  );
}

export function FnRELATE({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const sec = panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY';
  const rows = [
    { id: '1', type: 'Peer', item: 'MSFT US EQUITY', via: 'RELG', entityType: 'SECURITY' },
    { id: '2', type: 'Region', item: 'China', via: 'GEO', entityType: 'COUNTRY' },
    { id: '3', type: 'News', item: 'Supply disruption narrative', via: 'NREL', entityType: 'FUNCTION' },
    { id: '4', type: 'Exposure', item: 'Freight lane pressure', via: 'GEO.F', entityType: 'FUNCTION' },
    { id: '5', type: 'Driver', item: 'Cross-asset sensitivity pack', via: 'XDRV', entityType: 'FUNCTION' },
    { id: '6', type: 'Path', item: `${sec} causal chain`, via: 'PATH', entityType: 'FUNCTION' },
  ];
  const cols: DenseColumn[] = [{ key: 'type', header: 'Type', width: '80px' }, { key: 'item', header: 'Related', width: '1fr' }, { key: 'via', header: 'Via', width: '70px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="RELATE • Related to This" right={<StatusBadge label={sec} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => {
    if (String(r.entityType) === 'SECURITY') return makeSecurity(String(r.item));
    if (String(r.entityType) === 'COUNTRY') return makeFunction('RGN', `Open ${String(r.item)} dossier`);
    return makeFunction(String(r.via), 'Open related view');
  }} /></div>;
}

export function FnFOCUS({ panelIdx = 0 }: { panelIdx?: number }) {
  const { focusedPanel, setFocusedPanel, panels } = useTerminalOS();
  const [saved, setSaved] = useState<number | null>(null);
  const policy = loadPolicyState();
  const rows = panels.map((p, i) => ({ id: `${i}`, panel: `P${i + 1}`, mnemonic: p.activeMnemonic, security: p.activeSecurity, focused: focusedPanel === i ? 'YES' : '' }));
  const cols: DenseColumn[] = [{ key: 'panel', header: 'Panel', width: '70px' }, { key: 'mnemonic', header: 'Fn', width: '70px' }, { key: 'security', header: 'Security', width: '1fr' }, { key: 'focused', header: 'Focused', width: '70px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="FOCUS • Focus Mode" right={<StatusBadge label={`P${focusedPanel + 1}`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => {
          const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
          if (!isAllowedByRole(policy.activeRole, 'SEND_TO_PANEL') || !gate.allowed) {
            appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'FOCUS blocked', mnemonic: 'FOCUS', security: panels[panelIdx]?.activeSecurity, policyReason: gate.reason ?? 'SEND_TO_PANEL denied' });
            appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Focus change blocked by policy.', recovery: 'Adjust ENT/COMP/POL send-to-panel permissions.', entity: 'FOCUS' });
            return;
          }
          setSaved(focusedPanel);
          setFocusedPanel(panelIdx);
          addTrailStep({ panelIdx, action: 'focus', mnemonic: panels[panelIdx]?.activeMnemonic ?? 'FOCUS', security: panels[panelIdx]?.activeSecurity ?? '', sector: panels[panelIdx]?.marketSector, timeframe: panels[panelIdx]?.timeframe, selectionCursor: panels[panelIdx]?.selectionCursor, scrollPosition: panels[panelIdx]?.scrollPosition });
          appendAuditEvent({ panelIdx, type: 'NAV_JUMP', actor: policy.activeRole, detail: `FOCUS THIS P${panelIdx + 1}`, mnemonic: 'FOCUS', security: panels[panelIdx]?.activeSecurity });
        }}>FOCUS THIS</button>
        <button type="button" onClick={() => {
          if (saved === null) return;
          const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
          if (!isAllowedByRole(policy.activeRole, 'SEND_TO_PANEL') || !gate.allowed) {
            appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'FOCUS restore blocked', mnemonic: 'FOCUS', security: panels[saved]?.activeSecurity, policyReason: gate.reason ?? 'SEND_TO_PANEL denied' });
            appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Focus restore blocked by policy.', recovery: 'Adjust ENT/COMP/POL send-to-panel permissions.', entity: 'FOCUS' });
            return;
          }
          setFocusedPanel(saved);
          addTrailStep({ panelIdx, action: 'focus-restore', mnemonic: panels[saved]?.activeMnemonic ?? 'FOCUS', security: panels[saved]?.activeSecurity ?? '', sector: panels[saved]?.marketSector, timeframe: panels[saved]?.timeframe, selectionCursor: panels[saved]?.selectionCursor, scrollPosition: panels[saved]?.scrollPosition });
          appendAuditEvent({ panelIdx, type: 'NAV_JUMP', actor: policy.activeRole, detail: `FOCUS RESTORE P${saved + 1}`, mnemonic: 'FOCUS', security: panels[saved]?.activeSecurity });
        }}>RESTORE</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => {
        if (!guardRuntimeAction({
          panelIdx,
          permission: 'SEND_TO_PANEL',
          detail: `FOCUS jump P${Number(r.id) + 1} blocked`,
          mnemonic: 'FOCUS',
          security: panels[Number(r.id)]?.activeSecurity,
          deniedMessage: 'Panel focus jump blocked by policy.',
          deniedRecovery: 'Adjust ENT/COMP/POL send-to-panel permissions.',
          actorOverride: policy.activeRole,
        })) return;
        setFocusedPanel(Number(r.id));
        appendAuditEvent({ panelIdx, type: 'NAV_JUMP', actor: policy.activeRole, detail: `FOCUS jump P${Number(r.id) + 1}`, mnemonic: 'FOCUS', security: panels[Number(r.id)]?.activeSecurity });
      }} rowEntity={(r) => makeFunction(String(r.mnemonic), 'Focus panel mnemonic')} />
    </div>
  );
}

function DossierTable({
  panelIdx,
  code,
  title,
  rows,
  rowEntity,
}: {
  panelIdx: number;
  code: string;
  title: string;
  rows: Array<Record<string, unknown>>;
  rowEntity?: (row: Record<string, unknown>) => EntityRef;
}) {
  const cols: DenseColumn[] = Object.keys(rows[0] ?? { id: '', section: '', value: '' })
    .filter((k) => k !== 'id')
    .map((k) => ({ key: k, header: k.toUpperCase(), width: k === 'section' ? '160px' : '1fr' }));
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title={`${code} • ${title}`} right={<StatusBadge label="SIM DOSSIER" variant="sim" />} />{rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => rowEntity?.(r) ?? makeFunction('RELATE', 'Related actions')} /> : <EmptyFill hint="NO DOSSIER DATA" />}</div>;
}

export function FnCMPY({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const sec = panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY';
  const rows = [
    { id: '1', section: 'Subsidiaries', value: 'Services, Devices, Finance', drill: 'INDY' },
    { id: '2', section: 'Region revenue', value: 'US 42% • EU 24% • CN 18%', drill: 'GEO.C' },
    { id: '3', section: 'Facilities', value: '18 critical sites', drill: 'FAC' },
    { id: '4', section: 'Regulatory', value: '2 active reviews', drill: 'NREL' },
    { id: '5', section: 'Peer cluster', value: 'MegaCap Platform', drill: 'RELG' },
    { id: '6', section: 'Security', value: sec, drill: 'DES' },
  ];
  return <DossierTable panelIdx={panelIdx} code="CMPY" title="Company Dossier" rows={rows} rowEntity={(r) => String(r.section) === 'Security' ? makeSecurity(String(r.value)) : makeFunction(String(r.drill ?? 'RELATE'), 'Open dossier drill')} />;
}

export function FnSECT({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', section: 'Constituents', value: 'Top 25 by mcap', drill: 'RGN.C' },
    { id: '2', section: 'Dispersion', value: '1M dispersion 23%', drill: 'CORR+' },
    { id: '3', section: 'Valuation band', value: 'P/E 22x median', drill: 'RV' },
    { id: '4', section: 'Macro sensitivity', value: 'Rates + Dollar', drill: 'XDRV' },
    { id: '5', section: 'Region exposure', value: 'US/EU/CN mix', drill: 'GEO.X' },
  ];
  return <DossierTable panelIdx={panelIdx} code="SECT" title="Sector Dossier" rows={rows} rowEntity={(r) => makeFunction(String(r.drill ?? 'RELATE'), 'Open sector drill')} />;
}

export function FnINDY({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', section: 'Competitive map', value: 'Top 10 incumbents + challengers', drill: 'RELG' },
    { id: '2', section: 'Supply concentration', value: '2 bottleneck suppliers', drill: 'SCN' },
    { id: '3', section: 'Pricing power', value: 'Moderate', drill: 'XDRV' },
    { id: '4', section: 'Regulatory pressure', value: 'Medium-high', drill: 'NREL' },
  ];
  return <DossierTable panelIdx={panelIdx} code="INDY" title="Industry Dossier" rows={rows} rowEntity={(r) => makeFunction(String(r.drill ?? 'RELATE'), 'Open industry drill')} />;
}

export function FnCTY({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', section: 'Sovereign market', value: 'Rates, FX, credit snapshot', drill: 'RGN.M' },
    { id: '2', section: 'Major corporates', value: 'Top listed issuers by cap', drill: 'RGN.C' },
    { id: '3', section: 'Risk register', value: '5 active flags', drill: 'RGN.R' },
    { id: '4', section: 'Macro calendar', value: '3 key releases today', drill: 'ECO' },
  ];
  return <DossierTable panelIdx={panelIdx} code="CTY" title="Country Dossier" rows={rows} rowEntity={(r) => makeFunction(String(r.drill ?? 'RELATE'), 'Open country drill')} />;
}

export function FnCITY({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', section: 'Listed HQ count', value: '148', drill: 'CMPY' },
    { id: '2', section: 'Today events', value: '6 local macro/corp items', drill: 'NMAP' },
    { id: '3', section: 'Risk signals', value: 'Transport + weather watch', drill: 'RGN.R' },
    { id: '4', section: 'Market links', value: 'Indices, rates, key sectors', drill: 'CTY' },
  ];
  return <DossierTable panelIdx={panelIdx} code="CITY" title="City / Hub Dossier" rows={rows} rowEntity={(r) => makeFunction(String(r.drill ?? 'RELATE'), 'Open city drill')} />;
}
