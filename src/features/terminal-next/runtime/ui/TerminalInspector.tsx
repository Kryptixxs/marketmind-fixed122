'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity, makeField, makeFunction, makeIndex, makeETF, makeSector, makeCountry, makeNews, makeHolder } from '../entities/types';
import type { EntityRef } from '../entities/types';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import { getFieldDef } from '../../services/fieldCatalog';
import { StatusBadge } from '../primitives';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

function buildEntityFields(entity: EntityRef): Array<{ label: string; value: string; entity?: EntityRef }> {
  const common: Array<{ label: string; value: string; entity?: EntityRef }> = [
    { label: 'ID', value: entity.id },
    { label: 'TYPE', value: entity.kind },
    { label: 'DISPLAY', value: entity.display },
    { label: 'PROVENANCE', value: 'SIM' },
  ];

  switch (entity.kind) {
    case 'SECURITY':
    case 'COMPANY': {
      const sym = (entity.payload as { sym: string }).sym;
      const ticker = sym.split(' ')[0] ?? sym;
      const seed = h(ticker);
      return [
        { label: 'TICKER', value: ticker, entity: makeSecurity(sym) },
        { label: 'LAST PX', value: (175 + seed % 50).toFixed(2), entity: makeField('PX_LAST', 175 + seed % 50) },
        { label: 'MARKET CAP', value: '$' + (2.3 + (seed % 20) / 10).toFixed(1) + 'T', entity: makeField('MARKET_CAP') },
        { label: 'P/E RATIO', value: (22 + seed % 18).toFixed(1) + 'x', entity: makeField('PE_RATIO', 22 + seed % 18) },
        { label: 'EPS TTM', value: '$' + (3 + seed % 15).toFixed(2), entity: makeField('EPS') },
        { label: 'DIV YIELD', value: (1.5 + (seed % 15) / 10).toFixed(2) + '%', entity: makeField('DIV_YIELD') },
        { label: 'BETA', value: (0.8 + (seed % 12) / 10).toFixed(2), entity: makeField('BETA') },
        { label: '52W HIGH', value: (200 + seed % 80).toFixed(2), entity: makeField('52W_HIGH') },
        { label: '52W LOW', value: (120 + seed % 60).toFixed(2), entity: makeField('52W_LOW') },
        { label: 'AVG VOL', value: (30 + seed % 50) + 'M', entity: makeField('VOLUME') },
        { label: 'EXCHANGE', value: seed % 2 === 0 ? 'NASDAQ' : 'NYSE', entity: makeField('PRIMARY_EXCHANGE') },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'INDEX': {
      const sym = (entity.payload as { sym: string }).sym;
      const ticker = sym.split(' ')[0] ?? sym;
      const seed = h(ticker);
      return [
        { label: 'INDEX', value: ticker, entity: makeIndex(sym, entity.display) },
        { label: 'LAST', value: (5000 + seed % 800).toFixed(2), entity: makeField('PX_LAST') },
        { label: 'CHG', value: ((seed % 40) - 20).toFixed(2), entity: makeField('PX_CHG') },
        { label: '%CHG', value: (((seed % 40) - 20) / 50).toFixed(2) + '%', entity: makeField('PCT_CHG') },
        { label: 'CONSTITUENTS', value: String(500 + seed % 500) },
        { label: 'ASSET CLASS', value: 'INDEX' },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'ETF': {
      const sym = (entity.payload as { sym: string }).sym;
      const ticker = sym.split(' ')[0] ?? sym;
      const seed = h(ticker);
      return [
        { label: 'TICKER', value: ticker, entity: makeETF(sym, entity.display) },
        { label: 'LAST NAV', value: (100 + seed % 300).toFixed(2), entity: makeField('PX_LAST') },
        { label: 'AUM ($B)', value: (10 + seed % 300).toFixed(1), entity: makeField('MARKET_CAP') },
        { label: 'EXPENSE RATIO', value: (0.03 + (seed % 8) / 100).toFixed(2) + '%' },
        { label: 'SHARES OUT', value: (200 + seed % 400) + 'M' },
        { label: 'PREMIUM/DISC', value: (((seed % 20) - 10) / 100).toFixed(3) + '%' },
        { label: 'YIELD', value: (1 + seed % 4).toFixed(2) + '%' },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'FX': {
      const pair = (entity.payload as { pair: string }).pair;
      const seed = h(pair);
      const isJPY = pair.includes('JPY');
      return [
        { label: 'PAIR', value: pair },
        { label: 'SPOT', value: isJPY ? (140 + seed % 20).toFixed(2) : (1.0 + (seed % 30) / 100).toFixed(4), entity: makeField('PX_LAST') },
        { label: 'BID', value: isJPY ? (139.98 + seed % 20).toFixed(2) : (1.0 + (seed % 30) / 100 - 0.0002).toFixed(4) },
        { label: 'ASK', value: isJPY ? (140.02 + seed % 20).toFixed(2) : (1.0 + (seed % 30) / 100 + 0.0002).toFixed(4) },
        { label: 'SPREAD PIP', value: (seed % 3 + 1).toFixed(1) },
        { label: '1Y CHANGE', value: ((seed % 20) - 10).toFixed(2) + '%' },
        { label: 'VOL 1M', value: (5 + seed % 10).toFixed(1) + '%' },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'FUTURE':
    case 'OPTION': {
      const sym = (entity.payload as { sym: string }).sym;
      const seed = h(sym);
      return [
        { label: 'SYMBOL', value: sym },
        { label: 'LAST', value: (50 + seed % 200).toFixed(2), entity: makeField('PX_LAST') },
        { label: 'OPEN INT', value: (10000 + seed % 50000).toLocaleString() },
        { label: 'VOLUME', value: (1000 + seed % 10000).toLocaleString() },
        ...(entity.kind === 'OPTION' ? [
          { label: 'DELTA', value: (0.2 + (seed % 6) / 10).toFixed(2), entity: makeField('DELTA') },
          { label: 'VEGA', value: (0.05 + (seed % 20) / 100).toFixed(2), entity: makeField('VEGA') },
          { label: 'GAMMA', value: (0.01 + (seed % 5) / 100).toFixed(3) },
          { label: 'THETA', value: '-' + (0.01 + (seed % 5) / 100).toFixed(3) },
        ] : [
          { label: 'BASIS', value: (seed % 30 - 15).toFixed(2) },
          { label: 'ROLL COST', value: (seed % 10 - 5).toFixed(2) + '%' },
        ]),
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'COUNTRY': {
      const cp = entity.payload as { iso2: string; name: string };
      const seed = h(cp.iso2);
      return [
        { label: 'COUNTRY', value: cp.name },
        { label: 'ISO CODE', value: cp.iso2 },
        { label: 'GDP ($T)', value: (1 + seed % 20).toFixed(1), entity: makeField('GDP') },
        { label: 'INFLATION', value: (2 + (seed % 80) / 10).toFixed(1) + '%', entity: makeField('INFLATION_RATE') },
        { label: 'POLICY RATE', value: (1 + (seed % 50) / 10).toFixed(2) + '%', entity: makeField('POLICY_RATE') },
        { label: 'CURRENCY', value: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD'][seed % 6]! },
        { label: 'RATING', value: ['AAA', 'AA+', 'AA', 'A+', 'A'][seed % 5]! },
        { label: 'MAJOR INDEX', value: cp.iso2 === 'US' ? 'SPX' : cp.iso2 === 'JP' ? 'NKY' : cp.iso2 === 'GB' ? 'UKX' : 'LOCAL', entity: makeIndex(`LOCAL Index`, cp.iso2 + ' Index') },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'SECTOR':
    case 'INDUSTRY': {
      const sp = entity.payload as { name: string };
      const seed = h(sp.name);
      return [
        { label: entity.kind, value: sp.name },
        { label: '% CHANGE', value: ((seed % 40) - 20) / 10 + '%', entity: makeField('PCT_CHG') },
        { label: 'MKT WEIGHT', value: (3 + seed % 25) + '%' },
        { label: 'PE RATIO', value: (15 + seed % 20).toFixed(1) + 'x', entity: makeField('PE_RATIO') },
        { label: 'YTD PERF', value: ((seed % 40) - 10).toFixed(1) + '%' },
        { label: 'MEMBERS', value: String(20 + seed % 80) },
        { label: 'RELATED', value: 'IMAP', entity: makeFunction('IMAP', 'Heatmap') },
        { label: 'RELATED', value: 'RELS', entity: makeFunction('RELS', 'Peers') },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'HOLDER': {
      const hp = entity.payload as { name: string; pct?: number };
      const seed = h(hp.name);
      return [
        { label: 'HOLDER', value: hp.name },
        { label: '% OUT', value: (hp.pct ?? (1 + seed % 8)).toFixed(2) + '%' },
        { label: 'SHARES (M)', value: (50 + seed % 500).toFixed(1), entity: makeField('SHARES_HELD') },
        { label: 'VALUE ($B)', value: (0.5 + (seed % 50) / 10).toFixed(1) },
        { label: 'CHG QOQ (M)', value: ((seed % 40) - 20).toFixed(1), entity: makeField('SHARE_CHANGE') },
        { label: 'STYLE', value: ['GROWTH', 'VALUE', 'BLEND', 'QUANT'][seed % 4]! },
        { label: 'FILING DATE', value: new Date(Date.now() - (seed % 90) * 86400000).toISOString().slice(0, 10) },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'PERSON': {
      const pp = entity.payload as { name: string; title?: string; company?: string };
      return [
        { label: 'NAME', value: pp.name },
        { label: 'TITLE', value: pp.title ?? '—' },
        { label: 'COMPANY', value: pp.company ?? '—', entity: pp.company ? makeSecurity(`${pp.company} US Equity`, pp.company) : undefined },
        { label: 'TENURE', value: (2010 + h(pp.name) % 14) + '–PRESENT' },
        { label: 'COMP ($M)', value: (5 + h(pp.name) % 45).toFixed(1) },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'NEWS': {
      const np = entity.payload as { headline: string; src?: string; ts?: string };
      return [
        { label: 'HEADLINE', value: np.headline },
        { label: 'SOURCE', value: np.src ?? '—' },
        { label: 'TIME', value: np.ts ?? new Date().toISOString().slice(11, 19) },
        { label: 'REGION', value: 'GLOBAL' },
        { label: 'TAGS', value: 'MACRO,RATES' },
        { label: 'RELATED', value: 'TOP', entity: makeFunction('TOP', 'Top News') },
        { label: 'PROVENANCE', value: 'LIVE' },
      ];
    }
    case 'EVENT': {
      const ep = entity.payload as { type: string; date: string; desc: string };
      return [
        { label: 'TYPE', value: ep.type },
        { label: 'DATE', value: ep.date },
        { label: 'DESCRIPTION', value: ep.desc },
        { label: 'IMPACT', value: ['HIGH', 'MED', 'LOW'][h(ep.type) % 3]! },
        { label: 'RELATED', value: 'EVT', entity: makeFunction('EVT', 'Events') },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'FIELD': {
      const fp = entity.payload as {
        fieldName: string;
        value?: unknown;
        source?: 'SIM' | 'LIVE' | 'CALC';
        asOf?: string;
        freshness?: 'FRESH' | 'STALE';
        stale?: boolean;
        transforms?: string[];
      };
      const def = getFieldDef(fp.fieldName);
      const asOf = fp.asOf ?? new Date().toISOString();
      const freshness = fp.stale || fp.freshness === 'STALE' ? 'STALE' : fp.freshness ?? 'FRESH';
      const source = fp.source ?? def?.provenance ?? 'SIM';
      const tx = fp.transforms ?? [`normalize.${fp.fieldName.toLowerCase()}`, `guard.${fp.fieldName.toLowerCase()}`];
      return [
        { label: 'FIELD', value: fp.fieldName },
        { label: 'LABEL', value: def?.label ?? fp.fieldName },
        { label: 'VALUE', value: String(fp.value ?? '—'), entity: fp.value !== undefined ? makeField(fp.fieldName, fp.value) : undefined },
        { label: 'TYPE', value: `${(def?.valueType ?? 'scalar').toUpperCase()}/${(def?.dataType ?? 'number').toUpperCase()}` },
        { label: 'UNIT', value: def?.unit || '—' },
        { label: 'UPDATE FREQ', value: (def?.cadence ?? def?.updateFreq ?? 'daily').toUpperCase() },
        { label: 'AS OF', value: asOf },
        { label: 'FRESHNESS', value: freshness },
        { label: 'SOURCE', value: source },
        { label: 'LINEAGE', value: `SOURCE -> ${tx[0]} -> ${tx[1]} -> DISPLAY`, entity: makeFunction('LINE', 'Lineage') },
        { label: 'CHARTABLE', value: def?.chartable ? 'YES' : 'NO' },
        { label: 'PROVENANCE', value: freshness === 'STALE' ? 'STALE' : source },
        { label: 'RELATED', value: 'DES', entity: makeFunction('DES', 'Description') },
        { label: 'RELATED', value: 'FA', entity: makeFunction('FA', 'Financials') },
      ];
    }
    case 'ORDER':
    case 'TRADE': {
      const op = entity.payload as { id: string; sym?: string };
      return [
        { label: 'ORDER ID', value: op.id },
        { label: 'SYMBOL', value: op.sym ?? '—', entity: op.sym ? makeSecurity(op.sym) : undefined },
        { label: 'STATUS', value: 'SIM-FILLED' },
        { label: 'RELATED', value: 'BLTR', entity: makeFunction('BLTR', 'Blotter') },
        { label: 'PROVENANCE', value: 'SIM' },
      ];
    }
    case 'FUNCTION': {
      const fp = entity.payload as { code: string; title?: string };
      const def = MNEMONIC_DEFS[fp.code];
      return [
        { label: 'CODE', value: fp.code },
        { label: 'TITLE', value: fp.title ?? def?.title ?? '—' },
        { label: 'CATEGORY', value: def?.layoutType ?? '—' },
        { label: 'NEEDS SEC', value: def?.requiresSecurity ? 'YES' : 'NO' },
        { label: 'RELATED', value: (def?.relatedCodes ?? []).slice(0, 3).join(', ') },
      ];
    }
    default:
      return common;
  }
}

function relatedFunctions(entity: EntityRef): string[] {
  switch (entity.kind) {
    case 'SECURITY': case 'COMPANY': return ['DES', 'HP', 'GP', 'FA', 'CN', 'OWN', 'RELG', 'RELT', 'IMP', 'OUT', 'PATH', 'NEX', 'XDRV', 'SCN', 'SCN.R', 'FAC', 'CUST', 'SUPP', 'BETA.X', 'REGI', 'HEDGE', 'SHOCK.G', 'CMPY', 'SECT', 'INDY', 'CTY', 'CITY', 'BKMK', 'TRAIL', 'RELATE', 'FOCUS', 'NOTES', 'ALRT'];
    case 'INDEX': case 'ETF': return ['DES', 'GP', 'HP', 'WEI', 'IMAP'];
    case 'FX': return ['DES', 'GP', 'FXC', 'XDRV', 'BETA.X'];
    case 'FUTURE': return ['DES', 'GP', 'HP'];
    case 'OPTION': return ['DES', 'GP', 'HP'];
    case 'HOLDER': return ['OWN', 'MGMT', 'DES'];
    case 'PERSON': return ['MGMT', 'OWN', 'DES'];
    case 'FIELD': return ['DES', 'FA', 'LINE', 'FLD'];
    case 'NEWS': return ['TOP', 'CN', 'NMAP', 'NREL', 'NEX', 'NTIM', 'NQ'];
    case 'EVENT': return ['EVT', 'DES', 'DVD'];
    case 'SECTOR': return ['IMAP', 'RELS', 'SECT', 'REGI', 'XDRV'];
    case 'INDUSTRY': return ['RELS', 'IMAP', 'INDY', 'SCN', 'SUPP'];
    case 'COUNTRY': return ['WEI', 'ECO', 'FXC', 'RGN', 'RGN.N', 'RGN.M', 'RGN.R', 'GEO', 'GEO.R', 'GEO.M', 'CTY', 'CITY'];
    case 'FUNCTION': return ['MENU', 'HL', 'AUD', 'NAV', 'NX'];
    case 'ORDER': case 'TRADE': return ['BLTR', 'ORD', 'AUD'];
    default: return ['DES', 'TOP'];
  }
}

function relatedEntities(entity: EntityRef): EntityRef[] {
  const seed = h(entity.id + entity.kind);
  if (entity.kind === 'SECURITY' || entity.kind === 'COMPANY') {
    const base = (entity.payload as { sym: string }).sym.split(' ')[0] ?? entity.display;
    return [
      makeSecurity(`${base} US Equity`, `${base} Corp`),
      makeSecurity('MSFT US Equity', 'Microsoft'),
      makeSecurity('NVDA US Equity', 'NVIDIA'),
      makeSector('Technology'),
      makeHolder('Vanguard', 8.4),
      makeNews(`${base} supply chain update`, 'BBG'),
    ];
  }
  if (entity.kind === 'FIELD') {
    const f = (entity.payload as { fieldName: string }).fieldName;
    return [makeField(f), makeFunction('FLD', 'Field Catalog'), makeFunction('LINE', 'Lineage'), makeFunction('MAP', 'Mapping')];
  }
  if (entity.kind === 'NEWS') {
    return [makeFunction('TOP', 'Top News'), makeFunction('NREL', 'Narrative Graph'), makeSecurity('SPY US Equity', 'SPDR S&P 500')];
  }
  if (entity.kind === 'HOLDER') {
    return [makeFunction('OWN', 'Ownership'), makeSecurity('AAPL US Equity', 'Apple'), makeSecurity('MSFT US Equity', 'Microsoft')];
  }
  if (entity.kind === 'SECTOR' || entity.kind === 'INDUSTRY') {
    const name = (entity.payload as { name: string }).name;
    return [makeSector(name), makeFunction('IMAP', 'Heatmap'), makeFunction('RELS', 'Relationships'), makeSecurity('XLK US Equity', 'Technology ETF')];
  }
  return [makeFunction('DES', 'Description'), makeFunction('TOP', 'Top News'), makeSecurity('SPX Index', 'S&P 500')];
}

function evidenceRows(entity: EntityRef): Array<{ id: string; summary: string; score: string; source: string; entity: EntityRef }> {
  const seed = h(entity.id + entity.kind);
  const rows = [
    { id: 'ev1', summary: 'Ownership concentration shift vs 13F trend', score: `${65 + (seed % 30)}`, source: 'SIMULATED', entity: makeFunction('OWN', 'Ownership') },
    { id: 'ev2', summary: 'News-topic cluster intensity over 5 sessions', score: `${55 + (seed % 35)}`, source: 'SIMULATED', entity: makeFunction('NINT', 'News Intensity') },
    { id: 'ev3', summary: 'Cross-asset beta linkage confidence', score: `${50 + (seed % 40)}`, source: 'SIMULATED', entity: makeFunction('BETA.X', 'Cross Asset Beta') },
    { id: 'ev4', summary: 'Peer dispersion regime agreement', score: `${52 + (seed % 37)}`, source: 'SIMULATED', entity: makeFunction('RELG', 'Relationship Graph') },
  ];
  return rows;
}

export function TerminalInspector() {
  const { inspector, closeInspector, pinInspector, drill, inspectorBack, inspectorForward } = useDrill();
  const [anchor, setAnchor] = React.useState<{ right: number; top: number; bottom: number } | null>(null);

  React.useEffect(() => {
    if (!inspector.open) return;
    const update = () => {
      const el = document.querySelector(`[data-panel-idx="${inspector.panelIdx}"]`) as HTMLElement | null;
      if (!el) {
        setAnchor(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setAnchor({
        right: Math.max(0, window.innerWidth - r.right),
        top: Math.max(0, r.top),
        bottom: Math.max(16, window.innerHeight - r.bottom + 16),
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [inspector.panelIdx, inspector.open]);

  if (!inspector.open || !inspector.entity) return null;

  const entity = inspector.entity;
  const fields = buildEntityFields(entity);
  const safeFields = fields.length > 0 ? fields : [
    { label: 'DISPLAY', value: entity.display, entity: makeField('DISPLAY') },
    { label: 'TYPE', value: entity.kind, entity: makeField('TYPE') },
    { label: 'PROVENANCE', value: 'SIMULATED', entity: makeField('PROVENANCE') },
  ];
  const relFns = relatedFunctions(entity);
  const relEntities = relatedEntities(entity);
  const evidence = evidenceRows(entity);

  // Get the security symbol from entity payload for passing to function drills
  const getEntitySym = (): string | undefined => {
    const p = entity.payload as unknown as Record<string, unknown>;
    if (typeof p['sym'] === 'string') return p['sym'];
    if (typeof p['pair'] === 'string') return p['pair'];
    return undefined;
  };

  const provenance = safeFields.find((f) => f.label === 'PROVENANCE')?.value ?? (entity.kind === 'NEWS' ? 'LIVE' : 'SIM');
  const nowTime = new Date().toISOString().slice(11, 19) + ' UTC';

  return (
    <div
      className="fixed z-50"
      style={{
        right: anchor?.right ?? 0, top: anchor?.top ?? 0, bottom: anchor?.bottom ?? 16, width: 280,
        background: '#050505',
        border: `1px solid ${DENSITY.borderColor}`,
        borderRight: 'none',
        fontFamily: DENSITY.fontFamily,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ minHeight: DENSITY.panelHeaderHeightPx, background: DENSITY.bgHeader, padding: `0 ${DENSITY.pad4}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, textTransform: 'uppercase' }}>
          INSPECT — {entity.kind} [{inspector.historyIdx + 1}/{Math.max(1, inspector.history.length)}]
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={inspectorBack} style={{ color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }} title="Back">◀</button>
          <button type="button" onClick={inspectorForward} style={{ color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }} title="Forward">▶</button>
          <button
            type="button"
            onClick={() => pinInspector(!inspector.pinned)}
            style={{ color: inspector.pinned ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
            title="Pin inspector open"
          >
            {inspector.pinned ? '📌 PIN' : 'PIN'}
          </button>
          <button
            type="button"
            onClick={closeInspector}
            style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
          >✕</button>
        </div>
      </div>

      {/* Entity display */}
      <div style={{ padding: `${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}`, flexShrink: 0 }}>
        <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontWeight: 700, marginBottom: 1 }}>{entity.display}</div>
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{entity.kind}</span> <span>•</span> <StatusBadge label={String(provenance).toUpperCase()} variant={String(provenance).includes('LIVE') ? 'live' : String(provenance).includes('STALE') ? 'stale' : 'sim'} />
          <span>•</span>
          <span>{nowTime}</span>
        </div>
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            style={{ flex: 1, background: '#0a1a2a', color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.accentCyan}`, padding: '1px 4px', cursor: 'pointer' }}
            onClick={() => drill(entity, 'OPEN_IN_PLACE', inspector.panelIdx)}
          >OPEN HERE</button>
          <button
            type="button"
            style={{ flex: 1, background: '#0a1a2a', color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.accentGreen}`, padding: '1px 4px', cursor: 'pointer' }}
            onClick={() => drill(entity, 'OPEN_IN_NEW_PANE', inspector.panelIdx)}
          >SEND TO PANE</button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="terminal-scrollbar">
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, padding: `2px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>FIELDS</div>
        {safeFields.map((f, i) => (
          <div
            key={`${f.label}-${i}`}
            className="flex items-center cursor-pointer hover:bg-[#0a1520]"
            style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, background: i % 2 === 1 ? '#060606' : DENSITY.bgBase }}
            onClick={() => {
              const target = f.entity ?? makeField(f.label, f.value);
              drill(target, 'OPEN_IN_PLACE', inspector.panelIdx);
            }}
            onContextMenu={(e) => {
              if (!f.entity) return;
              e.preventDefault();
              drill(f.entity, 'INSPECT_OVERLAY', inspector.panelIdx);
            }}
          >
            <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, width: 90, flexShrink: 0, textTransform: 'uppercase' }}>{f.label}</span>
            {f.entity ? (
              <button
                type="button"
                className="truncate text-left hover:underline"
                style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeDefault, background: 'none', border: 'none', cursor: 'pointer', flex: 1, padding: 0 }}
                title="Click: open | Shift+Click: send to pane | Alt+Click: inspect"
                onClick={(e) => {
                  e.stopPropagation();
                  const intent = e.shiftKey ? 'OPEN_IN_NEW_PANE' as const : e.altKey ? 'INSPECT_OVERLAY' as const : 'OPEN_IN_PLACE' as const;
                  drill(f.entity!, intent, inspector.panelIdx);
                }}
              >{f.value}</button>
            ) : (
              f.label === 'PROVENANCE' ? (
                <span style={{ flex: 1 }}>
                  <StatusBadge
                    label={f.value}
                    variant={String(f.value).includes('LIVE') ? 'live' : String(f.value).includes('STALE') ? 'stale' : 'sim'}
                  />
                </span>
              ) : (
                <span className="truncate tabular-nums" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, flex: 1 }}>{f.value}</span>
              )
            )}
          </div>
        ))}

        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, padding: `2px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>RELATED ENTITIES</div>
        {relEntities.map((re, i) => (
          <div
            key={`${re.kind}-${re.id}-${i}`}
            className="flex items-center cursor-pointer hover:bg-[#0a1520]"
            style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, background: i % 2 === 1 ? '#060606' : DENSITY.bgBase }}
            onClick={(e) => drill(re, e.shiftKey ? 'OPEN_IN_NEW_PANE' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE', inspector.panelIdx)}
          >
            <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, width: 72, textTransform: 'uppercase' }}>{re.kind}</span>
            <span className="truncate" style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeDefault, flex: 1 }}>{re.display}</span>
          </div>
        ))}

        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, padding: `2px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>EVIDENCE (SIMULATED WHEN MISSING)</div>
        {evidence.map((ev, i) => (
          <div
            key={ev.id}
            className="cursor-pointer hover:bg-[#0a1520]"
            style={{ borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, background: i % 2 === 1 ? '#060606' : DENSITY.bgBase }}
            onClick={(e) => drill(ev.entity, e.shiftKey ? 'OPEN_IN_NEW_PANE' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE', inspector.panelIdx)}
          >
            <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny }}>{ev.summary}</div>
            <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }} className="tabular-nums">Score {ev.score} • {ev.source}</div>
          </div>
        ))}
      </div>

      {/* Related functions */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${DENSITY.borderColor}`, padding: DENSITY.pad4 }}>
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, marginBottom: 3 }}>RELATED FUNCTIONS</div>
        <div className="flex flex-wrap gap-1">
          {relFns.map((fn) => (
            <button
              key={fn}
              type="button"
              style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.borderColor}`, padding: '0 3px', background: '#111', cursor: 'pointer' }}
              onClick={() => {
                const sym = getEntitySym();
                if (sym) drill(makeSecurity(sym), 'OPEN_IN_PLACE', inspector.panelIdx);
                drill(makeFunction(fn, MNEMONIC_DEFS[fn]?.title), 'OPEN_IN_PLACE', inspector.panelIdx);
              }}
            >{fn}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
