'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { MNEMONIC_DEFS } from './MnemonicRegistry';
import { makeField, makeFunction, makeMonitor, makeNews, makeSecurity, makeWorkspace, type EntityRef } from './entities/types';
import { useDrill } from './entities/DrillContext';
import { searchFieldDefs } from '../services/fieldCatalog';
import { loadMonitorList } from './monitorListStore';
import { listWorkspaces } from './workspaceManager';
import { listCatalogMnemonics, searchMnemonicCatalog, type MnemonicCategory } from '../mnemonics/catalog';

const SECURITIES = [
  { sym: 'AAPL US Equity', name: 'Apple Inc', sector: 'EQUITY', desc: 'Consumer hardware + services ecosystem' },
  { sym: 'MSFT US Equity', name: 'Microsoft Corp', sector: 'EQUITY', desc: 'Enterprise cloud + productivity leader' },
  { sym: 'NVDA US Equity', name: 'NVIDIA Corp', sector: 'EQUITY', desc: 'Semiconductor + AI computing platform' },
  { sym: 'GOOGL US Equity', name: 'Alphabet Inc', sector: 'EQUITY', desc: 'Search, cloud, advertising conglomerate' },
  { sym: 'AMZN US Equity', name: 'Amazon.com', sector: 'EQUITY', desc: 'E-commerce + cloud (AWS) leader' },
  { sym: 'META US Equity', name: 'Meta Platforms', sector: 'EQUITY', desc: 'Social media + AR/VR investments' },
  { sym: 'TSLA US Equity', name: 'Tesla Inc', sector: 'EQUITY', desc: 'EV manufacturer + energy storage' },
  { sym: 'JPM US Equity', name: 'JPMorgan Chase', sector: 'EQUITY', desc: 'Largest US bank by assets' },
  { sym: 'BAC US Equity', name: 'Bank of America', sector: 'EQUITY', desc: 'Consumer + investment banking' },
  { sym: 'GS US Equity', name: 'Goldman Sachs', sector: 'EQUITY', desc: 'Investment bank + asset management' },
  { sym: 'XOM US Equity', name: 'ExxonMobil Corp', sector: 'EQUITY', desc: 'Integrated oil and gas major' },
  { sym: 'CVX US Equity', name: 'Chevron Corp', sector: 'EQUITY', desc: 'Global energy company' },
  { sym: 'WMT US Equity', name: 'Walmart Inc', sector: 'EQUITY', desc: 'World\'s largest retailer' },
  { sym: 'IBM US Equity', name: 'IBM Corp', sector: 'EQUITY', desc: 'Enterprise IT services and cloud' },
  { sym: 'INTC US Equity', name: 'Intel Corp', sector: 'EQUITY', desc: 'Semiconductor manufacturer' },
  { sym: 'AMD US Equity', name: 'AMD Inc', sector: 'EQUITY', desc: 'CPU and GPU semiconductor' },
  { sym: 'SPX Index', name: 'S&P 500', sector: 'INDEX', desc: 'US large-cap equity benchmark' },
  { sym: 'INDU Index', name: 'Dow Jones 30', sector: 'INDEX', desc: 'US price-weighted blue chip index' },
  { sym: 'CCMP Index', name: 'NASDAQ Composite', sector: 'INDEX', desc: 'US tech-heavy composite index' },
  { sym: 'EURUSD Curncy', name: 'EUR/USD', sector: 'CURNCY', desc: 'Euro vs US Dollar spot rate' },
  { sym: 'GBPUSD Curncy', name: 'GBP/USD', sector: 'CURNCY', desc: 'Sterling vs US Dollar spot rate' },
  { sym: 'USDJPY Curncy', name: 'USD/JPY', sector: 'CURNCY', desc: 'US Dollar vs Japanese Yen' },
  { sym: 'CL1 Comdty', name: 'WTI Crude Oil', sector: 'COMDTY', desc: 'Front-month crude oil futures' },
  { sym: 'GC1 Comdty', name: 'Gold Futures', sector: 'COMDTY', desc: 'Front-month gold futures' },
  { sym: 'AAPL 2.5 05/25', name: 'Apple 2.5% 05/2025', sector: 'CORP', desc: 'Apple Inc investment-grade bond' },
  { sym: 'T US Corp', name: 'AT&T 4.5 2030', sector: 'CORP', desc: 'AT&T Inc corporate bond' },
];

type ResultKind = 'security' | 'function' | 'field' | 'monitor' | 'workspace' | 'news';
interface ResultItem {
  kind: ResultKind;
  code: string;
  label: string;
  sub: string;
  score: number;
  entity: EntityRef;
}

const GROUP_ORDER: ResultKind[] = ['function', 'security', 'field', 'monitor', 'workspace', 'news'];
const GROUP_LABEL: Record<ResultKind, string> = {
  function: 'FUNCTIONS',
  security: 'SECURITIES',
  field: 'FIELDS',
  monitor: 'MONITORS',
  workspace: 'WORKSPACES',
  news: 'NEWS',
};

function rank(text: string, q: string): number {
  const t = text.toUpperCase();
  if (t === q) return 120;
  if (t.startsWith(q)) return 90;
  if (t.includes(` ${q}`)) return 70;
  if (t.includes(q)) return 50;
  return 0;
}

function loadCodeSet(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v).toUpperCase()).slice(0, 40);
  } catch {
    return [];
  }
}

function saveCodeSet(key: string, items: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(0, 80)));
  } catch {
    // noop
  }
}

function prependCodeSet(key: string, code: string): void {
  const next = [code.toUpperCase(), ...loadCodeSet(key).filter((x) => x !== code.toUpperCase())];
  saveCodeSet(key, next);
}

export function HLSearchOverlay({ panelIdx }: { panelIdx: number }) {
  const { dispatchPanel, panels } = useTerminalOS();
  const { drill } = useDrill();
  const p = panels[panelIdx]!;
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MnemonicCategory>('ALL');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toUpperCase();
    if (!q) {
      const favorites = loadCodeSet('mm_fn_favorites');
      const pinned = loadCodeSet('mm_fn_pinned');
      const recent = loadCodeSet('mm_fn_recent');
      const catalogByCode = new Map(listCatalogMnemonics().map((m) => [m.code, m]));
      const seeded = [...favorites, ...pinned, ...recent, 'FCAT', ...Object.values(MNEMONIC_DEFS).slice(0, 20).map((m) => m.code)];
      const topFns = Array.from(new Set(seeded)).slice(0, 20).map((code, i) => {
        const m = MNEMONIC_DEFS[code];
        const c = catalogByCode.get(code);
        return ({
        kind: 'function' as const,
        code: m?.code ?? code,
        label: m?.code ?? code,
        sub: c ? `${c.title} • ${c.category}/${c.functionType}/${c.scope}` : (m?.title ?? 'Function'),
        score: 100 - i,
        entity: makeFunction(m?.code ?? code, m?.title ?? c?.title ?? code),
      });
      });
      const topSecs = SECURITIES.slice(0, 10).map((s, i) => ({
        kind: 'security' as const,
        code: s.sym,
        label: s.sym,
        sub: `${s.name} — ${s.desc}`,
        score: 95 - i,
        entity: makeSecurity(s.sym, s.name),
      }));
      const topFields = searchFieldDefs('').slice(0, 8).map((f, i) => ({
        kind: 'field' as const,
        code: f.id,
        label: f.id,
        sub: `${f.label} • ${f.definition}`,
        score: 90 - i,
        entity: makeField(f.id),
      }));
      return [...topFns, ...topSecs, ...topFields];
    }

    const catalogFn = searchMnemonicCatalog(query, categoryFilter === 'ALL' ? undefined : categoryFilter);
    const catalogSet = new Set(catalogFn.map((m) => m.code));
    const coreFn = Object.values(MNEMONIC_DEFS)
      .filter((m) =>
        `${m.code} ${m.title} ${m.relatedCodes.join(' ')}`.toUpperCase().includes(q),
      )
      .filter((m) => !catalogSet.has(m.code))
      .map((m) => ({
        code: m.code,
        title: m.title,
        keywords: m.relatedCodes,
        searchSynonyms: [] as string[],
      }));
    const fnRes: ResultItem[] = [...catalogFn, ...coreFn]
      .map((m) => ({
        kind: 'function' as const,
        code: m.code,
        label: m.code,
        sub: 'category' in m ? `${m.title} • ${(m as { category: string }).category} • ${(m as { functionType?: string }).functionType ?? ''} • ${m.keywords.slice(0, 3).join(', ')}` : `${m.title} • ${m.keywords.slice(0, 4).join(', ')}`,
        score: Math.max(rank(m.code, q), rank(m.title, q), rank(m.keywords.join(' '), q), rank(m.searchSynonyms.join(' '), q), rank(('category' in m ? String((m as { category: string }).category) : ''), q)),
        entity: makeFunction(m.code, m.title),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 28);

    const secRes: ResultItem[] = SECURITIES
      .map((s) => ({
        kind: 'security' as const,
        code: s.sym,
        label: s.sym,
        sub: `${s.name} • ${s.desc}`,
        score: Math.max(rank(s.sym, q), rank(s.name, q), rank(s.desc, q)),
        entity: makeSecurity(s.sym, s.name),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const fieldRes: ResultItem[] = searchFieldDefs(query)
      .slice(0, 20)
      .map((f) => ({
        kind: 'field' as const,
        code: f.id,
        label: f.id,
        sub: `${f.label} • ${f.definition} • ${f.availability.join('/')}`,
        score: Math.max(rank(f.id, q), rank(f.label, q), rank(f.definition, q)),
        entity: makeField(f.id),
      }));

    const monitorRes: ResultItem[] = loadMonitorList()
      .map((sym) => ({
        kind: 'monitor' as const,
        code: sym,
        label: sym,
        sub: 'Monitor member',
        score: rank(sym, q),
        entity: makeMonitor(sym, `MON:${sym}`, [sym]),
      }))
      .filter((r) => r.score > 0)
      .slice(0, 12);

    const workspaceRes: ResultItem[] = listWorkspaces()
      .map((ws) => ({
        kind: 'workspace' as const,
        code: ws.name,
        label: ws.name,
        sub: `${ws.panels.length} panes • ${new Date(ws.savedAt).toLocaleString()}`,
        score: rank(ws.name, q),
        entity: makeWorkspace(ws.name, ws.panels.length),
      }))
      .filter((r) => r.score > 0)
      .slice(0, 8);

    const newsTemplates = [
      `${p.activeSecurity.split(' ')[0]} dividend outlook revision`,
      `${p.activeSecurity.split(' ')[0]} ownership concentration update`,
      `${p.activeSecurity.split(' ')[0]} supply chain pressure signal`,
      'Fed policy language shifts risk assets',
      'Oil curve dislocation drives cross-asset repricing',
    ];
    const newsRes: ResultItem[] = newsTemplates
      .map((h, i) => ({
        kind: 'news' as const,
        code: `N${i + 1}`,
        label: h,
        sub: 'SIM headline',
        score: rank(h, q),
        entity: makeNews(h, 'BBG'),
      }))
      .filter((r) => r.score > 0)
      .slice(0, 10);

    return [...fnRes, ...secRes, ...fieldRes, ...monitorRes, ...workspaceRes, ...newsRes];
  }, [query, categoryFilter, p.activeSecurity]);

  const grouped = useMemo(() => {
    const groups = GROUP_ORDER.map((kind) => ({
      kind,
      items: results.filter((r) => r.kind === kind).slice(0, kind === 'security' ? 12 : 8),
    })).filter((g) => g.items.length > 0);
    const flat = groups.flatMap((g) => g.items);
    return { groups, flat };
  }, [results]);

  useEffect(() => { setCursor(0); }, [grouped.flat.length]);

  const select = useCallback((item: ResultItem, intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANE' | 'INSPECT_OVERLAY') => {
    if (item.kind === 'function') {
      prependCodeSet('mm_fn_recent', item.code);
      const pinned = loadCodeSet('mm_fn_pinned');
      if (pinned.includes(item.code)) prependCodeSet('mm_fn_pinned', item.code);
      const fav = loadCodeSet('mm_fn_favorites');
      if (fav.includes(item.code)) prependCodeSet('mm_fn_favorites', item.code);
    }
    drill(item.entity, intent, panelIdx);
    if (intent !== 'INSPECT_OVERLAY') dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' });
  }, [panelIdx, drill, dispatchPanel]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, grouped.flat.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); return; }
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); if (grouped.flat[cursor]) select(grouped.flat[cursor]!, 'INSPECT_OVERLAY'); return; }
    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); if (grouped.flat[cursor]) select(grouped.flat[cursor]!, 'OPEN_IN_NEW_PANE'); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (grouped.flat[cursor]) select(grouped.flat[cursor]!, 'OPEN_IN_PLACE'); return; }
  }, [panelIdx, dispatchPanel, grouped.flat, cursor, select]);

  return (
    <div className="absolute inset-0 z-40" style={{ background: '#000000e8', fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: DENSITY.pad4, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, marginBottom: 2 }}>HL — SECURITY / FUNCTION SEARCH</div>
        <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
          <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | MnemonicCategory)}
            style={{ background: DENSITY.panelBgAlt, border: `1px solid ${DENSITY.borderColor}`, color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny }}
          >
            {(['ALL', 'EQUITY', 'FX', 'RATES', 'CREDIT', 'DERIVS', 'MACRO', 'PORTFOLIO', 'NEWS_DOCS', 'OPS_ADMIN'] as const).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type security name, ticker, or function code..."
          className="w-full outline-none border-none bg-transparent"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, borderBottom: `1px solid ${DENSITY.borderColor}`, paddingBottom: 2 }}
          autoComplete="off"
        />
      </div>

      {/* Column headers */}
      <div className="grid" style={{ gridTemplateColumns: '34px 1fr 2fr 96px', padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textMuted, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span>T</span><span>CODE</span><span>DESCRIPTION</span><span>GROUP</span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
        {grouped.groups.map((group) => (
          <div key={group.kind}>
            <div style={{ height: 14, padding: `0 ${DENSITY.pad4}px`, color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: DENSITY.bgSurfaceAlt, display: 'flex', alignItems: 'center' }}>
              {GROUP_LABEL[group.kind]}
            </div>
            {group.items.map((item) => {
              const i = grouped.flat.findIndex((x) => x.code === item.code && x.kind === item.kind);
              const isCur = i === cursor;
              return (
                <div
                  key={`${item.kind}-${item.code}`}
                  className="grid cursor-pointer"
                  style={{
                    gridTemplateColumns: '34px 1fr 2fr 96px',
                    height: DENSITY.rowHeightPx + 2,
                    background: isCur ? '#1a2a3a' : i % 2 === 1 ? '#060606' : DENSITY.bgBase,
                    borderBottom: `1px solid ${DENSITY.gridlineColor}`,
                    alignItems: 'center',
                    padding: `0 ${DENSITY.pad4}px`,
                  }}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => select(item, 'OPEN_IN_PLACE')}
                >
                  <span style={{ fontSize: DENSITY.fontSizeTiny, color: item.kind === 'function' ? DENSITY.accentAmber : DENSITY.accentCyan }}>
                    {item.kind === 'function' ? 'fn' : item.kind === 'field' ? 'fld' : item.kind === 'monitor' ? 'mon' : item.kind === 'workspace' ? 'ws' : item.kind === 'news' ? 'n' : '→'}
                  </span>
                  <span style={{ fontSize: DENSITY.fontSizeDefault, color: DENSITY.textPrimary, fontWeight: 700 }}>
                    {item.label}
                  </span>
                  <span className="truncate" style={{ fontSize: DENSITY.fontSizeTiny, color: DENSITY.textDim }}>
                    {item.sub}
                  </span>
                  <span style={{ fontSize: DENSITY.fontSizeTiny, color: DENSITY.textMuted }}>
                    {GROUP_LABEL[item.kind]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        {grouped.flat.length === 0 && (
          <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>No results for "{query}"</div>
        )}
      </div>
      <div style={{ padding: `2px ${DENSITY.pad4}px`, color: DENSITY.textMuted, fontSize: '8px', borderTop: `1px solid ${DENSITY.gridlineColor}`, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        ↑↓ navigate  •  Enter open  •  Shift+Enter new pane  •  Alt+Enter inspect  •  Esc close
      </div>
    </div>
  );
}
