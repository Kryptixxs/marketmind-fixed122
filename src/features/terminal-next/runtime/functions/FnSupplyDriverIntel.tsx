'use client';

import React, { useEffect, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { makeFunction, makeSecurity } from '../entities/types';
import { appendAuditEvent } from '../commandAuditStore';
import { loadMnemonicUiState, saveMnemonicUiState } from '../mnemonicUiStateStore';

export function FnSCN({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const sec = panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY';
  const rows = [
    { id: '1', side: 'SUPPLIER', node: 'TSM US EQUITY', region: 'TW', dep: '28%', risk: 'HIGH' },
    { id: '2', side: 'SUPPLIER', node: 'ASML US EQUITY', region: 'EU', dep: '9%', risk: 'MED' },
    { id: '3', side: 'CUSTOMER', node: 'MSFT US EQUITY', region: 'US', dep: '14%', risk: 'LOW' },
  ];
  const cols: DenseColumn[] = [{ key: 'side', header: 'Side', width: '90px' }, { key: 'node', header: 'Node', width: '1fr' }, { key: 'region', header: 'Region', width: '70px' }, { key: 'dep', header: 'Dep', width: '70px', align: 'right' }, { key: 'risk', header: 'Risk', width: '70px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="SCN • Supply Chain Network" right={<StatusBadge label={sec} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.node))} /></div>;
}

export function FnSCNR({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', edge: 'TSM→AAPL', stress: 'News spike + route delay', score: '83', evidence: 'Port congestion', drill: 'EVID' },
    { id: '2', edge: 'ASML→AAPL', stress: 'Export policy noise', score: '67', evidence: 'Policy headlines', drill: 'EVID' },
    { id: '3', edge: 'MSFT↔AAPL', stress: 'Demand mix shift', score: '54', evidence: 'Earnings commentary', drill: 'EVID' },
  ];
  const cols: DenseColumn[] = [{ key: 'edge', header: 'Edge', width: '140px' }, { key: 'stress', header: 'Stress', width: '1fr' }, { key: 'score', header: 'Score', width: '70px', align: 'right', tone: true }, { key: 'evidence', header: 'Evidence', width: '160px' }, { key: 'drill', header: 'Drill', width: '70px', entity: () => makeFunction('EVID', 'Open edge evidence') }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="SCN.R • Supply Chain Risk Monitor" right={<StatusBadge label="ACTIVE" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('EVID', 'Open edge evidence')} onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `SCN.R ${String(r.edge)}`, mnemonic: 'SCN.R' })} invokeRowClickWithEntity /></div>;
}

export function FnFAC({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', site: 'Shenzhen Final Assembly', kind: 'FACTORY', region: 'CN', risk: 'HIGH', nearby: 'Port delay', map: 'GEO.S' },
    { id: '2', site: 'Austin HQ', kind: 'HQ', region: 'US', risk: 'LOW', nearby: 'None', map: 'GEO.C' },
    { id: '3', site: 'Amsterdam DC', kind: 'DATACENTER', region: 'EU', risk: 'MED', nearby: 'Power cost', map: 'GEO.S' },
  ];
  const cols: DenseColumn[] = [{ key: 'site', header: 'Site', width: '1fr' }, { key: 'kind', header: 'Kind', width: '90px' }, { key: 'region', header: 'Region', width: '70px', entity: (r) => makeFunction('RGN', `Open ${String(r.region)} dossier`) }, { key: 'risk', header: 'Risk', width: '70px' }, { key: 'nearby', header: 'NearbyDisruption', width: '140px' }, { key: 'map', header: 'Map', width: '70px', entity: (r) => makeFunction(String(r.map), 'Open geo map') }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="FAC • Facility List & Critical Sites" right={<StatusBadge label="SIM SITES" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('GEO.S', 'Open disruption map')} /></div>;
}

export function FnCUST({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', customer: 'MSFT US EQUITY', share: '14%', trend: '+1.2%', news: 'Cloud demand mixed' },
    { id: '2', customer: 'AMZN US EQUITY', share: '9%', trend: '+0.6%', news: 'Capex strong' },
    { id: '3', customer: 'GOOGL US EQUITY', share: '6%', trend: '-0.3%', news: 'Ad cycle noise' },
  ];
  const cols: DenseColumn[] = [{ key: 'customer', header: 'Customer', width: '1fr' }, { key: 'share', header: 'Share', width: '70px', align: 'right' }, { key: 'trend', header: 'Trend', width: '70px', align: 'right', tone: true }, { key: 'news', header: 'News', width: '180px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="CUST • Customer Concentration" right={<StatusBadge label="SIM" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.customer))} /></div>;
}

export function FnSUPPConcentration({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', supplier: 'TSM US EQUITY', share: '28%', singlePoint: 'YES', regionRisk: 'HIGH' },
    { id: '2', supplier: 'ASML US EQUITY', share: '9%', singlePoint: 'NO', regionRisk: 'MED' },
    { id: '3', supplier: 'QCOM US EQUITY', share: '7%', singlePoint: 'NO', regionRisk: 'LOW' },
  ];
  const cols: DenseColumn[] = [{ key: 'supplier', header: 'Supplier', width: '1fr' }, { key: 'share', header: 'Share', width: '70px', align: 'right' }, { key: 'singlePoint', header: 'SPOF', width: '70px' }, { key: 'regionRisk', header: 'RegionRisk', width: '90px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="SUPP • Supplier Concentration" right={<StatusBadge label="SPOF MAP" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.supplier))} /></div>;
}

export function FnXDRV({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', driver: 'Rates', sens: '0.63', contrib: '+0.21%', today: '10Y +6bp' },
    { id: '2', driver: 'Dollar', sens: '-0.41', contrib: '-0.08%', today: 'DXY +0.4%' },
    { id: '3', driver: 'Oil', sens: '-0.22', contrib: '-0.03%', today: 'Brent +1.1%' },
    { id: '4', driver: 'Credit', sens: '0.35', contrib: '+0.05%', today: 'HY tighter' },
    { id: '5', driver: 'Vol', sens: '-0.48', contrib: '-0.12%', today: 'VIX +1.8' },
  ];
  const cols: DenseColumn[] = [{ key: 'driver', header: 'Driver', width: '1fr' }, { key: 'sens', header: 'Sens', width: '70px', align: 'right' }, { key: 'contrib', header: 'TodayContrib', width: '90px', align: 'right', tone: true }, { key: 'today', header: 'Today', width: '160px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="XDRV • Cross-Driver Dashboard" right={<StatusBadge label="SIM DRIVERS" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('IMP', 'Open impact tree')} /></div>;
}

export function FnBETAX({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', ticker: 'AAPL', r1m: '0.41', r3m: '0.58', r1y: '0.63', dxy1y: '-0.39', oil1y: '-0.18' },
    { id: '2', ticker: 'MSFT', r1m: '0.35', r3m: '0.49', r1y: '0.57', dxy1y: '-0.22', oil1y: '-0.11' },
    { id: '3', ticker: 'XOM', r1m: '-0.12', r3m: '-0.04', r1y: '0.10', dxy1y: '-0.28', oil1y: '0.74' },
  ];
  const cols: DenseColumn[] = [{ key: 'ticker', header: 'Ticker', width: '80px' }, { key: 'r1m', header: 'Rates1M', width: '70px', align: 'right' }, { key: 'r3m', header: 'Rates3M', width: '70px', align: 'right' }, { key: 'r1y', header: 'Rates1Y', width: '70px', align: 'right' }, { key: 'dxy1y', header: 'DXY1Y', width: '70px', align: 'right' }, { key: 'oil1y', header: 'Oil1Y', width: '70px', align: 'right' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="BETA.X • Cross-Asset Beta Matrix" right={<StatusBadge label="REGRESSION SIM" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(`${String(r.ticker)} US EQUITY`)} /></div>;
}

export function FnREGI({ panelIdx = 0 }: { panelIdx?: number }) {
  const [regime, setRegime] = useState<'RISK_ON' | 'RISK_OFF'>(() => loadMnemonicUiState(panelIdx, 'REGI', { regime: 'RISK_OFF' }).regime as 'RISK_ON' | 'RISK_OFF');
  useEffect(() => {
    saveMnemonicUiState(panelIdx, 'REGI', { regime });
  }, [panelIdx, regime]);
  const rows = [
    { id: '1', edge: 'AAPL↔US2Y', riskOn: '0.42', riskOff: '0.71' },
    { id: '2', edge: 'AAPL↔DXY', riskOn: '-0.24', riskOff: '-0.53' },
    { id: '3', edge: 'AAPL↔QQQ', riskOn: '0.82', riskOff: '0.65' },
  ].map((r) => ({ ...r, active: regime === 'RISK_OFF' ? r.riskOff : r.riskOn }));
  const cols: DenseColumn[] = [{ key: 'edge', header: 'Relationship', width: '1fr' }, { key: 'riskOn', header: 'RiskOn', width: '70px', align: 'right' }, { key: 'riskOff', header: 'RiskOff', width: '70px', align: 'right' }, { key: 'active', header: 'Active', width: '70px', align: 'right', tone: true }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="REGI • Regime-conditioned Relationships" right={<StatusBadge label={regime} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => { setRegime('RISK_ON'); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'REGI set RISK_ON', mnemonic: 'REGI' }); }}>RISK_ON</button>
        <button type="button" onClick={() => { setRegime('RISK_OFF'); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'REGI set RISK_OFF', mnemonic: 'REGI' }); }}>RISK_OFF</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('RELG', 'Filter relationship graph')} />
    </div>
  );
}

export function FnHEDGE({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', instrument: 'XLK US EQUITY', class: 'ETF', score: '0.78', relevance: 'HIGH', evidence: 'sector-capture' },
    { id: '2', instrument: 'NQ1 INDEX', class: 'Future', score: '0.74', relevance: 'HIGH', evidence: 'beta-hedge' },
    { id: '3', instrument: 'US2Y', class: 'Rates', score: '0.55', relevance: 'MED', evidence: 'duration-link' },
  ];
  const cols: DenseColumn[] = [{ key: 'instrument', header: 'Candidate', width: '1fr' }, { key: 'class', header: 'Class', width: '70px' }, { key: 'score', header: 'Score', width: '70px', align: 'right' }, { key: 'relevance', header: 'Rel', width: '70px' }, { key: 'evidence', header: 'Evidence', width: '120px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="HEDGE • Hedge Candidate Explorer" right={<StatusBadge label="STRUCTURAL" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeFunction('BASK', `Add ${String(r.instrument)} to hedge basket`)} /></div>;
}

export function FnSHOCKG({ panelIdx = 0 }: { panelIdx?: number }) {
  const [shock, setShock] = useState(() => String(loadMnemonicUiState(panelIdx, 'SHOCK.G', { shock: 'CN policy shock' }).shock ?? 'CN policy shock'));
  useEffect(() => {
    saveMnemonicUiState(panelIdx, 'SHOCK.G', { shock });
  }, [panelIdx, shock]);
  const rows = [
    { id: '1', exposure: 'AAPL US EQUITY', channel: 'Supply chain', score: '0.84', action: 'PATH' },
    { id: '2', exposure: 'NVDA US EQUITY', channel: 'Semis demand', score: '0.76', action: 'IMP' },
    { id: '3', exposure: 'COPPER COMDTY', channel: 'Industrial demand', score: '0.69', action: 'XAS' },
    { id: '4', exposure: 'USDCNH CURNCY', channel: 'FX repricing', score: '0.62', action: 'RGN.M' },
  ];
  const cols: DenseColumn[] = [{ key: 'exposure', header: 'Exposure', width: '1fr' }, { key: 'channel', header: 'Channel', width: '140px' }, { key: 'score', header: 'Score', width: '70px', align: 'right', tone: true }, { key: 'action', header: 'Next', width: '70px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="SHOCK.G • Geo Shock Simulator" right={<StatusBadge label="SCENARIO" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input className="flex-1 bg-transparent outline-none" value={shock} onChange={(e) => setShock(e.target.value)} />
        <button type="button" onClick={() => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `SHOCK.G ${shock}`, mnemonic: 'SHOCK.G' })}>APPLY</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeFunction(String(r.action), 'Open impact detail')} /> : <EmptyFill hint="NO SHOCK OUTPUT" />}
    </div>
  );
}
