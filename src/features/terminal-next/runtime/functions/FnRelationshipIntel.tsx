'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { appendAuditEvent } from '../commandAuditStore';
import { appendWave4Item } from '../wave4Store';
import { listEdgeEvidence, listEdgesForCenter, listRelEdges, listRelNodes, pathBetween, type RelEdgeType } from '../relationshipIntelStore';
import { makeField, makeFunction, makeSecurity } from '../entities/types';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { isAllowedByRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';
import { loadMnemonicUiState, saveMnemonicUiState } from '../mnemonicUiStateStore';
import { guardRuntimeAction } from '../actionGuard';

function GraphStub({
  panelIdx,
  center,
  typeFilter,
  onCenter,
}: {
  panelIdx: number;
  center: string;
  typeFilter: 'ALL' | RelEdgeType;
  onCenter: (id: string) => void;
}) {
  const edges = listEdgesForCenter(center, typeFilter);
  const nodeMap = new Map(listRelNodes().map((n) => [n.id, n]));
  const rows = edges.map((e) => {
    const counterparty = e.fromId === center ? e.toId : e.fromId;
    return {
      id: e.id,
      node: counterparty,
      type: e.type,
      weight: e.weight.toFixed(2),
      direction: e.direction,
      evidence: e.evidence.join(', '),
      label: nodeMap.get(counterparty)?.label ?? counterparty,
    };
  });
  const cols: DenseColumn[] = [
    { key: 'label', header: 'Node', width: '1fr', entity: (r) => makeSecurity(String(r.node)) },
    { key: 'type', header: 'EdgeType', width: '110px' },
    { key: 'weight', header: 'W', width: '55px', align: 'right' },
    { key: 'direction', header: 'Dir', width: '70px' },
    { key: 'evidence', header: 'Evidence', width: '180px' },
  ];
  return (
    <DenseTable
      columns={cols}
      rows={rows}
      rowKey="id"
      panelIdx={panelIdx}
      className="flex-1 min-h-0"
      rowEntity={(r) => makeFunction('RELG', `Recenter ${String(r.node)}`)}
      onRowClick={(r) => onCenter(String(r.node))}
      onRowDoubleClick={(r) => onCenter(String(r.node))}
      invokeRowClickWithEntity
    />
  );
}

export function FnRELG({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const relgState = loadMnemonicUiState(panelIdx, 'RELG', { center: panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY', typeFilter: 'ALL' as 'ALL' | RelEdgeType });
  const [center, setCenter] = useState(String(relgState.center));
  const [typeFilter, setTypeFilter] = useState<'ALL' | RelEdgeType>(relgState.typeFilter as 'ALL' | RelEdgeType);
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'RELG', { center, typeFilter });
  }, [panelIdx, center, typeFilter]);
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="RELG • Relationship Graph" right={<StatusBadge label="SIM GRAPH" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input className="flex-1 bg-transparent outline-none" value={center} onChange={(e) => setCenter(e.target.value.toUpperCase())} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'ALL' | RelEdgeType)} style={{ background: '#000', border: '1px solid #222' }}>
          <option value="ALL">ALL</option>
          <option value="supplier-of">supplier-of</option>
          <option value="customer-of">customer-of</option>
          <option value="competes-with">competes-with</option>
          <option value="rate-sensitive">rate-sensitive</option>
          <option value="oil-linked">oil-linked</option>
          <option value="news-linked">news-linked</option>
          <option value="factor-linked">factor-linked</option>
        </select>
      </div>
      <GraphStub panelIdx={panelIdx} center={center} typeFilter={typeFilter} onCenter={(id) => { setCenter(id); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `RELG recenter ${id}`, mnemonic: 'RELG', security: id }); }} />
    </div>
  );
}

export function FnRELT({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = listRelEdges().map((e) => ({ id: e.id, from: e.fromId, to: e.toId, type: e.type, strength: e.weight.toFixed(2), dir: e.direction, evidence: e.evidence.join(', '), jump: 'EVID' }));
  const cols: DenseColumn[] = [
    { key: 'from', header: 'From', width: '150px', entity: (r) => makeSecurity(String(r.from)) },
    { key: 'to', header: 'To', width: '150px', entity: (r) => makeSecurity(String(r.to)) },
    { key: 'type', header: 'Type', width: '120px' },
    { key: 'strength', header: 'Score', width: '70px', align: 'right' },
    { key: 'dir', header: 'Dir', width: '70px' },
    { key: 'evidence', header: 'Evidence', width: '1fr' },
    { key: 'jump', header: 'Drill', width: '70px', entity: () => makeFunction('EVID', 'Open edge evidence') },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="RELT • Relationship Table" right={<StatusBadge label={`${rows.length} EDGES`} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('EVID', 'Open edge evidence')} onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `RELT edge ${String(r.id)}`, mnemonic: 'RELT' })} invokeRowClickWithEntity /></div>;
}

export function FnIMP({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const sec = panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY';
  const rows = [
    { id: '1', layer: 'Macro', driver: 'US2Y', contribution: '34%', recent: '+6%', evidence: 'valuation-duration' },
    { id: '2', layer: 'Sector', driver: 'QQQ beta', contribution: '27%', recent: '+2%', evidence: 'index-factors' },
    { id: '3', layer: 'Company', driver: 'CN supply risk', contribution: '21%', recent: '-3%', evidence: 'facility-footprint' },
    { id: '4', layer: 'Microstructure', driver: 'spread/flow', contribution: '18%', recent: '+1%', evidence: 'order-book-sim' },
  ];
  const cols: DenseColumn[] = [{ key: 'layer', header: 'Layer', width: '100px' }, { key: 'driver', header: 'Driver', width: '1fr' }, { key: 'contribution', header: 'Contrib', width: '70px', align: 'right' }, { key: 'recent', header: 'Recent', width: '70px', align: 'right', tone: true }, { key: 'evidence', header: 'Evidence', width: '160px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="IMP • Impact Tree" right={<StatusBadge label={sec} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeField(String(r.driver), r.contribution, String(r.evidence))} /></div>;
}

export function FnOUT({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', target: 'QQQ US EQUITY', sensitivity: '0.62', regime: 'RISK_ON', relevance: 'HIGH' },
    { id: '2', target: 'MSFT US EQUITY', sensitivity: '0.54', regime: 'ALL', relevance: 'MED' },
    { id: '3', target: 'NVDA US EQUITY', sensitivity: '0.49', regime: 'AI_THEME', relevance: 'HIGH' },
  ];
  const cols: DenseColumn[] = [{ key: 'target', header: 'Impacted', width: '1fr' }, { key: 'sensitivity', header: 'Sens', width: '70px', align: 'right' }, { key: 'regime', header: 'Regime', width: '100px' }, { key: 'relevance', header: 'Rel', width: '70px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="OUT • Outbound Impact" right={<StatusBadge label="SIM" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.target))} /></div>;
}

export function FnNET({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', cluster: 'MegaCap Tech', fragility: '82', bottleneck: 'Semis/TW', hedge: 'SOXX puts' },
    { id: '2', cluster: 'Energy importers', fragility: '71', bottleneck: 'Freight lanes', hedge: 'Brent spread' },
    { id: '3', cluster: 'USD debt EM', fragility: '64', bottleneck: 'USD strength', hedge: 'DXY overlay' },
  ];
  const cols: DenseColumn[] = [{ key: 'cluster', header: 'Cluster', width: '1fr' }, { key: 'fragility', header: 'Frag', width: '60px', align: 'right', tone: true }, { key: 'bottleneck', header: 'Bottleneck', width: '140px' }, { key: 'hedge', header: 'Diversifier', width: '120px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="NET • Network Stress View" right={<StatusBadge label="SIM RISK" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('HEDGE', 'Open hedge candidates')} /></div>;
}

export function FnEVID({ panelIdx = 0 }: { panelIdx?: number }) {
  const [edgeId, setEdgeId] = useState(listRelEdges()[0]?.id ?? 'e1');
  const [decisions, setDecisions] = useState<Record<string, 'PENDING' | 'ACCEPT' | 'REJECT'>>({});
  const ev = useMemo(() => listEdgeEvidence(edgeId).map((x, i) => {
    const id = `${edgeId}-${i}`;
    return { id, item: x, decision: decisions[id] ?? 'PENDING' };
  }), [edgeId, decisions]);
  const cols: DenseColumn[] = [{ key: 'item', header: 'Evidence', width: '1fr' }, { key: 'decision', header: 'Decision', width: '90px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="EVID • Evidence Panel" right={<StatusBadge label={edgeId} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <select value={edgeId} onChange={(e) => setEdgeId(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
          {listRelEdges().map((e) => <option key={e.id} value={e.id}>{e.id} {e.type}</option>)}
        </select>
      </div>
      {ev.length ? <DenseTable columns={cols} rows={ev} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => {
        const policy = loadPolicyState();
        if (!guardRuntimeAction({
          panelIdx,
          permission: 'SEND_TO_PANEL',
          detail: `Blocked EVID curation ${String(r.id)}`,
          mnemonic: 'EVID',
          deniedMessage: 'Evidence curation blocked by policy.',
          deniedRecovery: 'Review ENT/COMP/POL permissions and retry.',
          actorOverride: policy.activeRole,
        })) return;
        const id = String(r.id);
        const curr = decisions[id] ?? 'PENDING';
        const next = curr === 'PENDING' ? 'ACCEPT' : curr === 'ACCEPT' ? 'REJECT' : 'PENDING';
        setDecisions((prev) => ({ ...prev, [id]: next }));
        appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `EVID curate ${id} ${next}`, mnemonic: 'EVID' });
      }} rowEntity={() => makeFunction('RELG', 'Return to graph')} invokeRowClickWithEntity /> : <EmptyFill hint="NO EVIDENCE FOR EDGE" />}
    </div>
  );
}

export function FnPATH({ panelIdx = 0 }: { panelIdx?: number }) {
  const pathState = loadMnemonicUiState(panelIdx, 'PATH', { from: 'US2Y', to: 'AAPL US EQUITY' });
  const [from, setFrom] = useState(String(pathState.from));
  const [to, setTo] = useState(String(pathState.to));
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'PATH', { from, to });
  }, [panelIdx, from, to]);
  const rows = pathBetween(from, to).map((x) => ({ id: `${x.step}-${x.node}`, step: x.step, node: x.node, edgeType: x.edgeType, evidence: x.evidence }));
  const cols: DenseColumn[] = [{ key: 'step', header: '#', width: '40px', align: 'right' }, { key: 'node', header: 'Node', width: '1fr' }, { key: 'edgeType', header: 'Link', width: '120px' }, { key: 'evidence', header: 'Evidence', width: '140px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="PATH • Causal Path Explorer" right={<StatusBadge label="SIM PATH" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input className="flex-1 bg-transparent outline-none" value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} />
        <span style={{ color: DENSITY.textMuted }}>→</span>
        <input className="flex-1 bg-transparent outline-none" value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} />
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeField(String(r.node), r.step, String(r.evidence))} />
    </div>
  );
}

export function FnBASK({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const baskState = loadMnemonicUiState(panelIdx, 'BASK', { mode: 'SUPPLIERS' as 'SUPPLIERS' | 'PEERS' | 'OIL' });
  const [mode, setMode] = useState<'SUPPLIERS' | 'PEERS' | 'OIL'>(baskState.mode as 'SUPPLIERS' | 'PEERS' | 'OIL');
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'BASK', { mode });
  }, [panelIdx, mode]);
  const members = mode === 'SUPPLIERS' ? ['TSM US EQUITY', 'ASML US EQUITY', 'QCOM US EQUITY'] : mode === 'PEERS' ? ['MSFT US EQUITY', 'GOOGL US EQUITY', 'AMZN US EQUITY'] : ['XOM US EQUITY', 'CVX US EQUITY', 'SHEL US EQUITY'];
  const rows = members.map((m) => ({ id: m, member: m, weight: (100 / members.length).toFixed(1), beta: (0.8 + (m.length % 4) * 0.1).toFixed(2) }));
  const cols: DenseColumn[] = [{ key: 'member', header: 'Member', width: '1fr' }, { key: 'weight', header: 'W%', width: '60px', align: 'right' }, { key: 'beta', header: 'Beta', width: '60px', align: 'right' }];
  const save = () => {
    const policy = loadPolicyState();
    const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
    if (!isAllowedByRole(policy.activeRole, 'SEND_TO_PANEL') || !gate.allowed) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: `BASK blocked ${mode}`, mnemonic: 'BASK', security: panels[panelIdx]?.activeSecurity, policyReason: gate.reason ?? 'SEND_TO_PANEL denied' });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Basket build blocked by policy.', recovery: 'Review ENT/COMP/POL for SEND_TO_PANEL permissions.', entity: 'BASK' });
      return;
    }
    appendWave4Item('shares', { kind: 'PANEL', token: `mm://basket/${Date.now().toString(36)}`, security: panels[panelIdx]?.activeSecurity, mnemonic: 'MON', workspace: `${mode}-BASKET`, ts: Date.now() });
    appendAuditEvent({ panelIdx, type: 'GO', actor: policy.activeRole, detail: `BASK build ${mode}`, mnemonic: 'BASK' });
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="BASK • Basket Builder" right={<StatusBadge label={mode} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => setMode('SUPPLIERS')}>SUPPLIERS</button>
        <button type="button" onClick={() => setMode('PEERS')}>PEERS</button>
        <button type="button" onClick={() => setMode('OIL')}>OIL-SENSITIVE</button>
        <button type="button" onClick={save}>BUILD → MON</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.member))} />
    </div>
  );
}

export function FnTHEMEGraph({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', theme: 'AI Datacenter', members: 'NVDA,SMCI,MSFT', exposure: 'Compute+Power', changed: '+12 headlines' },
    { id: '2', theme: 'EV Supply Chain', members: 'TSLA,ALB,LTHM', exposure: 'Lithium+China', changed: '+4 policy items' },
    { id: '3', theme: 'Energy Security', members: 'XOM,CVX,SHEL', exposure: 'Freight+LNG', changed: '+7 route stress' },
  ];
  const cols: DenseColumn[] = [{ key: 'theme', header: 'Theme', width: '140px' }, { key: 'members', header: 'Constituents', width: '1fr' }, { key: 'exposure', header: 'Exposure', width: '130px' }, { key: 'changed', header: 'ChangedToday', width: '130px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="THEME • Theme Graph" right={<StatusBadge label="SIM THEMES" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('BASK', 'Build theme basket')} /></div>;
}

export function FnSENTR({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', narrative: 'Antitrust pressure', intensity: '0.76', entities: 'AAPL,GOOGL,AMZN', trend: 'RISING' },
    { id: '2', narrative: 'AI capex cycle', intensity: '0.88', entities: 'NVDA,MSFT,AMZN', trend: 'RISING' },
    { id: '3', narrative: 'Energy transition bottlenecks', intensity: '0.64', entities: 'XOM,TSLA,ALB', trend: 'STABLE' },
  ];
  const cols: DenseColumn[] = [{ key: 'narrative', header: 'Narrative', width: '1fr' }, { key: 'intensity', header: 'Int', width: '70px', align: 'right', tone: true }, { key: 'entities', header: 'Entities', width: '180px' }, { key: 'trend', header: 'Trend', width: '80px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="SENTR • Sentiment & Narrative Graph" right={<StatusBadge label="NARRATIVES" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('NREL', 'Open narrative timeline')} /></div>;
}
