'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { getGeoState, listGeoHotspots, listRegionStories } from '../geoIntelStore';
import { makeCountry, makeFunction, makeNews, makeSecurity } from '../entities/types';
import { appendAuditEvent } from '../commandAuditStore';
import { useTerminalOS } from '../TerminalOSContext';
import { useTerminalStore } from '../../store/TerminalStore';
import { loadMnemonicUiState, saveMnemonicUiState } from '../mnemonicUiStateStore';

function ts(v: number) { return new Date(v).toISOString().slice(11, 19); }

export function FnRGN({ panelIdx = 0 }: { panelIdx?: number }) {
  const state = getGeoState();
  const [regionId, setRegionId] = useState(() => String(loadMnemonicUiState(panelIdx, 'RGN', { regionId: state.selectedRegionId }).regionId ?? state.selectedRegionId));
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'RGN', { regionId });
  }, [panelIdx, regionId]);
  const region = state.regions.find((r) => r.id === regionId) ?? state.regions[0];
  const rows = [
    { id: '1', block: 'Indices', value: `${region.id} IDX`, why: 'regional benchmark', drill: 'WEI' },
    { id: '2', block: 'Currency', value: `${region.currencyStrength}`, why: 'FX strength proxy', drill: 'RGN.M' },
    { id: '3', block: 'Rates', value: `${region.policyRate}%`, why: 'policy stance', drill: 'RGN.M' },
    { id: '4', block: 'Credit', value: `${(100 - region.riskScore).toFixed(0)}`, why: 'credit proxy', drill: 'RGN.R' },
    { id: '5', block: 'Drivers', value: region.topSectors.join(','), why: 'what matters today', drill: 'SECT' },
  ];
  const cols: DenseColumn[] = [{ key: 'block', header: 'Block', width: '110px' }, { key: 'value', header: 'Value', width: '1fr' }, { key: 'why', header: 'Why', width: '150px' }, { key: 'drill', header: 'Drill', width: '70px', entity: (r) => makeFunction(String(r.drill), 'Open block drill') }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="RGN • Region Dossier" right={<StatusBadge label={region.name} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <select value={regionId} onChange={(e) => setRegionId(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
          {state.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeCountry(region.id, region.name)} onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `RGN ${String(r.block)}`, mnemonic: 'RGN' })} />
    </div>
  );
}

export function FnRGNC({ panelIdx = 0 }: { panelIdx?: number }) {
  const regions = getGeoState().regions;
  const [regionId, setRegionId] = useState(() => String(loadMnemonicUiState(panelIdx, 'RGN.C', { regionId: regions[0]?.id ?? 'US' }).regionId ?? regions[0]?.id ?? 'US'));
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'RGN.C', { regionId });
  }, [panelIdx, regionId]);
  const region = regions.find((r) => r.id === regionId) ?? regions[0];
  const rows = region.topCompanies.map((c, i) => ({ id: c, company: c, mcapRank: i + 1, newsIntensity: 80 - i * 9, adrs: i % 2 ? 'YES' : 'NO', ownership: `${52 - i * 4}%` }));
  const cols: DenseColumn[] = [{ key: 'company', header: 'Company', width: '1fr' }, { key: 'mcapRank', header: 'Rank', width: '55px', align: 'right' }, { key: 'newsIntensity', header: 'News', width: '60px', align: 'right' }, { key: 'adrs', header: 'ADR', width: '55px' }, { key: 'ownership', header: 'OwnConc', width: '70px', align: 'right' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="RGN.C • Region Companies" right={<StatusBadge label={region.name} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <select value={regionId} onChange={(e) => setRegionId(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.company))} />
    </div>
  );
}

export function FnRGNN({ panelIdx = 0 }: { panelIdx?: number }) {
  const regions = getGeoState().regions;
  const rgnn = loadMnemonicUiState(panelIdx, 'RGN.N', { regionId: regions[0]?.id ?? 'US', tagFilter: 'ALL' });
  const [regionId, setRegionId] = useState(String(rgnn.regionId ?? regions[0]?.id ?? 'US'));
  const [tagFilter, setTagFilter] = useState(String(rgnn.tagFilter ?? 'ALL'));
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'RGN.N', { regionId, tagFilter });
  }, [panelIdx, regionId, tagFilter]);
  const stories = listRegionStories(regionId).filter((s) => tagFilter === 'ALL' || s.tag === tagFilter);
  const rows = stories.map((s) => ({ id: s.id, time: ts(s.ts), tag: s.tag, tone: s.tone, headline: s.headline, impacted: s.entities.slice(0, 3).join(', '), lead: s.entities[0] ?? '' }));
  const cols: DenseColumn[] = [{ key: 'time', header: 'Time', width: '70px' }, { key: 'tag', header: 'Tag', width: '90px' }, { key: 'tone', header: 'Tone', width: '60px' }, { key: 'headline', header: 'Headline', width: '1fr' }, { key: 'impacted', header: 'Impacted', width: '170px' }, { key: 'lead', header: 'Lead', width: '110px', entity: (r) => makeSecurity(String(r.lead)) }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="RGN.N • Region News Center" right={<StatusBadge label={regionId} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <select value={regionId} onChange={(e) => setRegionId(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
          <option>ALL</option><option>POLITICS</option><option>SUPPLY</option><option>EARNINGS</option><option>DISASTER</option><option>TRADE</option><option>ENERGY</option>
        </select>
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeNews(String(r.headline), String(r.tag), String(r.time))} /> : <EmptyFill hint="NO REGION STORIES" />}
    </div>
  );
}

export function FnRGNM({ panelIdx = 0 }: { panelIdx?: number }) {
  const [regionId, setRegionId] = useState(() => String(loadMnemonicUiState(panelIdx, 'RGN.M', { regionId: getGeoState().regions[0]?.id ?? 'US' }).regionId ?? getGeoState().regions[0]?.id ?? 'US'));
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'RGN.M', { regionId });
  }, [panelIdx, regionId]);
  const region = getGeoState().regions.find((r) => r.id === regionId) ?? getGeoState().regions[0];
  const rows = [
    { id: '1', release: 'CPI', expected: (region.inflation - 0.2).toFixed(1), actual: region.inflation.toFixed(1), surprise: '+0.2', sensitive: region.topCompanies[0] },
    { id: '2', release: 'PMI', expected: (region.pmi - 0.4).toFixed(1), actual: region.pmi.toFixed(1), surprise: '+0.4', sensitive: region.topCompanies[1] },
    { id: '3', release: 'Policy', expected: (region.policyRate).toFixed(2), actual: (region.policyRate).toFixed(2), surprise: '0.0', sensitive: region.topCompanies[2] },
  ];
  const cols: DenseColumn[] = [{ key: 'release', header: 'Release', width: '100px' }, { key: 'expected', header: 'Exp', width: '70px', align: 'right' }, { key: 'actual', header: 'Act', width: '70px', align: 'right' }, { key: 'surprise', header: 'Surp', width: '60px', align: 'right', tone: true }, { key: 'sensitive', header: 'Sensitive', width: '1fr' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="RGN.M • Region Macro Monitor" right={<StatusBadge label={region.name} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.sensitive))} /></div>;
}

export function FnRGNR({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = listGeoHotspots('1D').map((h) => ({ id: h.regionId, region: h.region, riskFlag: h.sentiment < -0.1 ? 'NEG-SPIKE' : 'WATCH', shifts: `${h.volume} stories`, linked: h.tags.join(', '), impacted: h.regionId === 'CN' ? 'AAPL,NVDA' : 'SPX,DXY' }));
  const cols: DenseColumn[] = [{ key: 'region', header: 'Region', width: '120px' }, { key: 'riskFlag', header: 'Flag', width: '90px' }, { key: 'shifts', header: 'Shift', width: '90px' }, { key: 'linked', header: 'Evidence', width: '1fr' }, { key: 'impacted', header: 'Impacted', width: '140px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="RGN.R • Region Risk Register" right={<StatusBadge label="ACTIVE FLAGS" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeCountry(String(r.id), String(r.region))} /></div>;
}

export function FnNMAP({ panelIdx = 0 }: { panelIdx?: number }) {
  const stories = getGeoState().stories.slice(0, 20);
  const rows = stories.map((s) => ({ id: s.id, time: ts(s.ts), region: s.regionId, headline: s.headline, entities: s.entities.join(', '), geo: s.regionId }));
  const cols: DenseColumn[] = [{ key: 'time', header: 'Time', width: '70px' }, { key: 'region', header: 'Region', width: '70px', entity: (r) => makeCountry(String(r.region), String(r.region)) }, { key: 'headline', header: 'Headline', width: '1fr' }, { key: 'entities', header: 'Entities', width: '190px' }, { key: 'geo', header: 'Map', width: '60px', entity: () => makeFunction('GEO.N', 'Open geo news heat') }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="NMAP • News Map Overlay" right={<StatusBadge label="STORY→GEO" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeNews(String(r.headline), 'NMAP', String(r.time))} /></div>;
}

export function FnNREL({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = [
    { id: '1', cluster: 'China policy-tech', timeline: '07:20-10:15', entities: 'AAPL,NVDA,BABA', impact: 'HIGH' },
    { id: '2', cluster: 'EU energy storage', timeline: '06:45-09:20', entities: 'TTF,SHEL,BAS', impact: 'MED' },
    { id: '3', cluster: 'US rates repricing', timeline: '08:00-11:10', entities: 'DXY,2Y,QQQ', impact: 'HIGH' },
  ];
  const cols: DenseColumn[] = [{ key: 'cluster', header: 'Cluster', width: '1fr' }, { key: 'timeline', header: 'Timeline', width: '110px' }, { key: 'entities', header: 'Entities', width: '160px' }, { key: 'impact', header: 'Impact', width: '70px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="NREL • News Relationship Builder" right={<StatusBadge label="SIM CLUSTERS" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={() => makeFunction('RELG', 'Open relationship graph')} /></div>;
}

export function FnNEX({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const sec = panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY';
  const rows = [
    { id: '1', exposure: 'CN policy headline cluster', path: 'Geo→Supply→Revenue', severity: 'HIGH', linked: sec },
    { id: '2', exposure: 'Freight lane pressure', path: 'Route→COGS', severity: 'MED', linked: sec },
    { id: '3', exposure: 'Energy narrative spike', path: 'Input→Margin', severity: 'LOW', linked: sec },
  ];
  const cols: DenseColumn[] = [{ key: 'exposure', header: 'Exposure', width: '1fr' }, { key: 'path', header: 'Path', width: '140px' }, { key: 'severity', header: 'Severity', width: '70px' }, { key: 'linked', header: 'Security', width: '140px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="NEX • News Exposures" right={<StatusBadge label={sec} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeSecurity(String(r.linked))} /></div>;
}

export function FnNTIM({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const sec = panels[panelIdx]?.activeSecurity ?? 'AAPL US EQUITY';
  const rows = getGeoState().stories.slice(0, 8).map((s, i) => ({ id: s.id, time: ts(s.ts), event: s.headline, move: `${(i % 2 === 0 ? 0.8 : -0.6).toFixed(2)}%`, vol: `${(1.2 + i * 0.1).toFixed(2)}x`, impact: i % 3 === 0 ? 'HIGH' : 'LOW' }));
  const cols: DenseColumn[] = [{ key: 'time', header: 'Time', width: '70px' }, { key: 'event', header: 'Event', width: '1fr' }, { key: 'move', header: 'Move', width: '70px', align: 'right', tone: true }, { key: 'vol', header: 'Vol', width: '60px', align: 'right' }, { key: 'impact', header: 'Impact', width: '70px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="NTIM • News Timeline & Reaction" right={<StatusBadge label={sec} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeNews(String(r.event), 'NTIM', String(r.time))} /></div>;
}

export function FnNQ({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [q, setQ] = useState(() => String(loadMnemonicUiState(panelIdx, 'NQ', { q: 'region:CN tag:SUPPLY entity:AAPL' }).q ?? 'region:CN tag:SUPPLY entity:AAPL'));
  React.useEffect(() => {
    saveMnemonicUiState(panelIdx, 'NQ', { q });
  }, [panelIdx, q]);
  const parsed = useMemo(() => {
    const parts = q.split(' ').map((x) => x.trim()).filter(Boolean);
    const kv = Object.fromEntries(parts.map((p) => {
      const [k, ...rest] = p.split(':');
      return [k.toLowerCase(), rest.join(':').toUpperCase()];
    }));
    return kv as Record<string, string>;
  }, [q]);
  const windowMs = parsed.window === '1H' ? 60 * 60 * 1000 : parsed.window === '1W' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const now = state.tickMs;
  const stories = getGeoState().stories.filter((s) => {
    const regionOk = !parsed.region || s.regionId === parsed.region;
    const tagOk = !parsed.tag || s.tag === parsed.tag;
    const entityOk = !parsed.entity || s.entities.some((e) => e.includes(parsed.entity));
    const toneOk = !parsed.tone || s.tone === parsed.tone;
    const timeOk = now - s.ts <= windowMs;
    return regionOk && tagOk && entityOk && toneOk && timeOk;
  });
  const impactCount = stories.reduce<Record<string, number>>((acc, s) => {
    s.entities.forEach((e) => {
      const key = e.split(' ')[0] ?? e;
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return acc;
  }, {});
  const impactTop = Object.entries(impactCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, c]) => `${k}:${c}`).join(' • ');
  const rows = stories.map((s) => ({ id: s.id, region: s.regionId, tag: s.tag, tone: s.tone, headline: s.headline, entities: s.entities.join(', ') }));
  const cols: DenseColumn[] = [{ key: 'region', header: 'Region', width: '70px' }, { key: 'tag', header: 'Tag', width: '90px' }, { key: 'tone', header: 'Tone', width: '60px' }, { key: 'headline', header: 'Headline', width: '1fr' }, { key: 'entities', header: 'Entities', width: '160px' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NQ • News Query Language" right={<StatusBadge label={`${rows.length} MATCHES`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input className="flex-1 bg-transparent outline-none" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" onClick={() => { appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `NQ ${q}`, mnemonic: 'NQ' }); }}>RUN</button>
      </div>
      <div className="px-1 py-1" style={{ borderBottom: '1px solid #111', color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
        IMPACT LIST: {impactTop || '—'}
      </div>
      {rows.length ? <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" rowEntity={(r) => makeNews(String(r.headline), String(r.tag), '')} /> : <EmptyFill hint="NO QUERY MATCHES" />}
    </div>
  );
}
