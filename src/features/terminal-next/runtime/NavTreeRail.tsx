'use client';

/**
 * NavTreeRail — Persistent dockable left-rail navigation tree.
 * 6,000+ mnemonics, virtualised, full-text fuzzy search, keyboard nav,
 * taxonomy tree (AssetClass → FunctionType → Scope → Mnemonics),
 * Favorites / Recents / Pinned / MySet persistence.
 */

import React, {
  useState, useMemo, useCallback, useEffect, useRef,
  startTransition,
} from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import {
  listCatalogMnemonics,
  type CatalogMnemonic,
  type MnemonicCategory,
} from '../mnemonics/catalog';
import { setDockLayout } from './dockLayoutStore';

// ── storage helpers ────────────────────────────────────────────────────────
const LS = {
  get(key: string): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]; }
    catch { return []; }
  },
  set(key: string, items: string[]): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(key, JSON.stringify(items.slice(0, 200))); }
    catch {}
  },
  prepend(key: string, code: string): void {
    const cur = LS.get(key).filter((c) => c !== code);
    LS.set(key, [code, ...cur]);
  },
  toggle(key: string, code: string): boolean {
    const cur = LS.get(key);
    const next = cur.includes(code) ? cur.filter((c) => c !== code) : [code, ...cur];
    LS.set(key, next);
    return !cur.includes(code);
  },
};

const FAV_KEY     = 'mm_fn_favorites';
const PIN_KEY     = 'mm_fn_pinned';
const RECENT_KEY  = 'mm_fn_recent';
const MYSET_KEY   = 'mm_fn_myset';

// ── fuzzy match (char-prefix match so "wev" matches "WEI") ─────────────────
function fuzzyScore(code: string, title: string, keywords: string[], q: string): number {
  const qU = q.toUpperCase();
  if (code === qU) return 200;
  if (code.startsWith(qU)) return 150;
  if (title.toUpperCase().startsWith(qU)) return 100;
  if (title.toUpperCase().includes(qU)) return 70;
  const hay = `${keywords.join(' ')}`.toUpperCase();
  if (hay.includes(qU)) return 40;
  // char-sequence fuzzy
  let j = 0;
  for (let i = 0; i < code.length && j < qU.length; i++) {
    if (code[i] === qU[j]) j++;
  }
  if (j === qU.length && qU.length >= 2) return 20;
  return 0;
}

// ── Category labels ─────────────────────────────────────────────────────────
const CAT_LABELS: Record<MnemonicCategory, string> = {
  EQUITY:     'Equity',
  FX:         'FX',
  RATES:      'Rates',
  CREDIT:     'Credit',
  DERIVS:     'Derivatives',
  MACRO:      'Macro',
  PORTFOLIO:  'Portfolio',
  NEWS_DOCS:  'News & Docs',
  OPS_ADMIN:  'Ops & Admin',
};

const CAT_COLORS: Record<MnemonicCategory, string> = {
  EQUITY:     '#f5a623',
  FX:         '#4dbdff',
  RATES:      '#3dd68c',
  CREDIT:     '#f07830',
  DERIVS:     '#c77dff',
  MACRO:      '#f25373',
  PORTFOLIO:  '#4dbdff',
  NEWS_DOCS:  '#3dd68c',
  OPS_ADMIN:  '#8ba8c4',
};

const FTYPE_SHORT: Record<string, string> = {
  REFERENCE: 'REF', MONITOR: 'MON', SCREENER: 'SCR', ANALYTICS: 'ANA',
  CHART: 'CHT', EVENT: 'EVT', WORKFLOW: 'WFL', ADMIN: 'ADM',
};

// ── Virtual row list ────────────────────────────────────────────────────────
const ROW_H = 22;
const OVERSCAN = 15;

interface VirtualListProps {
  items: CatalogMnemonic[];
  height: number;
  selectedIdx: number;
  onSelect: (idx: number) => void;
  renderItem: (item: CatalogMnemonic, idx: number, isSelected: boolean) => React.ReactNode;
  selectedRef: React.RefObject<HTMLDivElement | null>;
}

function VirtualList({ items, height, selectedIdx, onSelect, renderItem, selectedRef }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalH = items.length * ROW_H;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + height) / ROW_H) + OVERSCAN);
  const visible = items.slice(startIdx, endIdx);

  // scroll selected into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const itemTop = selectedIdx * ROW_H;
    const itemBot = itemTop + ROW_H;
    if (itemTop < el.scrollTop) el.scrollTop = itemTop;
    else if (itemBot > el.scrollTop + height) el.scrollTop = itemBot - height;
  }, [selectedIdx, height]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto terminal-scrollbar"
      style={{ height, overflowX: 'hidden' }}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: totalH, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIdx * ROW_H, left: 0, right: 0 }}>
          {visible.map((item, i) => {
            const realIdx = startIdx + i;
            const isSelected = realIdx === selectedIdx;
            return (
              <div
                key={item.code}
                ref={isSelected ? (selectedRef as React.RefObject<HTMLDivElement>) : undefined}
                onClick={() => onSelect(realIdx)}
                style={{ height: ROW_H, cursor: 'pointer' }}
              >
                {renderItem(item, realIdx, isSelected)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Security picker (compact inline) ───────────────────────────────────────
const QUICK_SECURITIES = [
  'AAPL US Equity', 'MSFT US Equity', 'NVDA US Equity', 'GOOGL US Equity',
  'AMZN US Equity', 'META US Equity', 'TSLA US Equity', 'JPM US Equity',
  'SPX Index', 'EURUSD Curncy', 'CL1 Comdty', 'GC1 Comdty',
];

function SecurityPicker({
  onPick, onCancel,
}: { onPick: (sec: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const suggestions = val.trim()
    ? QUICK_SECURITIES.filter((s) => s.toUpperCase().includes(val.toUpperCase()))
    : QUICK_SECURITIES;

  return (
    <div style={{
      position: 'absolute', left: 220, top: 60, zIndex: 200, width: 280,
      background: DENSITY.bgSurfaceAlt, border: `1px solid ${DENSITY.borderColor}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
    }}>
      <div style={{ padding: '4px 8px', borderBottom: `1px solid ${DENSITY.gridlineColor}`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.accentAmber }}>
        Enter security to open with this function
      </div>
      <div style={{ padding: '4px 8px' }}>
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) onPick(val.trim()); }
            if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
          }}
          placeholder="AAPL US Equity or just AAPL"
          style={{
            width: '100%', background: DENSITY.bgBase,
            border: `1px solid ${DENSITY.borderColor}`,
            color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny,
            padding: '2px 4px', fontFamily: DENSITY.fontFamily,
          }}
        />
      </div>
      {suggestions.slice(0, 8).map((s) => (
        <button key={s} type="button"
          onClick={() => onPick(s)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '2px 8px', background: 'none', border: 'none',
            color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny,
            cursor: 'pointer', fontFamily: DENSITY.fontFamily,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = DENSITY.rowHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >{s}</button>
      ))}
      <div style={{ padding: '2px 8px', borderTop: `1px solid ${DENSITY.gridlineColor}`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textDim }}>
        Enter to confirm · Esc to cancel
      </div>
    </div>
  );
}

// ── Taxonomy tree sidebar (collapsed groups) ────────────────────────────────
type ViewMode = 'flat' | 'tree';
type FocusMode = 'ALL' | 'FAV' | 'RECENT' | 'PINNED' | 'MYSET';

// ── Main NavTreeRail ────────────────────────────────────────────────────────
export function NavTreeRail() {
  const { navigatePanel, focusedPanel, panels, addPanel } = useTerminalOS();
  const activePanel = panels[focusedPanel];

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | MnemonicCategory>('ALL');
  const [focusMode, setFocusMode] = useState<FocusMode>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [secPicker, setSecPicker] = useState<{ code: string; title: string } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [favs, setFavs] = useState<Set<string>>(() => new Set(LS.get(FAV_KEY)));
  const [pinned, setPinned] = useState<Set<string>>(() => new Set(LS.get(PIN_KEY)));
  const [mySet, setMySet] = useState<Set<string>>(() => new Set(LS.get(MYSET_KEY)));
  const [recents, setRecents] = useState<string[]>(() => LS.get(RECENT_KEY));
  const [containerH, setContainerH] = useState(600);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const ALL_MNEMONICS = useMemo(() => listCatalogMnemonics(), []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => setDebouncedQ(q));
    }, 80);
    return () => clearTimeout(t);
  }, [q]);

  // measure container
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setContainerH(h);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // filtered + sorted list
  const items = useMemo<CatalogMnemonic[]>(() => {
    const qStr = debouncedQ.trim();
    const recentSet = new Set(recents);

    let pool = ALL_MNEMONICS;

    // focus mode filter
    if (focusMode === 'FAV')    pool = pool.filter((m) => favs.has(m.code));
    if (focusMode === 'PINNED') pool = pool.filter((m) => pinned.has(m.code));
    if (focusMode === 'RECENT') pool = pool.filter((m) => recentSet.has(m.code));
    if (focusMode === 'MYSET')  pool = pool.filter((m) => mySet.has(m.code));

    // category filter
    if (catFilter !== 'ALL') pool = pool.filter((m) => m.category === catFilter);

    // search / score
    if (qStr) {
      const scored: Array<{ m: CatalogMnemonic; score: number }> = [];
      for (const m of pool) {
        const s = fuzzyScore(m.code, m.title, m.keywords, qStr);
        if (s > 0) scored.push({ m, score: s });
      }
      return scored.sort((a, b) => b.score - a.score).map((x) => x.m);
    }

    // default sort: recent → pinned → favs → alpha
    return [...pool].sort((a, b) => {
      const ra = recents.indexOf(a.code);
      const rb = recents.indexOf(b.code);
      const scoreA = (ra >= 0 ? 50 - ra : 0) + (favs.has(a.code) ? 15 : 0) + (pinned.has(a.code) ? 10 : 0);
      const scoreB = (rb >= 0 ? 50 - rb : 0) + (favs.has(b.code) ? 15 : 0) + (pinned.has(b.code) ? 10 : 0);
      return scoreB - scoreA || a.code.localeCompare(b.code);
    });
  }, [debouncedQ, catFilter, focusMode, favs, pinned, mySet, recents, ALL_MNEMONICS]);

  // reset selection on list change
  useEffect(() => { setSelectedIdx(0); }, [items.length, debouncedQ, catFilter, focusMode]);

  // tree groups (only used in tree mode)
  const treeGroups = useMemo(() => {
    if (viewMode !== 'tree') return [];
    const groups = new Map<string, CatalogMnemonic[]>();
    for (const m of items) {
      const key = m.category;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return Array.from(groups.entries());
  }, [items, viewMode]);

  // ── launch a mnemonic ──────────────────────────────────────────────────────
  const launch = useCallback((m: CatalogMnemonic, intent: 'current' | 'new' | 'help') => {
    const currentSec = activePanel?.activeSecurity ?? '';
    const needsSec = m.requiresSecurity && !currentSec;

    if (intent === 'help') {
      navigatePanel(focusedPanel, 'TUTOR');
      return;
    }

    if (needsSec) {
      setSecPicker({ code: m.code, title: m.title });
      return;
    }

    // record recent
    LS.prepend(RECENT_KEY, m.code);
    setRecents(LS.get(RECENT_KEY));

    if (intent === 'new') {
      const next = addPanel(focusedPanel);
      navigatePanel(next, m.code, currentSec);
    } else {
      navigatePanel(focusedPanel, m.code, currentSec);
    }
  }, [focusedPanel, activePanel, navigatePanel, addPanel]);

  const launchByIdx = useCallback((idx: number, intent: 'current' | 'new' | 'help') => {
    const m = items[idx];
    if (m) launch(m, intent);
  }, [items, launch]);

  // ── keyboard navigation ────────────────────────────────────────────────────
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      launchByIdx(selectedIdx, 'current');
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      launchByIdx(selectedIdx, 'new');
    } else if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      launchByIdx(selectedIdx, 'help');
    } else if (e.key === 'Escape') {
      setQ('');
    } else if (e.key === 'f' && e.ctrlKey) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, [items.length, selectedIdx, launchByIdx]);

  // ── toggle helpers ─────────────────────────────────────────────────────────
  const toggleFav = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const added = LS.toggle(FAV_KEY, code);
    setFavs(new Set(LS.get(FAV_KEY)));
    return added;
  }, []);

  const togglePin = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    LS.toggle(PIN_KEY, code);
    setPinned(new Set(LS.get(PIN_KEY)));
  }, []);

  const toggleMySet = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    LS.toggle(MYSET_KEY, code);
    setMySet(new Set(LS.get(MYSET_KEY)));
  }, []);

  // ── render one row ─────────────────────────────────────────────────────────
  const renderItem = useCallback((m: CatalogMnemonic, _idx: number, isSelected: boolean) => {
    const catColor = CAT_COLORS[m.category] ?? DENSITY.textDim;
    const isFav    = favs.has(m.code);
    const isPinned = pinned.has(m.code);
    const isInSet  = mySet.has(m.code);
    const bgColor  = isSelected ? DENSITY.rowSelectedBg : 'transparent';
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', height: ROW_H,
          padding: '0 6px', background: bgColor,
          borderLeft: isSelected ? `2px solid ${DENSITY.rowSelectedMarker}` : '2px solid transparent',
          gap: 4,
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = DENSITY.rowHover; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = bgColor; }}
      >
        {/* code badge */}
        <span style={{
          minWidth: 56, fontWeight: 700, fontSize: '10px',
          color: catColor, fontFamily: DENSITY.fontFamily,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{m.code}</span>

        {/* title */}
        <span style={{
          flex: 1, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: DENSITY.fontFamily,
        }} title={m.title}>{m.title}</span>

        {/* type badge */}
        <span style={{
          fontSize: '9px', color: DENSITY.textDim, flexShrink: 0,
          fontFamily: DENSITY.fontFamily,
        }}>{FTYPE_SHORT[m.functionType] ?? m.functionType.slice(0,3)}</span>

        {/* quick action icons */}
        <button type="button"
          title="Favorite"
          onClick={(e) => toggleFav(m.code, e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', fontSize: '10px', color: isFav ? '#FFD700' : DENSITY.textDim, flexShrink: 0 }}
        >★</button>
        <button type="button"
          title={isPinned ? 'Unpin' : 'Pin'}
          onClick={(e) => togglePin(m.code, e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', fontSize: '10px', color: isPinned ? DENSITY.accentCyan : DENSITY.textDim, flexShrink: 0 }}
        >📌</button>
        <button type="button"
          title={isInSet ? 'Remove from My Set' : 'Add to My Set'}
          onClick={(e) => toggleMySet(m.code, e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', fontSize: '10px', color: isInSet ? DENSITY.accentGreen : DENSITY.textDim, flexShrink: 0 }}
        >⊕</button>
      </div>
    );
  }, [favs, pinned, mySet, toggleFav, togglePin, toggleMySet]);

  // ── tab bar pills ──────────────────────────────────────────────────────────
  const TAB_PILL = (mode: FocusMode, label: string, count?: number) => (
    <button key={mode} type="button"
      onClick={() => setFocusMode(mode)}
      style={{
        fontSize: '9px', padding: '1px 5px', cursor: 'pointer',
        border: `1px solid ${focusMode === mode ? DENSITY.accentAmber : DENSITY.borderColor}`,
        background: focusMode === mode ? DENSITY.rowSelectedBg : 'transparent',
        color: focusMode === mode ? DENSITY.accentAmber : DENSITY.textDim,
        fontFamily: DENSITY.fontFamily, flexShrink: 0,
      }}
    >
      {label}{count !== undefined ? ` ${count}` : ''}
    </button>
  );

  // ── security picker callback ───────────────────────────────────────────────
  const onSecurityPick = useCallback((sec: string) => {
    if (!secPicker) return;
    LS.prepend(RECENT_KEY, secPicker.code);
    setRecents(LS.get(RECENT_KEY));
    navigatePanel(focusedPanel, secPicker.code, sec);
    setSecPicker(null);
  }, [secPicker, focusedPanel, navigatePanel]);

  const listH = Math.max(100, containerH - 90);

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden relative"
      style={{ background: DENSITY.bgSurface, fontFamily: DENSITY.fontFamily }}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '4px 6px 2px', background: DENSITY.bgSurfaceAlt,
        borderBottom: `1px solid ${DENSITY.borderColor}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <span style={{ color: DENSITY.accentAmber, fontSize: '11px', fontWeight: 700 }}>NAVTREE</span>
          <span style={{ color: DENSITY.textDim, fontSize: '9px', marginLeft: 2 }}>{items.length}/{ALL_MNEMONICS.length}</span>
          <button type="button"
            title="Close rail"
            onClick={() => setDockLayout({ navtreeVisible: false })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: DENSITY.textDim, cursor: 'pointer', fontSize: '11px' }}
          >✕</button>
        </div>

        {/* Search input */}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (↑↓ Enter Shift+Enter Alt+Enter)"
          style={{
            width: '100%', background: DENSITY.bgBase,
            border: `1px solid ${debouncedQ ? DENSITY.accentAmber : DENSITY.borderColor}`,
            color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny,
            padding: '2px 6px', fontFamily: DENSITY.fontFamily, outline: 'none',
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {/* ── Focus tabs ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 3, padding: '3px 6px', flexWrap: 'wrap',
        background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`,
        flexShrink: 0,
      }}>
        {TAB_PILL('ALL', 'All')}
        {TAB_PILL('FAV', '★', favs.size)}
        {TAB_PILL('RECENT', 'Recent', recents.length)}
        {TAB_PILL('PINNED', '📌', pinned.size)}
        {TAB_PILL('MYSET', 'MySet', mySet.size)}
      </div>

      {/* ── Category filter ────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 3, padding: '2px 6px', flexWrap: 'wrap',
        background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`,
        flexShrink: 0,
      }}>
        {(['ALL', ...Object.keys(CAT_LABELS)] as Array<'ALL' | MnemonicCategory>).map((c) => (
          <button key={c} type="button"
            onClick={() => setCatFilter(c)}
            style={{
              fontSize: '9px', padding: '1px 5px', cursor: 'pointer',
              border: `1px solid ${catFilter === c ? (CAT_COLORS[c as MnemonicCategory] ?? DENSITY.accentAmber) : DENSITY.borderColor}`,
              background: catFilter === c ? DENSITY.rowSelectedBg : 'transparent',
              color: catFilter === c ? (CAT_COLORS[c as MnemonicCategory] ?? DENSITY.accentAmber) : DENSITY.textDim,
              fontFamily: DENSITY.fontFamily, flexShrink: 0,
            }}
          >
            {c === 'ALL' ? 'All' : CAT_LABELS[c as MnemonicCategory] ?? c}
          </button>
        ))}
      </div>

      {/* ── View mode toggle ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '2px 6px',
        background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`,
        flexShrink: 0, alignItems: 'center',
      }}>
        <span style={{ fontSize: '9px', color: DENSITY.textDim }}>Ctrl+F focus · ↑↓ nav · Enter open</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['flat', 'tree'] as ViewMode[]).map((m) => (
            <button key={m} type="button"
              onClick={() => setViewMode(m)}
              style={{
                fontSize: '9px', padding: '1px 5px', cursor: 'pointer',
                border: `1px solid ${viewMode === m ? DENSITY.accentCyan : DENSITY.borderColor}`,
                background: viewMode === m ? DENSITY.rowSelectedBg : 'transparent',
                color: viewMode === m ? DENSITY.accentCyan : DENSITY.textDim,
                fontFamily: DENSITY.fontFamily,
              }}
            >{m}</button>
          ))}
        </div>
      </div>

      {/* ── List body ──────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 min-h-0">
        {items.length === 0 ? (
          <div style={{ padding: '12px 8px', color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>
            No functions match. Try clearing filters or broadening search.
          </div>
        ) : viewMode === 'flat' ? (
          <VirtualList
            items={items}
            height={listH}
            selectedIdx={selectedIdx}
            onSelect={(idx) => { setSelectedIdx(idx); launchByIdx(idx, 'current'); }}
            renderItem={renderItem}
            selectedRef={selectedRef}
          />
        ) : (
          <div className="overflow-auto terminal-scrollbar" style={{ height: listH }}>
            {treeGroups.map(([cat, catItems]) => {
              const isCol = collapsed.has(cat);
              return (
                <div key={cat}>
                  <button type="button"
                    onClick={() => setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat)) next.delete(cat); else next.add(cat);
                      return next;
                    })}
                    style={{
                      width: '100%', textAlign: 'left', padding: '3px 6px',
                      background: DENSITY.bgSurfaceAlt, border: 'none',
                      borderBottom: `1px solid ${DENSITY.gridlineColor}`, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{ color: CAT_COLORS[cat as MnemonicCategory] ?? DENSITY.accentAmber, fontSize: '10px', fontWeight: 700 }}>
                      {isCol ? '▶' : '▼'} {CAT_LABELS[cat as MnemonicCategory] ?? cat}
                    </span>
                    <span style={{ color: DENSITY.textDim, fontSize: '9px', marginLeft: 'auto' }}>{catItems.length}</span>
                  </button>
                  {!isCol && catItems.map((m, idx) => (
                    <div key={m.code}
                      onClick={() => launch(m, 'current')}
                      style={{ cursor: 'pointer' }}
                    >
                      {renderItem(m, idx, false)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Security picker overlay ────────────────────────────────── */}
      {secPicker && (
        <SecurityPicker
          onPick={onSecurityPick}
          onCancel={() => setSecPicker(null)}
        />
      )}

      {/* ── Bottom hint ────────────────────────────────────────────── */}
      <div style={{
        padding: '2px 6px', borderTop: `1px solid ${DENSITY.gridlineColor}`,
        background: DENSITY.bgSurfaceAlt, fontSize: '9px', color: DENSITY.textDim,
        flexShrink: 0,
      }}>
        Enter open · Shift+Enter new pane · Alt+Enter help · ★ fav · 📌 pin · ⊕ my set
      </div>
    </div>
  );
}

// ── NavTreePanel — full-panel version used by FnNAVTREE mnemonic ────────────
export function NavTreePanel({ panelIdx }: { panelIdx: number }) {
  const { navigatePanel, panels, addPanel } = useTerminalOS();
  const activePanel = panels[panelIdx];

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | MnemonicCategory>('ALL');
  const [focusMode, setFocusMode] = useState<FocusMode>('ALL');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [secPicker, setSecPicker] = useState<{ code: string } | null>(null);
  const [favs, setFavs] = useState<Set<string>>(() => new Set(LS.get(FAV_KEY)));
  const [pinned, setPinned] = useState<Set<string>>(() => new Set(LS.get(PIN_KEY)));
  const [mySet, setMySet] = useState<Set<string>>(() => new Set(LS.get(MYSET_KEY)));
  const [recents, setRecents] = useState<string[]>(() => LS.get(RECENT_KEY));
  const [containerH, setContainerH] = useState(500);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const ALL_MNEMONICS = useMemo(() => listCatalogMnemonics(), []);

  useEffect(() => {
    const t = setTimeout(() => { startTransition(() => setDebouncedQ(q)); }, 80);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setContainerH(h);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const items = useMemo<CatalogMnemonic[]>(() => {
    const qStr = debouncedQ.trim();
    const recentSet = new Set(recents);
    let pool = ALL_MNEMONICS;
    if (focusMode === 'FAV')    pool = pool.filter((m) => favs.has(m.code));
    if (focusMode === 'PINNED') pool = pool.filter((m) => pinned.has(m.code));
    if (focusMode === 'RECENT') pool = pool.filter((m) => recentSet.has(m.code));
    if (focusMode === 'MYSET')  pool = pool.filter((m) => mySet.has(m.code));
    if (catFilter !== 'ALL') pool = pool.filter((m) => m.category === catFilter);
    if (qStr) {
      const scored: Array<{ m: CatalogMnemonic; score: number }> = [];
      for (const m of pool) {
        const s = fuzzyScore(m.code, m.title, m.keywords, qStr);
        if (s > 0) scored.push({ m, score: s });
      }
      return scored.sort((a, b) => b.score - a.score).map((x) => x.m);
    }
    return [...pool].sort((a, b) => {
      const ra = recents.indexOf(a.code); const rb = recents.indexOf(b.code);
      const sa = (ra >= 0 ? 50-ra : 0)+(favs.has(a.code)?15:0)+(pinned.has(a.code)?10:0);
      const sb = (rb >= 0 ? 50-rb : 0)+(favs.has(b.code)?15:0)+(pinned.has(b.code)?10:0);
      return sb - sa || a.code.localeCompare(b.code);
    });
  }, [debouncedQ, catFilter, focusMode, favs, pinned, mySet, recents, ALL_MNEMONICS]);

  useEffect(() => { setSelectedIdx(0); }, [items.length, debouncedQ, catFilter, focusMode]);

  const launch = useCallback((m: CatalogMnemonic, intent: 'current' | 'new') => {
    const currentSec = activePanel?.activeSecurity ?? '';
    if (m.requiresSecurity && !currentSec) { setSecPicker({ code: m.code }); return; }
    LS.prepend(RECENT_KEY, m.code);
    setRecents(LS.get(RECENT_KEY));
    if (intent === 'new') { const next = addPanel(panelIdx); navigatePanel(next, m.code, currentSec); }
    else navigatePanel(panelIdx, m.code, currentSec);
  }, [panelIdx, activePanel, navigatePanel, addPanel]);

  const launchByIdx = useCallback((idx: number, intent: 'current' | 'new') => {
    const m = items[idx]; if (m) launch(m, intent);
  }, [items, launch]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i+1, items.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i-1, 0)); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); launchByIdx(selectedIdx, 'current'); }
    else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); launchByIdx(selectedIdx, 'new'); }
    else if (e.key === 'Escape') setQ('');
  }, [items.length, selectedIdx, launchByIdx]);

  const renderItem = useCallback((m: CatalogMnemonic, _idx: number, isSelected: boolean) => {
    const catColor = CAT_COLORS[m.category] ?? DENSITY.textDim;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', height: ROW_H, padding: '0 10px',
        background: isSelected ? DENSITY.rowSelectedBg : 'transparent',
        borderLeft: isSelected ? `2px solid ${DENSITY.rowSelectedMarker}` : '2px solid transparent',
        gap: 8,
      }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = DENSITY.rowHover; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ minWidth: 70, fontWeight: 700, fontSize: '11px', color: catColor, fontFamily: DENSITY.fontFamily }}>{m.code}</span>
        <span style={{ flex: 1, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: DENSITY.fontFamily }}>{m.title}</span>
        <span style={{ fontSize: '9px', color: DENSITY.textDim, fontFamily: DENSITY.fontFamily }}>{CAT_LABELS[m.category] ?? m.category}</span>
        <span style={{ fontSize: '9px', color: DENSITY.textDim, fontFamily: DENSITY.fontFamily }}>{FTYPE_SHORT[m.functionType] ?? m.functionType.slice(0,3)}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); LS.toggle(FAV_KEY, m.code); setFavs(new Set(LS.get(FAV_KEY))); }}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'10px', color: favs.has(m.code) ? '#FFD700' : DENSITY.textDim }}>★</button>
      </div>
    );
  }, [favs]);

  const listH = Math.max(100, containerH - 86);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }} onKeyDown={onKeyDown} tabIndex={-1}>
      <div style={{ padding: '4px 8px', borderBottom: `1px solid ${DENSITY.gridlineColor}`, flexShrink: 0 }}>
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${ALL_MNEMONICS.length.toLocaleString()} functions...`}
          style={{ width: '100%', background: DENSITY.bgBase, border: `1px solid ${debouncedQ ? DENSITY.accentAmber : DENSITY.borderColor}`, color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny, padding: '3px 6px', fontFamily: DENSITY.fontFamily, outline: 'none' }}
          onKeyDown={onKeyDown} />
      </div>
      <div style={{ display: 'flex', gap: 3, padding: '3px 8px', flexWrap: 'wrap', flexShrink: 0, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        {(['ALL','FAV','RECENT','PINNED','MYSET'] as FocusMode[]).map((m) => (
          <button key={m} type="button" onClick={() => setFocusMode(m)}
            style={{ fontSize: '9px', padding: '1px 6px', cursor: 'pointer', border: `1px solid ${focusMode===m ? DENSITY.accentAmber : DENSITY.borderColor}`, background: focusMode===m ? DENSITY.rowSelectedBg : 'transparent', color: focusMode===m ? DENSITY.accentAmber : DENSITY.textDim, fontFamily: DENSITY.fontFamily }}
          >{m}</button>
        ))}
        <span style={{ fontSize: '9px', color: DENSITY.textDim, marginLeft: 'auto', alignSelf: 'center' }}>{items.length.toLocaleString()} results</span>
      </div>
      <div style={{ display: 'flex', gap: 2, padding: '2px 8px', flexWrap: 'wrap', flexShrink: 0, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        {(['ALL', 'EQUITY', 'FX', 'RATES', 'CREDIT', 'DERIVS', 'MACRO', 'PORTFOLIO', 'NEWS_DOCS', 'OPS_ADMIN'] as const).map((c) => (
          <button key={c} type="button" onClick={() => setCatFilter(c)}
            style={{ fontSize: '9px', padding: '1px 5px', cursor: 'pointer', border: `1px solid ${catFilter===c ? (CAT_COLORS[c as MnemonicCategory] ?? DENSITY.accentAmber) : DENSITY.borderColor}`, background: catFilter===c ? DENSITY.rowSelectedBg : 'transparent', color: catFilter===c ? (CAT_COLORS[c as MnemonicCategory] ?? DENSITY.accentAmber) : DENSITY.textDim, fontFamily: DENSITY.fontFamily }}
          >{c === 'ALL' ? 'All' : CAT_LABELS[c as MnemonicCategory] ?? c}</button>
        ))}
      </div>
      <div ref={containerRef} className="flex-1 min-h-0">
        <VirtualList items={items} height={listH} selectedIdx={selectedIdx}
          onSelect={(idx) => { setSelectedIdx(idx); launchByIdx(idx, 'current'); }}
          renderItem={renderItem} selectedRef={selectedRef} />
      </div>
      {secPicker && (
        <SecurityPicker
          onPick={(sec) => { LS.prepend(RECENT_KEY, secPicker.code); setRecents(LS.get(RECENT_KEY)); navigatePanel(panelIdx, secPicker.code, sec); setSecPicker(null); }}
          onCancel={() => setSecPicker(null)}
        />
      )}
      <div style={{ padding: '2px 8px', borderTop: `1px solid ${DENSITY.gridlineColor}`, fontSize: '9px', color: DENSITY.textDim, flexShrink: 0 }}>
        ↑↓ navigate · Enter open · Shift+Enter new pane · ★ favorite
      </div>
    </div>
  );
}
