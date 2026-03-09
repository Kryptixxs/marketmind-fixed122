'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { TileCell, TileGrid, TileLayoutRoot, TerminalTile } from '../ui/TileLayout';
import { makeFunction, makeSecurity, type EntityRef } from '../entities/types';
import { useDrill } from '../entities/DrillContext';
import { DENSITY } from '../../constants/layoutDensity';
import { buildIntegratedRelatedCodes, getCatalogMnemonic, listCatalogByTaxonomy, listCatalogMnemonics, type MnemonicCategory, type MnemonicRecipeId } from '../../mnemonics/catalog';
import { buildNewsStream, buildPortfolioRows, buildPriceSeries, buildRelationshipEdges, denseRowsForMnemonic, evidenceRowsFor, relatedEntitiesFor } from '../../services/dataFabric';
import { makeFieldValueEntity } from '../../services/fieldRuntime';
import { TerminalChart } from '../../../../components/charts/TerminalChart';
import { useTerminalOS } from '../TerminalOSContext';

const RECIPE_SPEC: Record<MnemonicCategory, { cols: string; rows: string; areas: string[] }> = {
  EQUITY: { cols: '2fr 1fr', rows: '1.2fr 1fr 0.9fr 0.9fr', areas: ['main side', 'main relf', 'rels relf', 'evid evid'] },
  FX: { cols: '1.7fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'main rels', 'curve rels', 'evid relf'] },
  RATES: { cols: '1.7fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['curve side', 'curve rels', 'main rels', 'evid relf'] },
  CREDIT: { cols: '1.8fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'main rels', 'curve rels', 'evid relf'] },
  DERIVS: { cols: '1.8fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'surf rels', 'chain rels', 'evid relf'] },
  MACRO: { cols: '1.6fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'main rels', 'cal rels', 'evid relf'] },
  PORTFOLIO: { cols: '1.8fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'risk rels', 'risk relf', 'evid relf'] },
  NEWS_DOCS: { cols: '1.6fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'main rels', 'flow rels', 'evid relf'] },
  OPS_ADMIN: { cols: '1.6fr 1fr', rows: '1fr 1fr 1fr 0.9fr', areas: ['main side', 'ops rels', 'ops relf', 'evid relf'] },
};

function categoryMainColumns(category: MnemonicCategory): DenseColumn[] {
  const base: DenseColumn[] = [
    { key: 'sym', header: category === 'FX' ? 'Pair' : 'Security', width: '120px', entity: (r) => makeSecurity(String(r.sym), String(r.name)) },
    { key: 'name', header: 'Name', width: '1fr' },
    { key: 'sector', header: category === 'RATES' ? 'Curve' : 'Sector', width: '90px' },
    { key: 'country', header: 'Region', width: '80px' },
    { key: 'last', header: 'Last', width: '80px', align: 'right', entity: (r) => makeFieldValueEntity('PX_LAST', r.last) },
    { key: 'pct', header: 'Percent Change', width: '110px', align: 'right', tone: true, format: (v) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`, entity: (r) => makeFieldValueEntity('PCT_CHG', r.pct, { source: 'CALC' }) },
    { key: 'vol', header: 'Volume', width: '85px', align: 'right', format: (v) => `${Number(v).toFixed(1)}M`, entity: (r) => makeFieldValueEntity('VOLUME', r.vol) },
    { key: 'score', header: 'Score', width: '60px', align: 'right', entity: (r) => makeFieldValueEntity('BETA', r.score, { source: 'CALC' }) },
  ];
  if (category === 'DERIVS') {
    return [
      ...base.slice(0, 2),
      { key: 'last', header: 'IV', width: '70px', align: 'right', entity: (r) => makeFieldValueEntity('IV', r.last, { source: 'CALC' }) },
      { key: 'pct', header: 'Skew', width: '70px', align: 'right', tone: true, entity: (r) => makeFieldValueEntity('PCT_CHG', r.pct, { source: 'CALC' }) },
      { key: 'vol', header: 'OI', width: '70px', align: 'right', entity: (r) => makeFieldValueEntity('VOLUME', Number(r.vol) * 1000) },
      { key: 'score', header: 'GEX', width: '70px', align: 'right', entity: (r) => makeFieldValueEntity('DELTA', r.score, { source: 'CALC' }) },
    ];
  }
  return base;
}

export function FnFactoryMnemonic({ panelIdx, code }: { panelIdx: number; code: string }) {
  const { drill } = useDrill();
  const { panels } = useTerminalOS();
  const def = getCatalogMnemonic(code);
  const category = def?.category ?? 'EQUITY';
  const recipeId: MnemonicRecipeId = def?.defaultRecipeId ?? 'ReferenceSheet';
  const panel = panels[panelIdx];
  const activeSecurity = panel?.activeSecurity?.trim() || `${code} US Equity`;
  const activeUniverse = `${category}-CORE-UNIVERSE`;
  const scopeLabel = def?.requiresSecurity ? activeSecurity : activeUniverse;
  const rows = useMemo(() => denseRowsForMnemonic(category, scopeLabel, 320), [category, scopeLabel]);
  const relatedEntities = useMemo(() => relatedEntitiesFor(activeSecurity, 26), [activeSecurity]);
  const evidence = useMemo(() => evidenceRowsFor(activeSecurity), [activeSecurity]);
  const relatedFunctions = useMemo(() => {
    const merged = buildIntegratedRelatedCodes(code, 16);
    if (merged.length >= 10) return merged;
    const filler = ['DES', 'TOP', 'LINE', 'FLD', 'NAV', 'NX', 'MON', 'RPT', 'WS', 'TUTOR'];
    return Array.from(new Set([...merged, ...filler])).slice(0, 12);
  }, [code]);
  const nextActions = useMemo(() => relatedFunctions.slice(0, 8), [relatedFunctions]);
  const series = useMemo(() => buildPriceSeries(`${code}-${activeSecurity}`, category === 'DERIVS' ? 90 : 120), [code, activeSecurity, category]);
  const news = useMemo(() => buildNewsStream(activeSecurity, 30), [activeSecurity]);
  const relEdges = useMemo(() => buildRelationshipEdges(activeSecurity, 60), [activeSecurity]);
  const positions = useMemo(() => buildPortfolioRows(activeSecurity, 90), [activeSecurity]);
  const spec = RECIPE_SPEC[category];
  const hasArea = (a: string) => spec.areas.some((row) => row.split(' ').includes(a));
  const mainCols = categoryMainColumns(category);
  const relCols: DenseColumn[] = [
    { key: 'kind', header: 'Kind', width: '80px' },
    { key: 'label', header: 'Entity', width: '1fr' },
  ];
  const relRows = relatedEntities.map((e, i) => ({ id: `${e.kind}-${e.id}-${i}`, kind: `${e.kind}${i >= 20 ? ' (SIM)' : ''}`, label: e.display, entity: e }));
  const evidenceCols: DenseColumn[] = [
    { key: 'evidence', header: 'Evidence', width: '1fr' },
    { key: 'score', header: 'Score', width: '70px', align: 'right', entity: (r) => makeFieldValueEntity('BETA', r.score, { source: 'CALC' }) },
    { key: 'source', header: 'Provenance', width: '90px' },
  ];
  const fnRows = relatedFunctions.map((fn, i) => ({ id: `${fn}-${i}`, fn, title: fn, entity: makeFunction(fn, fn) }));
  const fnCols: DenseColumn[] = [
    { key: 'fn', header: 'Function', width: '90px', entity: (r) => makeFunction(String(r.fn), String(r.title)) },
    { key: 'title', header: 'Related Function', width: '1fr' },
  ];
  const newsCols: DenseColumn[] = [
    { key: 'ts', header: 'Time', width: '72px' },
    { key: 'headline', header: 'Headline', width: '1fr', entity: (r) => makeSecurity(activeSecurity, String(r.headline).slice(0, 16)) },
    { key: 'source', header: 'Src', width: '56px' },
  ];
  const edgeCols: DenseColumn[] = [
    { key: 'type', header: 'Type', width: '88px' },
    { key: 'to', header: 'Related', width: '1fr', entity: (r) => makeSecurity(`${String(r.to)} US Equity`, String(r.to)) },
    { key: 'strength', header: 'Strength', width: '82px', align: 'right', entity: (r) => makeFieldValueEntity('BETA', r.strength, { source: 'CALC' }) },
  ];
  const posCols: DenseColumn[] = [
    { key: 'symbol', header: 'Symbol', width: '1fr', entity: (r) => makeSecurity(String(r.symbol)) },
    { key: 'qty', header: 'Qty', width: '70px', align: 'right' },
    { key: 'px', header: 'Price', width: '70px', align: 'right', entity: (r) => makeFieldValueEntity('PX_LAST', r.px) },
    { key: 'pnl', header: 'Profit and Loss', width: '120px', align: 'right', tone: true, entity: (r) => makeFieldValueEntity('PX_CHG', r.pnl, { source: 'CALC' }) },
  ];

  if (code === 'FCAT') {
    const groups = listCatalogByTaxonomy();
    const rows = Object.entries(groups).map(([k, v]) => ({ id: k, taxonomy: k, count: v.length }));
    const cols: DenseColumn[] = [
      { key: 'taxonomy', header: 'Taxonomy', width: '1fr' },
      { key: 'count', header: 'Functions', width: '90px', align: 'right' },
    ];
    const catRows = listCatalogMnemonics().slice(0, 320).map((m) => ({
      id: m.code,
      code: m.code,
      title: m.title,
      cat: `${m.category}/${m.functionType}/${m.scope}`,
      entity: makeFunction(m.code, m.title),
    }));
    const catCols: DenseColumn[] = [
      { key: 'code', header: 'Code', width: '90px', entity: (r) => makeFunction(String(r.code), String(r.title)) },
      { key: 'title', header: 'Title', width: '1fr' },
      { key: 'cat', header: 'Taxonomy', width: '230px' },
    ];
    return (
      <div className="flex flex-col h-full min-h-0">
        <PanelSubHeader title={`FCAT • Function Catalog (${listCatalogMnemonics().length})`} right={<StatusBadge label="SIM" variant="sim" />} />
        <div className="flex-1 min-h-0">
          <TileLayoutRoot panelIdx={panelIdx}>
            <TileGrid spec={{ columns: '1fr 1.8fr', rows: '1fr 1fr', areas: ['tax list', 'tax list'] }}>
              <TileCell area="tax">
                <TerminalTile id="fcat-tax" title="Taxonomy Groups" status="asset/type/scope">
                  <DenseTable columns={cols} rows={rows as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} className="h-full" compact />
                </TerminalTile>
              </TileCell>
              <TileCell area="list">
                <TerminalTile id="fcat-list" title="Function Catalog" status="browse and drill">
                  <DenseTable columns={catCols} rows={catRows as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => (r as unknown as { entity: EntityRef }).entity} className="h-full" compact />
                </TerminalTile>
              </TileCell>
            </TileGrid>
          </TileLayoutRoot>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`${code} • ${def?.title ?? 'Factory Generated Mnemonic'} (${category}/${recipeId})`} right={<StatusBadge label="SIM/LIVE/STALE" variant="sim" />} />
      <div className="flex items-center gap-1" style={{ height: 14, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>
        <span style={{ color: DENSITY.textSecondary }}>NEXT ACTIONS</span>
        {nextActions.map((fn) => (
          <button
            key={fn}
            type="button"
            onClick={() => drill(makeFunction(fn, fn), 'OPEN_IN_PLACE', panelIdx)}
            style={{ border: `1px solid ${DENSITY.groupSeparator}`, background: 'transparent', color: DENSITY.accentAmber, padding: '0 3px', cursor: 'pointer', fontSize: DENSITY.fontSizeTiny }}
          >
            {fn}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}>
          {def?.requiresSecurity ? `Security: ${activeSecurity}` : `Universe: ${activeUniverse} (SIM)`}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <TileLayoutRoot panelIdx={panelIdx}>
          <TileGrid spec={{ columns: spec.cols, rows: spec.rows, areas: spec.areas }}>
            <TileCell area="main">
              <TerminalTile id={`${code}-main`} title="Primary Grid" status="Dense universe">
                <DenseTable columns={mainCols} rows={rows} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(String(r.sym), String(r.name))} className="h-full" />
              </TerminalTile>
            </TileCell>
            <TileCell area="side">
              <TerminalTile id={`${code}-side`} title={category === 'RATES' ? 'Curve / Spreads' : category === 'DERIVS' ? 'Surface / Greeks' : category === 'MACRO' ? 'Calendar / Surprises' : 'Context Board'} status="Category recipe">
                <div className="h-full min-h-0 flex flex-col">
                  <div style={{ height: 120, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
                    <TerminalChart type={category === 'DERIVS' ? 'surface' : category === 'RATES' ? 'ladder' : category === 'FX' ? 'line' : 'area'} series={series} metricLabel={`${code} trend`} metricValue={String(series[series.length - 1] ?? '--')} />
                  </div>
                  <div style={{ padding: DENSITY.pad4, color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeDefault, lineHeight: 1.2 }}>
                    {def?.helpMarkdown.split('\n').slice(0, 5).map((line, i) => <div key={i}>{line.replace(/^#\s*/, '')}</div>)}
                  </div>
                </div>
              </TerminalTile>
            </TileCell>
            {hasArea('curve') && <TileCell area="curve">
              <TerminalTile id={`${code}-curve`} title={category === 'FX' ? 'Cross + Carry' : category === 'RATES' ? 'Curves + Flies' : category === 'CREDIT' ? 'Spread Ladders' : category === 'DERIVS' ? 'Chain Ladder' : category === 'PORTFOLIO' ? 'Risk Buckets' : category === 'MACRO' ? 'Release Ladder' : category === 'NEWS_DOCS' ? 'Narrative Flow' : 'Ops Matrix'} status="Dense block">
                <DenseTable columns={mainCols.slice(0, 6)} rows={rows.slice(0, 120)} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(String(r.sym), String(r.name))} className="h-full" compact />
              </TerminalTile>
            </TileCell>}
            {hasArea('ops') && <TileCell area="ops">
              <TerminalTile id={`${code}-ops`} title="Operational Stream" status="Health / alerts">
                <DenseTable columns={mainCols.slice(0, 6)} rows={rows.slice(120, 240)} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(String(r.sym), String(r.name))} className="h-full" compact />
              </TerminalTile>
            </TileCell>}
            {hasArea('flow') && <TileCell area="flow">
              <TerminalTile id={`${code}-flow`} title="Flow / Timeline" status="Event stream">
                {category === 'NEWS_DOCS' || category === 'MACRO'
                  ? <DenseTable columns={newsCols} rows={news as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(activeSecurity, String(r.headline).slice(0, 16))} className="h-full" compact />
                  : <DenseTable columns={mainCols.slice(0, 6)} rows={rows.slice(40, 170)} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(String(r.sym), String(r.name))} className="h-full" compact />}
              </TerminalTile>
            </TileCell>}
            {hasArea('risk') && <TileCell area="risk">
              <TerminalTile id={`${code}-risk`} title="Risk Surface" status="Exposure views">
                {category === 'PORTFOLIO'
                  ? <DenseTable columns={posCols} rows={positions as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(String(r.symbol))} className="h-full" compact />
                  : <DenseTable columns={mainCols.slice(0, 6)} rows={rows.slice(170, 290)} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => makeSecurity(String(r.sym), String(r.name))} className="h-full" compact />}
              </TerminalTile>
            </TileCell>}
            <TileCell area="rels">
              <TerminalTile id={`${code}-rels`} title="Related Entities" status=">=20 drill rows">
                <DenseTable columns={relCols} rows={relRows as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => (r as unknown as { entity: EntityRef }).entity} className="h-full" compact />
              </TerminalTile>
            </TileCell>
            <TileCell area="relf">
              <TerminalTile id={`${code}-relf`} title="Related Functions" status=">=10 drill codes">
                <DenseTable columns={fnCols} rows={fnRows as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => (r as unknown as { entity: EntityRef }).entity} className="h-full" compact />
              </TerminalTile>
            </TileCell>
            <TileCell area="evid">
              <TerminalTile id={`${code}-evid`} title="Evidence / Why" status="relationship confidence">
                <DenseTable columns={category === 'EQUITY' || category === 'CREDIT' || category === 'DERIVS' ? edgeCols : evidenceCols} rows={(category === 'EQUITY' || category === 'CREDIT' || category === 'DERIVS' ? relEdges : evidence) as unknown as Array<Record<string, unknown>>} rowKey="id" panelIdx={panelIdx} rowEntity={(r) => (r as unknown as { field?: EntityRef }).field ?? makeSecurity(`${String((r as Record<string, unknown>).to)} US Equity`, String((r as Record<string, unknown>).to))} className="h-full" compact />
              </TerminalTile>
            </TileCell>
          </TileGrid>
        </TileLayoutRoot>
      </div>
      <div style={{ height: 12, borderTop: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>
        ENTER Drill | SHIFT+ENTER Send | ALT+ENTER Inspect | F2 MENU | F1 HELP | Ctrl+K HL
      </div>
    </div>
  );
}

