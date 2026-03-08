'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import type * as GeoJSON from 'geojson';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { appendAuditEvent } from '../commandAuditStore';
import { makeCountry, makeFunction, makeNews, makeSecurity } from '../entities/types';
import type { DrillIntent } from '../entities/linkResolver';
import { useDrill } from '../entities/DrillContext';
import { intentFromMouseEvent, INTERACTION_HINT } from '../interaction';
import { openContextMenuAt } from '../ui/ContextMenu';
import { loadMnemonicUiState, saveMnemonicUiState } from '../mnemonicUiStateStore';
import {
  getGeoState,
  listCompanyFootprint,
  listDisruptions,
  listGeoHotspots,
  listMostExposedCompanies,
  listRegionStories,
  listRouteExposureLedger,
  listRoutes,
  setGeoLayer,
  setGeoRegion,
  type GeoLayer,
} from '../geoIntelStore';

function ts(v: number) {
  return new Date(v).toISOString().slice(11, 19);
}

function toneColor(v: number) {
  if (v > 0.12) return '#00d26a';
  if (v < -0.12) return '#ff5757';
  return '#ffbf3f';
}

function GeoMapCanvas({
  layer,
  onRegionAction,
  onRouteAction,
  onRegionContext,
  onRouteContext,
}: {
  layer: GeoLayer;
  onRegionAction: (regionId: string, intent: DrillIntent) => void;
  onRouteAction?: (routeId: string, intent: DrillIntent) => void;
  onRegionContext?: (regionId: string, x: number, y: number) => void;
  onRouteContext?: (routeId: string, x: number, y: number) => void;
}) {
  const state = getGeoState();
  const points = state.regions;
  const lanes = listRoutes().map((r) => {
    const from = state.regions.find((x) => x.id === r.fromRegionId);
    const to = state.regions.find((x) => x.id === r.toRegionId);
    return {
      id: r.id,
      from,
      to,
      flow: r.flow,
      pressure: r.pressure,
      commodity: r.commodity,
    };
  }).filter((x) => x.from && x.to);
  const laneGeo = {
    type: 'FeatureCollection',
    features: lanes.map((l) => ({
      type: 'Feature' as const,
      properties: { id: l.id, pressure: l.pressure },
      geometry: {
        type: 'LineString' as const,
        coordinates: [[l.from!.lon, l.from!.lat], [l.to!.lon, l.to!.lat]],
      },
    })),
  };
  return (
    <div className="h-full min-h-0 w-full">
      <Map
        initialViewState={{ longitude: 10, latitude: 22, zoom: 1.2 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://demotiles.maplibre.org/style.json"
        mapLib={maplibregl}
        interactiveLayerIds={['lane-lines']}
        onClick={(evt) => {
          const f = evt.features?.[0];
          const routeId = f?.properties?.id as string | undefined;
          if (!routeId || !onRouteAction) return;
          const native = evt.originalEvent;
          onRouteAction(routeId, intentFromMouseEvent(native));
        }}
        onContextMenu={(evt) => {
          const f = evt.features?.[0];
          const routeId = f?.properties?.id as string | undefined;
          if (!routeId || !onRouteContext) return;
          evt.originalEvent.preventDefault();
          onRouteContext(routeId, evt.originalEvent.clientX, evt.originalEvent.clientY);
        }}
      >
        <NavigationControl position="top-right" />
        <Source id="lanes" type="geojson" data={laneGeo as unknown as GeoJSON.FeatureCollection<GeoJSON.LineString>}>
          <Layer
            id="lane-lines"
            type="line"
            paint={{
              'line-color': '#3ea2ff',
              'line-width': ['interpolate', ['linear'], ['get', 'pressure'], 20, 1, 90, 4],
              'line-opacity': layer === 'SHIPPING' ? 0.9 : 0.35,
            }}
          />
        </Source>
        {points.map((r) => {
          const metric = layer === 'RISK_FLAGS' ? r.riskScore / 100 : layer === 'NEWS_INTENSITY' ? r.newsIntensity / 100 : layer === 'MACRO' ? r.inflation / 10 : layer === 'COMPANY_DENSITY' ? r.topCompanies.length / 5 : layer === 'ALERTS' ? Math.max(0.1, r.riskScore / 120) : 0.45;
          const size = 10 + Math.round(metric * 16);
          return (
            <Marker key={r.id} longitude={r.lon} latitude={r.lat} anchor="center">
              <button
                type="button"
                onClick={(e) => onRegionAction(r.id, intentFromMouseEvent(e))}
                onAuxClick={(e) => {
                  if (e.button === 1) onRegionAction(r.id, 'INSPECT_OVERLAY');
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRegionContext?.(r.id, e.clientX, e.clientY);
                }}
                title={`${r.name} • ${layer} • ${INTERACTION_HINT}`}
                style={{
                  width: size,
                  height: size,
                  borderRadius: 99,
                  border: '1px solid #0d0d0d',
                  background: layer === 'NEWS_INTENSITY' ? toneColor(r.sentiment) : '#ffbf3f',
                  cursor: 'pointer',
                }}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}

function RegionSheet({ panelIdx, regionId }: { panelIdx: number; regionId: string }) {
  const state = getGeoState();
  const region = state.regions.find((r) => r.id === regionId);
  const stories = listRegionStories(regionId);
  if (!region) return <EmptyFill hint="NO REGION SELECTED" />;
  const rows = stories.slice(0, 10).map((s) => ({ id: s.id, time: ts(s.ts), tag: s.tag, tone: s.tone, headline: s.headline, entities: s.entities.join(', ') }));
  const cols: DenseColumn[] = [
    { key: 'time', header: 'Time', width: '70px' },
    { key: 'tag', header: 'Tag', width: '90px' },
    { key: 'tone', header: 'Tone', width: '60px' },
    { key: 'headline', header: 'Headline', width: '1fr' },
    { key: 'entities', header: 'Entities', width: '180px' },
  ];
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-1 py-1" style={{ borderBottom: '1px solid #111' }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>{region.name} • REGION SHEET</div>
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
          Sectors: {region.topSectors.join(', ')} • Companies: {region.topCompanies.join(', ')}
        </div>
      </div>
      {rows.length ? (
        <DenseTable
          columns={cols}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeNews(String(r.headline), String(r.tag), String(r.time))}
          onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `GEO region story ${String(r.id)}`, mnemonic: 'GEO', security: region.topCompanies[0] })}
        />
      ) : (
        <EmptyFill hint="NO STORIES FOR REGION" />
      )}
    </div>
  );
}

function GeoComposite({ panelIdx, code }: { panelIdx: number; code: string }) {
  const defaultLayer: GeoLayer = code === 'GEO.N' ? 'NEWS_INTENSITY'
    : code === 'GEO.C' ? 'COMPANY_DENSITY'
      : code === 'GEO.R' ? 'RISK_FLAGS'
        : code === 'GEO.M' ? 'MACRO'
          : code === 'GEO.X' || code === 'GEO.F' || code === 'GEO.S' ? 'SHIPPING'
            : code === 'GEO.E' ? 'ENERGY'
              : code === 'GEO.A' ? 'ALERTS'
                : 'NEWS_INTENSITY';
  const persisted = loadMnemonicUiState(panelIdx, code, {
    layer: defaultLayer as GeoLayer,
    regionId: getGeoState().selectedRegionId,
    windowCode: (code === 'GEO.N' ? '1H' : code === 'GEO.A' ? '1D' : '1W') as '1H' | '1D' | '1W',
    selectedRouteId: getGeoState().routes[0]?.id ?? '',
    selectedCompany: getGeoState().regions[0]?.topCompanies[0] ?? 'AAPL US EQUITY',
  });
  const [layer, setLayer] = useState<GeoLayer>(persisted.layer as GeoLayer);
  const state = getGeoState();
  const [regionId, setRegionId] = useState(String(persisted.regionId ?? state.selectedRegionId));
  const [windowCode, setWindowCode] = useState<'1H' | '1D' | '1W'>(persisted.windowCode as '1H' | '1D' | '1W');
  const [selectedRouteId, setSelectedRouteId] = useState(String(persisted.selectedRouteId ?? state.routes[0]?.id ?? ''));
  const [selectedCompany, setSelectedCompany] = useState(String(persisted.selectedCompany ?? state.regions[0]?.topCompanies[0] ?? 'AAPL US EQUITY'));
  const { drill } = useDrill();
  const title = {
    GEO: 'Global Intelligence Map',
    'GEO.N': 'Geo News Heat',
    'GEO.C': 'Company Footprint Map',
    'GEO.R': 'Regional Risk Map',
    'GEO.M': 'Macro Map',
    'GEO.X': 'Cross-Border Exposure Map',
    'GEO.S': 'Supply Chain Disruption Map',
    'GEO.E': 'Energy & Commodities Map',
    'GEO.F': 'Freight & Shipping Lanes',
    'GEO.A': 'Alerted Regions',
  }[code] ?? 'Geo Intelligence';

  useEffect(() => {
    setGeoLayer(layer);
    saveMnemonicUiState(panelIdx, code, { layer, regionId, windowCode, selectedRouteId, selectedCompany });
  }, [panelIdx, code, layer, regionId, windowCode, selectedRouteId, selectedCompany]);

  const hotspots = useMemo(() => listGeoHotspots(windowCode).map((h) => ({
    id: h.regionId,
    region: h.region,
    volume: h.volume,
    sentiment: h.sentiment.toFixed(2),
    tags: h.tags.join(', '),
  })), [windowCode]);

  const cols: DenseColumn[] = [
    { key: 'region', header: 'Region', width: '140px', entity: (r) => makeCountry(String(r.id), String(r.region)) },
    { key: 'volume', header: 'NewsVol', width: '70px', align: 'right' },
    { key: 'sentiment', header: 'Sent', width: '60px', align: 'right', tone: true },
    { key: 'tags', header: 'Tags', width: '1fr' },
  ];
  const routeRows = useMemo(() => state.routes.map((r) => ({
    id: r.id,
    corridor: `${r.fromRegionId}→${r.toRegionId}`,
    commodity: r.commodity,
    pressure: r.pressure,
  })), [state.routes]);
  const routeCols: DenseColumn[] = [
    { key: 'corridor', header: 'Corridor', width: '1fr', entity: () => makeFunction(code, 'Open corridor exposure') },
    { key: 'commodity', header: 'Commodity', width: '90px' },
    { key: 'pressure', header: 'Press', width: '55px', align: 'right', tone: true },
  ];
  const region = state.regions.find((r) => r.id === regionId) ?? state.regions[0];
  const detailRows = [
    { id: 'm1', metric: 'PolicyRate', value: `${region.policyRate.toFixed(2)}%`, link: 'RGN.M' },
    { id: 'm2', metric: 'Inflation', value: `${region.inflation.toFixed(1)}%`, link: 'RGN.M' },
    { id: 'm3', metric: 'RiskScore', value: `${region.riskScore}`, link: 'RGN.R' },
    { id: 'm4', metric: 'TopCompany', value: region.topCompanies[0] ?? '—', link: 'DES' },
    { id: 'm5', metric: 'TopSector', value: region.topSectors[0] ?? '—', link: 'SECT' },
  ];
  const detailCols: DenseColumn[] = [{ key: 'metric', header: 'Metric', width: '110px' }, { key: 'value', header: 'Value', width: '1fr' }, { key: 'link', header: 'Drill', width: '70px' }];

  const lower = useMemo(() => {
    if (code === 'GEO.C') {
      const fp = listCompanyFootprint(selectedCompany);
      return {
        title: `FOOTPRINT ${selectedCompany}`,
        columns: [
          { key: 'kind', header: 'Kind', width: '90px' },
          { key: 'regionId', header: 'Region', width: '70px' },
          { key: 'criticality', header: 'Crit', width: '70px' },
          { key: 'latLon', header: 'Lat/Lon', width: '1fr' },
        ] as DenseColumn[],
        rows: fp.facilities.map((f) => ({ id: f.id, kind: f.kind, regionId: f.regionId, criticality: f.criticality, latLon: `${f.lat.toFixed(2)}, ${f.lon.toFixed(2)}` })),
        entity: (r: Record<string, unknown>) => makeCountry(String(r.regionId), String(r.regionId)),
      };
    }
    if (code === 'GEO.X' || code === 'GEO.F') {
      const rows = listRouteExposureLedger(selectedRouteId);
      return {
        title: `CORRIDOR LEDGER ${selectedRouteId || '—'}`,
        columns: [
          { key: 'company', header: 'Company', width: '1fr' },
          { key: 'corridor', header: 'Corridor', width: '90px' },
          { key: 'commodity', header: 'Commodity', width: '110px' },
          { key: 'sensitivity', header: 'Sens', width: '60px', align: 'right' },
          { key: 'shippingPressure', header: 'Pressure', width: '70px', align: 'right' },
        ] as DenseColumn[],
        rows: rows.map((x, idx) => ({ id: `${selectedRouteId}-${idx}`, ...x })),
        entity: (r: Record<string, unknown>) => makeSecurity(String(r.company)),
      };
    }
    if (code === 'GEO.S' || code === 'GEO.R' || code === 'GEO.A') {
      const rows = listDisruptions(regionId).map((d) => ({ id: d.id, title: d.title, severity: d.severity, channel: d.channel, impacted: d.impactedCompanies.join(', ') }));
      return {
        title: `DISRUPTIONS ${regionId}`,
        columns: [
          { key: 'title', header: 'Event', width: '1fr' },
          { key: 'severity', header: 'Sev', width: '70px' },
          { key: 'channel', header: 'Channel', width: '90px' },
          { key: 'impacted', header: 'Impacted', width: '190px' },
        ] as DenseColumn[],
        rows,
        entity: () => makeFunction('SCN.R', 'Open affected graph'),
      };
    }
    if (code === 'GEO.M') {
      const rows = listMostExposedCompanies(regionId).slice(0, 8).map((x) => ({ id: x.company, company: x.company, exposure: x.exposureScore, reasons: x.reasons.join(', ') }));
      return {
        title: `MARKET IMPACT ${regionId}`,
        columns: [
          { key: 'company', header: 'Company', width: '1fr' },
          { key: 'exposure', header: 'Score', width: '60px', align: 'right', tone: true },
          { key: 'reasons', header: 'Why', width: '180px' },
        ] as DenseColumn[],
        rows,
        entity: (r: Record<string, unknown>) => makeSecurity(String(r.company)),
      };
    }
    if (code === 'GEO.E') {
      const rows = listRoutes().map((r) => ({ id: r.id, hub: `${r.fromRegionId}/${r.toRegionId}`, commodity: r.commodity, flow: r.flow, pressure: r.pressure }));
      return {
        title: 'COMMODITY HUB LEDGER',
        columns: [
          { key: 'hub', header: 'Hub', width: '120px' },
          { key: 'commodity', header: 'Commodity', width: '110px' },
          { key: 'flow', header: 'Flow', width: '60px', align: 'right' },
          { key: 'pressure', header: 'Pressure', width: '70px', align: 'right' },
        ] as DenseColumn[],
        rows,
        entity: () => makeFunction('SHCK', 'Open commodities impact chain'),
      };
    }
    return {
      title: `EXPOSED COMPANIES ${regionId}`,
      columns: [
        { key: 'company', header: 'Company', width: '1fr' },
        { key: 'exposure', header: 'Score', width: '60px', align: 'right', tone: true },
        { key: 'reasons', header: 'Reasons', width: '180px' },
      ] as DenseColumn[],
      rows: listMostExposedCompanies(regionId).slice(0, 8).map((x) => ({ id: x.company, company: x.company, exposure: x.exposureScore, reasons: x.reasons.join(', ') })),
      entity: (r: Record<string, unknown>) => makeSecurity(String(r.company)),
    };
  }, [code, regionId, selectedRouteId, selectedCompany]);

  const pick = (next: string) => {
    setRegionId(next);
    setGeoRegion(next);
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `${code} region ${next}`, mnemonic: code });
  };
  const regionById = useMemo(() => new globalThis.Map(state.regions.map((r) => [r.id, r])), [state.regions]);
  const onRegionAction = (next: string, intent: DrillIntent) => {
    const r = regionById.get(next);
    if (!r) return;
    if (intent === 'OPEN_IN_PLACE') {
      pick(next);
      return;
    }
    drill(makeCountry(r.id, r.name), intent, panelIdx);
  };
  const onRegionContext = (next: string, x: number, y: number) => {
    const r = regionById.get(next);
    if (!r) return;
    openContextMenuAt(x, y, makeCountry(r.id, r.name), panelIdx);
  };
  const onRouteAction = (routeId: string, intent: DrillIntent) => {
    setSelectedRouteId(routeId);
    if (intent === 'OPEN_IN_PLACE') return;
    const targetFn = code === 'GEO.F' ? 'GEO.F' : 'GEO.X';
    drill(makeFunction(targetFn, `Corridor ${routeId}`), intent, panelIdx);
  };
  const onRouteContext = (routeId: string, x: number, y: number) => {
    setSelectedRouteId(routeId);
    openContextMenuAt(x, y, makeFunction(code === 'GEO.F' ? 'GEO.F' : 'GEO.X', `Corridor ${routeId}`), panelIdx);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`${code} • ${title}`} right={<StatusBadge label="SIM" variant="sim" />} />
      <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: '2fr 1fr', gap: 0 }}>
        <div className="flex flex-col min-h-0" style={{ borderRight: '1px solid #111' }}>
          <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
            {(['NEWS_INTENSITY', 'COMPANY_DENSITY', 'RISK_FLAGS', 'MACRO', 'SHIPPING', 'ENERGY', 'ALERTS'] as GeoLayer[]).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => {
                  setLayer(x);
                  setGeoLayer(x);
                }}
                style={{ color: layer === x ? DENSITY.accentAmber : DENSITY.textMuted }}
              >
                {x.replace('_', '.')}
              </button>
            ))}
            <select value={windowCode} onChange={(e) => setWindowCode(e.target.value as '1H' | '1D' | '1W')} style={{ background: '#000', border: '1px solid #222' }}>
              <option value="1H">1H</option>
              <option value="1D">1D</option>
              <option value="1W">1W</option>
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <GeoMapCanvas
              layer={layer}
              onRegionAction={onRegionAction}
              onRouteAction={onRouteAction}
              onRegionContext={onRegionContext}
              onRouteContext={onRouteContext}
            />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <div style={{ borderBottom: '1px solid #111' }}>
            <DenseTable
              columns={cols}
              rows={hotspots}
              rowKey="id"
              panelIdx={panelIdx}
              className="h-[180px]"
              onRowClick={(r) => pick(String(r.id))}
            />
          </div>
          {(code === 'GEO.X' || code === 'GEO.F') && (
            <div style={{ borderBottom: '1px solid #111' }}>
              <DenseTable
                columns={routeCols}
                rows={routeRows}
                rowKey="id"
                panelIdx={panelIdx}
                className="h-[120px]"
                onRowClick={(r) => setSelectedRouteId(String(r.id))}
              />
            </div>
          )}
          {(code === 'GEO.C' || code === 'GEO.X' || code === 'GEO.F') && (
            <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
              {code === 'GEO.C' ? (
                <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
                  {Array.from(new Set(state.regions.flatMap((r) => r.topCompanies))).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)} style={{ background: '#000', border: '1px solid #222' }}>
                  {state.routes.map((r) => <option key={r.id} value={r.id}>{r.id} {r.fromRegionId}→{r.toRegionId}</option>)}
                </select>
              )}
            </div>
          )}
          <div style={{ borderBottom: '1px solid #111' }}>
            <DenseTable
              columns={detailCols}
              rows={detailRows}
              rowKey="id"
              panelIdx={panelIdx}
              className="h-[120px]"
              rowEntity={(r) => {
                if (String(r.link) === 'DES' && String(r.value) !== '—') return makeSecurity(String(r.value));
                if (String(r.link) === 'SECT') return makeFunction('IMAP', 'Sector heatmap');
                return makeFunction(String(r.link), 'Open regional drill');
              }}
            />
          </div>
          <div className="flex-1 min-h-0">
            <RegionSheet panelIdx={panelIdx} regionId={regionId} />
          </div>
          <div style={{ borderTop: '1px solid #111' }}>
            <div className="px-1 py-1" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>{lower.title}</div>
            <DenseTable
              columns={lower.columns}
              rows={lower.rows}
              rowKey="id"
              panelIdx={panelIdx}
              className="h-[170px]"
              rowEntity={(r) => lower.entity(r)}
              onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `${code} deep drill ${String(r.id)}`, mnemonic: code, security: region.topCompanies[0] })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FnGEO({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO" />; }
export function FnGEON({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.N" />; }
export function FnGEOC({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.C" />; }
export function FnGEOR({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.R" />; }
export function FnGEOM({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.M" />; }
export function FnGEOX({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.X" />; }
export function FnGEOS({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.S" />; }
export function FnGEOE({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.E" />; }
export function FnGEOF({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.F" />; }
export function FnGEOA({ panelIdx = 0 }: { panelIdx?: number }) { return <GeoComposite panelIdx={panelIdx} code="GEO.A" />; }
