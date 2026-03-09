'use client';

import React, { useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalStore } from '../../store/TerminalStore';
import { makeFunction, makeSecurity } from '../entities/types';
import { appendAuditEvent } from '../commandAuditStore';
import { appendWave4Item, listWave4Store } from '../wave4Store';

function seeded(v: number, min: number, span: number) { return min + ((v * 17) % 1000) / 1000 * span; }

export function FnREG({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [active, setActive] = useState<'RISK_ON' | 'TRANSITION' | 'RISK_OFF'>('TRANSITION');
  const rows = [
    { id: 'r1', regime: 'RISK_ON', threshold: 'breadth > 62%', active: active === 'RISK_ON' ? 'YES' : 'NO', driver: 'ADV/DEC + credit tighten' },
    { id: 'r2', regime: 'TRANSITION', threshold: 'breadth 45-62%', active: active === 'TRANSITION' ? 'YES' : 'NO', driver: 'mixed internals' },
    { id: 'r3', regime: 'RISK_OFF', threshold: 'breadth < 45%', active: active === 'RISK_OFF' ? 'YES' : 'NO', driver: 'vol up + spreads wider' },
  ];
  const cols: DenseColumn[] = [{ key: 'regime', header: 'Regime', width: '100px' }, { key: 'threshold', header: 'Definition', width: '180px' }, { key: 'active', header: 'Active', width: '70px' }, { key: 'driver', header: 'Drivers', width: '1fr' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="REG • Regime Library" right={<StatusBadge label={active} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setActive('RISK_ON')}>RISK_ON</button>
        <button type="button" onClick={() => setActive('TRANSITION')}>TRANSITION</button>
        <button type="button" onClick={() => setActive('RISK_OFF')}>RISK_OFF</button>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>quoteTick {state.streamClock.quotes}</span>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `REG select ${String(r.regime)}`, mnemonic: 'REG' })} rowEntity={() => makeFunction('XAS', 'Cross-asset board')} />
    </div>
  );
}

export function FnSHCK({ panelIdx = 0 }: { panelIdx?: number }) {
  const [rates, setRates] = useState(50);
  const [vol, setVol] = useState(20);
  const [fx, setFx] = useState(3);
  const [, setRefresh] = useState(0);
  const impact = rates * 0.06 + vol * 0.09 + fx * 0.3;
  const rows = [
    { id: '1', shock: 'Rates shock', value: `${rates}bp`, impact: `${(rates * 0.06).toFixed(2)}% EQ hit` },
    { id: '2', shock: 'Vol shock', value: `+${vol}%`, impact: `${(vol * 0.09).toFixed(2)}% VAR up` },
    { id: '3', shock: 'FX shock', value: `${fx}%`, impact: `${(fx * 0.3).toFixed(2)}% USD beta` },
  ];
  const library = listWave4Store('scenarios').map((s) => ({ id: s.id, shock: s.name, value: `${s.ratesBp}/${s.volPct}/${s.fxPct}`, impact: s.result, ratesBp: s.ratesBp, volPct: s.volPct, fxPct: s.fxPct }));
  const cols: DenseColumn[] = [{ key: 'shock', header: 'Shock', width: '140px' }, { key: 'value', header: 'Value', width: '90px' }, { key: 'impact', header: 'Impact', width: '1fr' }];
  const saveScenario = () => {
    appendWave4Item('scenarios', { name: `SHOCK_${Date.now().toString(36).slice(-4)}`, ratesBp: rates, volPct: vol, fxPct: fx, result: `${impact.toFixed(2)}% composite impact`, ts: Date.now() });
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `SHCK save scenario rates=${rates} vol=${vol} fx=${fx}`, mnemonic: 'SHCK' });
    setRefresh((v) => v + 1);
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="SHCK • Shock Library" right={<StatusBadge label="SCENARIO" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span>Rates</span><input type="number" value={rates} onChange={(e) => setRates(Number(e.target.value) || 0)} className="w-20 bg-transparent outline-none" />
        <span>Vol</span><input type="number" value={vol} onChange={(e) => setVol(Number(e.target.value) || 0)} className="w-20 bg-transparent outline-none" />
        <span>FX</span><input type="number" value={fx} onChange={(e) => setFx(Number(e.target.value) || 0)} className="w-20 bg-transparent outline-none" />
        <button type="button" onClick={saveScenario}>SAVE</button>
      </div>
      <DenseTable
        columns={cols}
        rows={[...rows, ...library]}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        rowEntity={() => makeFunction('SCEN', 'Scenario drill')}
        onRowClick={(r) => {
          if (String(r.id).startsWith('scenarios-')) {
            const item = library.find((x) => x.id === String(r.id));
            if (!item) return;
            setRates(item.ratesBp);
            setVol(item.volPct);
            setFx(item.fxPct);
            appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `SHCK load scenario ${item.shock}`, mnemonic: 'SHCK' });
          }
        }}
      />
    </div>
  );
}

export function FnXAS({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const q = state.quotes.slice(0, 8);
  const rows = q.map((s, i) => ({ id: s.symbol, spread: `${s.symbol}-UST2Y`, level: (s.last - seeded(i + state.tick, 95, 12)).toFixed(2), change: ((s.pct * 0.6) - 0.2).toFixed(2), driver: i % 2 === 0 ? 'Rates' : 'USD' }));
  const cols: DenseColumn[] = [{ key: 'spread', header: 'Spread', width: '1fr' }, { key: 'level', header: 'Level', width: '90px', align: 'right' }, { key: 'change', header: 'Chg%', width: '80px', align: 'right', tone: true }, { key: 'driver', header: 'Driver', width: '80px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="XAS • Cross-Asset Spread Board" right={<StatusBadge label="ONE-GLANCE" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.id))} /></div>;
}

export function FnCORRPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [anchor, setAnchor] = useState(state.quotes[0]?.symbol ?? 'AAPL US');
  const rows = state.quotes
    .slice(0, 20)
    .map((q, i) => ({ id: q.symbol, symbol: q.symbol, corr1M: (0.2 + (i * 0.05)).toFixed(2), corr3M: (0.1 + (i * 0.06)).toFixed(2), corr1Y: ((q.corrToSPX + q.corrToNDX) / 2).toFixed(2), regime: i % 3 === 0 ? 'RISK_OFF' : i % 3 === 1 ? 'TRANSITION' : 'RISK_ON' }))
    .filter((r) => r.symbol !== anchor)
    .sort((a, b) => Math.abs(Number(b.corr1Y)) - Math.abs(Number(a.corr1Y)))
    .slice(0, 12);
  const cols: DenseColumn[] = [{ key: 'symbol', header: 'Symbol', width: '1fr' }, { key: 'corr1M', header: '1M', width: '70px', align: 'right' }, { key: 'corr3M', header: '3M', width: '70px', align: 'right' }, { key: 'corr1Y', header: '1Y', width: '70px', align: 'right' }, { key: 'regime', header: 'Regime', width: '100px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="CORR+ • Correlation Explorer" right={<StatusBadge label={anchor} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={anchor} onChange={(e) => setAnchor(e.target.value.toUpperCase())} className="flex-1 bg-transparent outline-none" />
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.symbol))} />
    </div>
  );
}

export function FnSENT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [toneFilter, setToneFilter] = useState<'ALL' | 'POS' | 'NEG' | 'NEU'>('ALL');
  const rows = state.headlines
    .slice(0, 30)
    .map((h, i) => ({ id: `${i}`, ts: new Date(state.tickMs - i * 80000).toISOString().slice(11, 19), tone: i % 3 === 0 ? 'POS' : i % 3 === 1 ? 'NEG' : 'NEU', weight: ((i % 7) + 1) / 10, source: i % 2 === 0 ? 'NEWS' : 'ANALYST', text: h }))
    .filter((r) => toneFilter === 'ALL' || r.tone === toneFilter);
  const cols: DenseColumn[] = [{ key: 'ts', header: 'Time', width: '80px' }, { key: 'tone', header: 'Tone', width: '60px' }, { key: 'source', header: 'Src', width: '70px' }, { key: 'weight', header: 'W', width: '50px', align: 'right' }, { key: 'text', header: 'Signal', width: '1fr' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="SENT • Sentiment Tape (Sim)" right={<StatusBadge label="SIM ONLY" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setToneFilter('ALL')}>ALL</button>
        <button type="button" onClick={() => setToneFilter('POS')}>POS</button>
        <button type="button" onClick={() => setToneFilter('NEG')}>NEG</button>
        <button type="button" onClick={() => setToneFilter('NEU')}>NEU</button>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('TOP', 'Source headlines')} /> : <EmptyFill hint="NO SENTIMENT EVENTS" />}
    </div>
  );
}

export function FnWEB({ panelIdx = 0 }: { panelIdx?: number }) {
  const topics = ['AI', 'RATES', 'INFLATION', 'GPU', 'CLOUD', 'CHINA', 'OIL', 'USD'];
  const rows = topics.map((t, i) => ({ id: t, topic: t, count: Math.round(seeded(i + 1, 120, 800)), trend: `${(seeded(i + 2, -5, 12)).toFixed(1)}%`, region: ['US', 'EU', 'APAC'][i % 3] }));
  const cols: DenseColumn[] = [{ key: 'topic', header: 'Topic', width: '1fr' }, { key: 'count', header: 'Count', width: '90px', align: 'right' }, { key: 'trend', header: 'Trend', width: '90px', align: 'right', tone: true }, { key: 'region', header: 'Region', width: '80px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="WEB • Web Signals (Sim)" right={<StatusBadge label="SIMULATED" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('SENT', 'Related sentiment')} /></div>;
}

export function FnSUPP({ panelIdx = 0 }: { panelIdx?: number }) {
  const [base, setBase] = useState('AAPL US EQUITY');
  const rows = [
    { id: 's1', company: base, link: 'SUPPLIER', node: 'TSMC', risk: 'MED', exposure: '28%' },
    { id: 's2', company: base, link: 'SUPPLIER', node: 'ASML', risk: 'LOW', exposure: '9%' },
    { id: 's3', company: base, link: 'CUSTOMER', node: 'MSFT', risk: 'LOW', exposure: '14%' },
    { id: 's4', company: base, link: 'SUPPLIER', node: 'SK HYNIX', risk: 'HIGH', exposure: '7%' },
  ];
  const cols: DenseColumn[] = [{ key: 'company', header: 'Company', width: '170px' }, { key: 'link', header: 'Link', width: '90px' }, { key: 'node', header: 'Node', width: '1fr' }, { key: 'risk', header: 'Risk', width: '80px' }, { key: 'exposure', header: 'Exposure', width: '90px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="SUPP • Supply Chain Signals (Sim)" right={<StatusBadge label="NETWORK" variant="sim" />} />
      <div className="flex items-center px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={base} onChange={(e) => setBase(e.target.value.toUpperCase())} className="flex-1 bg-transparent outline-none" />
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(`${String(r.node)} US EQUITY`)} />
    </div>
  );
}

export function FnESG({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: 'e', metric: 'Env Score', value: '72', trend: '+2' },
    { id: 's', metric: 'Social Score', value: '65', trend: '-1' },
    { id: 'g', metric: 'Governance Score', value: '81', trend: '+1' },
    { id: 'c', metric: 'Controversies', value: '2', trend: 'NEW' },
  ];
  const cols: DenseColumn[] = [{ key: 'metric', header: 'Metric', width: '1fr' }, { key: 'value', header: 'Value', width: '90px', align: 'right' }, { key: 'trend', header: 'Trend', width: '90px', align: 'right' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="ESG • ESG Snapshot (Sim)" right={<StatusBadge label="SIM ESG" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('DOC', 'Controversy timeline')} /></div>;
}

