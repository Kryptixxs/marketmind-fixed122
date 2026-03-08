'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { getDockLayout, loadDockLayout, setDockLayout, setPanelFloating, subscribeDockLayout, type DockMode } from '../dockLayoutStore';
import { appendAuditEvent } from '../commandAuditStore';
import { listPinItems, removePinItem } from '../pinboardStore';
import { loadKeymapProfile, saveKeymapProfile } from '../keymapStore';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import { FIELD_CATALOG } from '../../services/fieldCatalog';
import { loadAlertRules, addAlertRule } from '../../services/alertMonitor';
import { loadMonitorList, saveMonitorList } from '../monitorListStore';
import { loadPolicyState, savePolicyState, checkPolicy } from '../policyStore';
import { isAllowedByRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';
import { useTerminalStore } from '../../store/TerminalStore';
import { listCatalogByTaxonomy, listCatalogMnemonics, type MnemonicCategory } from '../../mnemonics/catalog';

const LAYOUT_TEMPLATES = [
  { id: 'research', name: 'Research', mode: 'tile' as DockMode, columns: 2, mnemonics: ['DES', 'CN', 'GP', 'RELG'] },
  { id: 'execution', name: 'Execution', mode: 'stack' as DockMode, columns: 1, mnemonics: ['BLTR', 'ORD', 'ALRT', 'MON'] },
  { id: 'macro', name: 'Macro', mode: 'tile' as DockMode, columns: 3, mnemonics: ['WEI', 'ECO', 'GEO.M', 'XAS', 'REGI', 'NQ'] },
  { id: 'portfolio', name: 'Portfolio', mode: 'tile' as DockMode, columns: 2, mnemonics: ['PORT', 'RISK', 'SCEN', 'XDRV'] },
  { id: 'newsroom', name: 'Newsroom', mode: 'tab' as DockMode, columns: 1, mnemonics: ['TOP', 'NREL', 'NMAP', 'NTIM'] },
];

export function FnDOCK({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panelCount, addPanel, closePanel } = useTerminalOS();
  const [dock, setDock] = React.useState(() => loadDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);
  const rows = [
    { key: 'Mode', value: dock.mode },
    { key: 'Columns', value: String(dock.columns) },
    { key: 'Pane count', value: String(panelCount) },
    { key: 'Floating panes', value: String(dock.floatingPanels.length) },
    { key: 'Navtree', value: dock.navtreeVisible ? 'ON' : 'OFF' },
    { key: 'Pinbar', value: dock.pinbarVisible ? `ON (${dock.pinbarDock})` : 'OFF' },
    { key: 'Monitor mode', value: dock.twoUpMode ? '2-UP' : 'SINGLE' },
    { key: 'Density mode', value: dock.highDensityMode ? 'HIGH' : 'NORMAL' },
    { key: 'Live mode', value: dock.highDensityLiveMode ? 'ON' : 'OFF' },
    { key: 'Active workspace', value: dock.activeWorkspace.toUpperCase() },
  ];
  const cols: DenseColumn[] = [{ key: 'key', header: 'Setting', width: '160px' }, { key: 'value', header: 'Value', width: '1fr' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="DOCK • Dockable Workspace Layout Engine" right={<StatusBadge label={`${panelCount} PANES`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => setDockLayout({ mode: 'tile' })}>TILE</button>
        <button type="button" onClick={() => setDockLayout({ mode: 'tab' })}>TAB</button>
        <button type="button" onClick={() => setDockLayout({ mode: 'stack' })}>STACK</button>
        <button type="button" onClick={() => addPanel(panelIdx)}>ADD PANE</button>
        <button type="button" onClick={() => closePanel(panelIdx)}>CLOSE PANE</button>
        <button type="button" onClick={() => setDockLayout({ columns: Math.min(4, dock.columns + 1) })}>COL+</button>
        <button type="button" onClick={() => setDockLayout({ columns: Math.max(1, dock.columns - 1) })}>COL-</button>
        <button type="button" onClick={() => setDockLayout({ twoUpMode: !dock.twoUpMode })}>{dock.twoUpMode ? '1-UP' : '2-UP'}</button>
        <button type="button" onClick={() => setDockLayout({ highDensityMode: !dock.highDensityMode })}>{dock.highDensityMode ? 'DENSITY:NORMAL' : 'DENSITY:HIGH'}</button>
        <button type="button" onClick={() => setDockLayout({ highDensityLiveMode: !dock.highDensityLiveMode })}>{dock.highDensityLiveMode ? 'LIVE:OFF' : 'LIVE:ON'}</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="key" panelIdx={panelIdx} className="h-[170px]" />
      <EmptyFill hint="UNLIMITED PANE ENGINE ACTIVE: TILE/TAB/STACK + FLOAT + NAVTREE + PINBAR" />
    </div>
  );
}

export function FnFLOAT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, focusedPanel, navigatePanel } = useTerminalOS();
  const [dock, setDock] = React.useState(() => loadDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);
  const rows = panels.map((p, idx) => ({
    id: String(idx),
    pane: `P${idx + 1}`,
    mnemonic: p.activeMnemonic,
    security: p.activeSecurity,
    float: dock.floatingPanels.includes(idx) ? 'FLOATING' : 'DOCKED',
  }));
  const cols: DenseColumn[] = [
    { key: 'pane', header: 'Pane', width: '70px' },
    { key: 'mnemonic', header: 'Function', width: '90px' },
    { key: 'security', header: 'Security', width: '1fr' },
    { key: 'float', header: 'State', width: '90px' },
  ];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="FLOAT • Pop-out / Floating Pane Manager" right={<StatusBadge label={`${dock.floatingPanels.length} FLOAT`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => setPanelFloating(focusedPanel, true)}>FLOAT ACTIVE</button>
        <button type="button" onClick={() => setPanelFloating(focusedPanel, false)}>ATTACH ACTIVE</button>
        <button type="button" onClick={() => {
          const w = window.open(window.location.href, '_blank', 'width=1280,height=840');
          if (w) appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'FLOAT popout window', mnemonic: 'FLOAT' });
        }}>POP-OUT WINDOW</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => navigatePanel(Number(r.id), String(r.mnemonic), String(r.security))} />
    </div>
  );
}

export function FnLAYOUT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel } = useTerminalOS();
  const cols: DenseColumn[] = [
    { key: 'name', header: 'Template', width: '140px' },
    { key: 'mode', header: 'Mode', width: '70px' },
    { key: 'columns', header: 'Columns', width: '70px', align: 'right' },
    { key: 'mnemonics', header: 'Default Panes', width: '1fr' },
  ];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="LAYOUT • Templates + Constraints" right={<StatusBadge label="SIM" variant="sim" />} />
      <DenseTable
        columns={cols}
        rows={LAYOUT_TEMPLATES.map((t) => ({ ...t, mnemonics: t.mnemonics.join(' | ') }))}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        onRowClick={(r) => {
          const t = LAYOUT_TEMPLATES.find((x) => x.id === r.id);
          if (!t) return;
          setDockLayout({ mode: t.mode, columns: t.columns });
          t.mnemonics.forEach((m, idx) => navigatePanel(idx, m));
          appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `LAYOUT apply ${t.id}`, mnemonic: 'LAYOUT' });
        }}
      />
    </div>
  );
}

export function FnFOCUSPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const { focusedPanel, setFocusedPanel } = useTerminalOS();
  const [savedFocus, setSavedFocus] = React.useState<number | null>(null);
  const dock = getDockLayout();
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="FOCUS+ • Fullscreen Active Pane + Quick Return" right={<StatusBadge label={dock.focusFullscreen ? 'FULL' : 'NORMAL'} variant="sim" />} />
      <div className="p-2" style={{ fontSize: DENSITY.fontSizeDefault }}>
        <div>Active pane: P{focusedPanel + 1}</div>
        <div className="flex items-center gap-2 mt-2">
          <button type="button" onClick={() => {
            setSavedFocus(focusedPanel);
            setDockLayout({ focusFullscreen: true });
          }}>FULLSCREEN ACTIVE</button>
          <button type="button" onClick={() => {
            setDockLayout({ focusFullscreen: false });
            if (savedFocus !== null) setFocusedPanel(savedFocus);
          }}>RESTORE</button>
          <button type="button" onClick={() => setFocusedPanel(Math.max(0, focusedPanel - 1))}>PREV</button>
          <button type="button" onClick={() => setFocusedPanel(focusedPanel + 1)}>NEXT</button>
        </div>
      </div>
      <EmptyFill hint="ONE KEY FULLSCREEN, ONE KEY RETURN (OS CONTEXT PRESERVED)" />
    </div>
  );
}

export function FnPINBAR({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel, focusedPanel } = useTerminalOS();
  const [rows, setRows] = React.useState(() => listPinItems(200));
  const [dock, setDock] = React.useState(() => loadDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);
  React.useEffect(() => {
    const id = window.setInterval(() => setRows(listPinItems(200)), 3000);
    return () => window.clearInterval(id);
  }, []);
  const cols: DenseColumn[] = [
    { key: 'label', header: 'Pinned', width: '140px' },
    { key: 'value', header: 'Value', width: '90px', align: 'right' },
    { key: 'provenance', header: 'Prov', width: '60px' },
    { key: 'targetMnemonic', header: 'Function', width: '90px' },
  ];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="PINBAR • Global Heads-up Strip" right={<StatusBadge label={`${rows.length} PINS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => setDockLayout({ pinbarVisible: !dock.pinbarVisible })}>{dock.pinbarVisible ? 'HIDE' : 'SHOW'} PINBAR</button>
        <button type="button" onClick={() => setDockLayout({ pinbarDock: 'top' })}>TOP</button>
        <button type="button" onClick={() => setDockLayout({ pinbarDock: 'bottom' })}>BOTTOM</button>
        <span>Dock: {dock.pinbarDock.toUpperCase()}</span>
      </div>
      {rows.length ? (
        <DenseTable
          columns={cols}
          rows={rows as unknown as Record<string, unknown>[]}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          onRowClick={(r) => navigatePanel(focusedPanel, String(r.targetMnemonic), r.targetSecurity ? String(r.targetSecurity) : undefined)}
          onRowDoubleClick={(r) => {
            removePinItem(String(r.id));
            setRows(listPinItems(200));
          }}
        />
      ) : <EmptyFill hint="NO PINS YET • PIN ANY FIELD/ENTITY TO MAKE THIS STRIP LIVE" />}
    </div>
  );
}

export function FnNAVTREE({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel, focusedPanel } = useTerminalOS();
  const [q, setQ] = React.useState('');
  const [category, setCategory] = React.useState<'ALL' | MnemonicCategory>('ALL');
  const [focusSet, setFocusSet] = React.useState<'ALL' | 'FAV' | 'RECENT' | 'PINNED'>('ALL');
  const [dock, setDock] = React.useState(() => loadDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);
  const loadCodeSet = React.useCallback((key: string): Set<string> => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set<string>();
      return new Set(parsed.map((v) => String(v).toUpperCase()));
    } catch {
      return new Set<string>();
    }
  }, []);
  const defs = React.useMemo(() => {
    const qUp = q.toUpperCase().trim();
    const fav = loadCodeSet('mm_fn_favorites');
    const recent = loadCodeSet('mm_fn_recent');
    const pinned = loadCodeSet('mm_fn_pinned');
    const all = listCatalogMnemonics();
    const filtered = all.filter((m) => {
      if (category !== 'ALL' && m.category !== category) return false;
      if (focusSet === 'FAV' && !fav.has(m.code)) return false;
      if (focusSet === 'RECENT' && !recent.has(m.code)) return false;
      if (focusSet === 'PINNED' && !pinned.has(m.code)) return false;
      if (!qUp) return true;
      const hay = `${m.code} ${m.title} ${m.keywords.join(' ')} ${m.searchSynonyms.join(' ')} ${m.category} ${m.assetClass} ${m.functionType} ${m.scope}`.toUpperCase();
      return hay.includes(qUp);
    });
    return filtered
      .sort((a, b) => {
        const score = (m: typeof a) =>
          (recent.has(m.code) ? 20 : 0) + (fav.has(m.code) ? 12 : 0) + (pinned.has(m.code) ? 9 : 0) + (m.code.startsWith(qUp) ? 7 : 0);
        return score(b) - score(a) || a.code.localeCompare(b.code);
      })
      .slice(0, 1800)
      .map((m) => ({
        id: m.code,
        code: m.code,
        title: m.title,
        taxonomy: `${m.category}/${m.functionType}/${m.scope}`,
        related: m.relatedCodes.slice(0, 4).join(', '),
      }));
  }, [q, category, focusSet, loadCodeSet]);
  const taxonomyGroups = React.useMemo(() => Object.keys(listCatalogByTaxonomy()).length, []);
  const cols: DenseColumn[] = [
    { key: 'code', header: 'Function', width: '90px' },
    { key: 'title', header: 'Title', width: '1fr' },
    { key: 'taxonomy', header: 'Taxonomy', width: '220px' },
    { key: 'related', header: 'Related', width: '180px' },
  ];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NAVTREE • Global Function Navigator" right={<StatusBadge label={`${defs.length} MATCH / ${taxonomyGroups} GROUPS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search function catalog" style={{ flex: 1, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
        <select value={category} onChange={(e) => setCategory(e.target.value as 'ALL' | MnemonicCategory)} style={{ height: 16, background: '#000', color: '#e6e6e6', border: '1px solid #222', fontSize: DENSITY.fontSizeTiny }}>
          {(['ALL', 'EQUITY', 'FX', 'RATES', 'CREDIT', 'DERIVS', 'MACRO', 'PORTFOLIO', 'NEWS_DOCS', 'OPS_ADMIN'] as const).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={focusSet} onChange={(e) => setFocusSet(e.target.value as 'ALL' | 'FAV' | 'RECENT' | 'PINNED')} style={{ height: 16, background: '#000', color: '#e6e6e6', border: '1px solid #222', fontSize: DENSITY.fontSizeTiny }}>
          {(['ALL', 'FAV', 'RECENT', 'PINNED'] as const).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="button" onClick={() => setDockLayout({ navtreeVisible: !dock.navtreeVisible })}>{dock.navtreeVisible ? 'HIDE' : 'SHOW'} RAIL</button>
      </div>
      <DenseTable columns={cols} rows={defs as unknown as Record<string, unknown>[]} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => navigatePanel(focusedPanel, String(r.code))} />
    </div>
  );
}

export function FnKEYMAP({ panelIdx = 0 }: { panelIdx?: number }) {
  const [profile, setProfile] = React.useState(() => loadKeymapProfile());
  const rows = Object.entries(profile.bindings).map(([key, action], i) => ({ id: `${i}`, key, action }));
  const cols: DenseColumn[] = [{ key: 'key', header: 'Key', width: '140px' }, { key: 'action', header: 'Action', width: '1fr' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="KEYMAP • Full Hotkey Editor + Profiles" right={<StatusBadge label={profile.name} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => { saveKeymapProfile(profile); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'KEYMAP save profile', mnemonic: 'KEYMAP' }); }}>SAVE</button>
        <button type="button" onClick={() => setProfile(loadKeymapProfile())}>RESET</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" />
    </div>
  );
}

const CMDK_UNIVERSE = [
  'AAPL US Equity',
  'MSFT US Equity',
  'NVDA US Equity',
  'SPX Index',
  ...Object.keys(MNEMONIC_DEFS),
];

export function FnCMDK({ panelIdx = 0 }: { panelIdx?: number }) {
  const { focusedPanel, navigatePanel } = useTerminalOS();
  const [q, setQ] = React.useState('');
  const rows = CMDK_UNIVERSE.filter((x) => x.toUpperCase().includes(q.toUpperCase())).slice(0, 80).map((x, i) => ({
    id: `${i}`,
    item: x,
    type: MNEMONIC_DEFS[x] ? 'FUNCTION' : 'SECURITY',
  }));
  const cols: DenseColumn[] = [{ key: 'type', header: 'Type', width: '80px' }, { key: 'item', header: 'Result', width: '1fr' }];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="CMDK • Global Command Palette" right={<StatusBadge label={`${rows.length} RESULT`} variant="sim" />} />
      <div className="px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111', display: 'flex', alignItems: 'center' }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find securities, functions, fields, workspaces..." style={{ flex: 1, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
      </div>
      <DenseTable
        columns={cols}
        rows={rows as unknown as Record<string, unknown>[]}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        onRowClick={(r) => {
          const v = String(r.item);
          if (MNEMONIC_DEFS[v]) navigatePanel(focusedPanel, v);
          else navigatePanel(focusedPanel, 'DES', v);
        }}
      />
    </div>
  );
}

export function FnLINK({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const rows = panels.map((p, idx) => ({
    id: String(idx),
    pane: `P${idx + 1}`,
    security: p.activeSecurity,
    mnemonic: p.activeMnemonic,
    group: p.linkGroup ?? 'none',
  }));
  const cols: DenseColumn[] = [
    { key: 'pane', header: 'Pane', width: '70px' },
    { key: 'security', header: 'Security', width: '1fr' },
    { key: 'mnemonic', header: 'Function', width: '90px' },
    { key: 'group', header: 'Link', width: '70px' },
  ];
  const cycle: Array<'red' | 'green' | 'blue' | 'yellow' | null> = [null, 'red', 'green', 'blue', 'yellow'];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="LINK • Pane Symbol Sync Groups" right={<StatusBadge label="A/B/C GROUPS" variant="sim" />} />
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => {
        const idx = Number(r.id);
        const current = panels[idx]?.linkGroup ?? null;
        const next = cycle[(cycle.indexOf(current) + 1) % cycle.length] ?? null;
        dispatchPanel(idx, { type: 'SET_LINK_GROUP', color: next });
      }} />
    </div>
  );
}

export function FnMONPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const { focusedPanel, navigatePanel } = useTerminalOS();
  const [symbolsText, setSymbolsText] = React.useState(() => loadMonitorList().join(','));
  const [fieldFilter, setFieldFilter] = React.useState('PX');
  const symbols = React.useMemo(() => symbolsText.split(',').map((s) => s.trim()).filter(Boolean), [symbolsText]);
  const fields = React.useMemo(
    () => Object.values(FIELD_CATALOG)
      .filter((f) => !fieldFilter.trim() || `${f.id} ${f.label}`.toUpperCase().includes(fieldFilter.toUpperCase()))
      .slice(0, 6),
    [fieldFilter],
  );
  const rows = React.useMemo(() => symbols.map((sym, i) => {
    const ticker = sym.split(' ')[0] ?? sym;
    const q = state.quotes.find((x) => x.symbol.startsWith(ticker));
    const row: Record<string, unknown> = { id: `${i}`, symbol: sym, ticker };
    fields.forEach((f) => {
      if (f.id === 'PX_LAST') row[f.id] = q?.last ?? 100 + i;
      else if (f.id === 'PCT_CHG') row[f.id] = q?.pct ?? 0;
      else if (f.id === 'VOLUME') row[f.id] = q?.volumeM ?? 0;
      else row[f.id] = `SIM:${f.id}`;
    });
    return row;
  }), [symbols, fields, state.quotes]);
  const cols: DenseColumn[] = [{ key: 'ticker', header: 'Ticker', width: '120px' }, ...fields.map((f) => ({ key: f.id, header: f.id, width: '1fr' as const, tone: f.id === 'PCT_CHG' }))];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="MON+ • Monitor Builder Worksheets" right={<StatusBadge label={`${fields.length} FIELDS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input value={symbolsText} onChange={(e) => setSymbolsText(e.target.value)} placeholder="AAPL US Equity,MSFT US Equity" style={{ flex: 1, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
        <input value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} placeholder="Field filter" style={{ width: 120, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
        <button type="button" onClick={() => { saveMonitorList(symbols); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `MON+ save ${symbols.length} symbols`, mnemonic: 'MON+' }); }}>SAVE</button>
      </div>
      <DenseTable columns={cols as DenseColumn[]} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => navigatePanel(focusedPanel, 'DES', String(r.symbol))} />
    </div>
  );
}

export function FnALRTPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [symbol, setSymbol] = React.useState(p.activeSecurity);
  const [fieldId, setFieldId] = React.useState('PX_LAST');
  const [op, setOp] = React.useState('>');
  const [value, setValue] = React.useState('200');
  const rules = loadAlertRules();
  const rows = rules.map((r) => ({ id: r.id, symbol: r.symbol, condition: `${r.op} ${r.value}`, created: new Date(r.createdAt).toISOString().slice(11, 19), prov: 'SIM' }));
  const cols: DenseColumn[] = [
    { key: 'symbol', header: 'Symbol', width: '160px' },
    { key: 'condition', header: 'Condition', width: '130px' },
    { key: 'created', header: 'Created', width: '90px' },
    { key: 'prov', header: 'Provenance', width: '100px' },
  ];
  const create = () => {
    const policy = loadPolicyState();
    if (!isAllowedByRole(policy.activeRole, 'ALERT_CREATE') || !checkPolicy('ALERT_CREATE', policy.activeRole).allowed) {
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'ALRT+ blocked by policy/entitlement.', recovery: 'Review ENT/POL and retry.', entity: 'ALRT+' });
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'ALRT+ create blocked', mnemonic: 'ALRT+' });
      return;
    }
    addAlertRule(`ALERT IF ${symbol} ${op} ${value}`);
    appendAuditEvent({ panelIdx, type: 'ALERT_CREATE', actor: policy.activeRole, detail: `ALRT+ ${symbol} ${fieldId} ${op} ${value}`, mnemonic: 'ALRT+', security: symbol });
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="ALRT+ • Advanced Alerts (Field-based)" right={<StatusBadge label={`${rows.length} RULES`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: 170, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
        <select value={fieldId} onChange={(e) => setFieldId(e.target.value)}>{Object.values(FIELD_CATALOG).slice(0, 20).map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}</select>
        <select value={op} onChange={(e) => setOp(e.target.value)}><option value=">">{'>'}</option><option value="<">{'<'}</option></select>
        <input value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 90, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
        <button type="button" onClick={create}>CREATE</button>
      </div>
      <DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" />
    </div>
  );
}

export function FnADMIN({ panelIdx = 0 }: { panelIdx?: number }) {
  const policy = loadPolicyState();
  const rows = [
    { id: 'users', item: 'Users', value: '42', action: 'Manage' },
    { id: 'roles', item: 'Roles', value: '6', action: 'Assign' },
    { id: 'entitlements', item: 'Entitlements', value: '128', action: 'Review' },
    { id: 'policies', item: 'Policies', value: String(policy.rules.length), action: 'Edit' },
  ];
  const cols: DenseColumn[] = [{ key: 'item', header: 'Area', width: '1fr' }, { key: 'value', header: 'Count', width: '80px', align: 'right' }, { key: 'action', header: 'Action', width: '100px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="ADMIN • Admin Console" right={<StatusBadge label={policy.activeRole} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `ADMIN ${String(r.item)}`, mnemonic: 'ADMIN' })} /></div>;
}

export function FnAUDITPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel } = useTerminalOS();
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="AUDIT • Full Audit Trail with Replay" right={<StatusBadge label="REPLAY" variant="sim" />} /><div className="p-2 text-xs">Unified audit trail with replay is active via `AUD`, `NAVG`, and `TRAIL` flows.</div><button type="button" onClick={() => navigatePanel(panelIdx, 'AUD')}>OPEN AUD</button><button type="button" onClick={() => navigatePanel(panelIdx, 'TRAIL')}>OPEN TRAIL</button></div>;
}

export function FnPOLICYPlus({ panelIdx = 0 }: { panelIdx?: number }) {
  const state = loadPolicyState();
  const rows = state.rules.map((r) => ({ id: r.id, action: r.action, effect: r.effect, roles: r.roles.join(','), enabled: r.enabled ? 'YES' : 'NO' }));
  const cols: DenseColumn[] = [{ key: 'action', header: 'Action', width: '120px' }, { key: 'effect', header: 'Effect', width: '90px' }, { key: 'roles', header: 'Roles', width: '1fr' }, { key: 'enabled', header: 'Enabled', width: '90px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="POLICY • Block/Allow Rules" right={<StatusBadge label={state.mode.toUpperCase()} variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => appendAuditEvent({ panelIdx, type: 'POLICY_CHANGE', actor: 'USER', detail: `POLICY review ${String(r.id)}`, mnemonic: 'POLICY' })} /></div>;
}

export function FnSRC({ panelIdx = 0 }: { panelIdx?: number }) {
  const rows = Object.values(FIELD_CATALOG).slice(0, 40).map((f) => ({ id: f.id, field: f.id, provider: f.provenance === 'SIM' ? 'SIM' : 'PRIMARY', fallback: 'SIM', cadence: f.updateFreq }));
  const cols: DenseColumn[] = [{ key: 'field', header: 'Field', width: '120px' }, { key: 'provider', header: 'Primary', width: '90px' }, { key: 'fallback', header: 'Fallback', width: '90px' }, { key: 'cadence', header: 'Cadence', width: '1fr' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="SRC • Data Source Manager" right={<StatusBadge label="SIM FIRST" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" /></div>;
}

export function FnAPI({ panelIdx = 0 }: { panelIdx?: number }) {
  const [keys, setKeys] = React.useState<Array<{ id: string; scope: string; rate: string; created: string }>>([]);
  const create = () => {
    const next = { id: `mm_${Math.random().toString(36).slice(2, 10)}`, scope: 'read:quotes,read:alerts', rate: '120 rpm', created: new Date().toISOString().slice(11, 19) };
    setKeys((k) => [next, ...k]);
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `API key create ${next.id}`, mnemonic: 'API' });
  };
  const cols: DenseColumn[] = [{ key: 'id', header: 'Key', width: '180px' }, { key: 'scope', header: 'Scopes', width: '1fr' }, { key: 'rate', header: 'Rate', width: '90px' }, { key: 'created', header: 'Created', width: '90px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="API • API Keys + Developer Portal" right={<StatusBadge label={`${keys.length} KEYS`} variant="sim" />} /><div className="px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}><button type="button" onClick={create}>CREATE KEY</button></div><DenseTable columns={cols} rows={keys as unknown as Record<string, unknown>[]} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" /></div>;
}

export function FnSTATUS({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const rows = [
    { id: 'quotes', subsystem: 'Quotes feed', value: String(state.streamClock.quotes), health: 'UP', drill: 'STAT' },
    { id: 'news', subsystem: 'News feed', value: String(state.streamClock.feed), health: 'UP', drill: 'STAT' },
    { id: 'alerts', subsystem: 'Alerts engine', value: String(loadAlertRules().length), health: 'UP', drill: 'ALRT+' },
    { id: 'audit', subsystem: 'Audit log', value: 'ACTIVE', health: 'UP', drill: 'AUDIT' },
  ];
  const cols: DenseColumn[] = [{ key: 'subsystem', header: 'Subsystem', width: '1fr' }, { key: 'value', header: 'Value', width: '120px' }, { key: 'health', header: 'Health', width: '80px' }];
  const { navigatePanel } = useTerminalOS();
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="STATUS • System Status Ops View" right={<StatusBadge label="OPS" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" onRowClick={(r) => navigatePanel(panelIdx, String(r.drill))} /></div>;
}

export function FnDIAG({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const fps = state.workerAnalytics?.uiFps ?? 60;
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: `${i}`, pane: `P${i + 1}`, renderMs: Math.max(2, Math.round(1000 / Math.max(20, fps)) + i), memMb: 120 + i * 3, virt: i % 2 ? 'OK' : 'WARN' }));
  const cols: DenseColumn[] = [{ key: 'pane', header: 'Pane', width: '70px' }, { key: 'renderMs', header: 'Render Time (ms)', width: '120px', align: 'right' }, { key: 'memMb', header: 'Memory (MB)', width: '100px', align: 'right' }, { key: 'virt', header: 'Virtualization', width: '100px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="DIAG • Diagnostics / Profiler" right={<StatusBadge label={`FPS ${fps}`} variant="sim" />} /><DenseTable columns={cols} rows={rows as unknown as Record<string, unknown>[]} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" /></div>;
}

export function FnOFFLINE({ panelIdx = 0 }: { panelIdx?: number }) {
  const policy = loadPolicyState();
  const { state } = useTerminalStore();
  const rows = [
    { id: 'mode', key: 'Offline mode', value: policy.mode === 'frozen' ? 'ON' : 'OFF', stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'quotes', key: 'Cached quotes', value: String(state.quotes.length), stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'news', key: 'Cached headlines', value: String(state.headlines.length), stale: policy.mode === 'frozen' ? 'YES' : 'NO' },
    { id: 'notes', key: 'Offline notes/docs', value: 'AVAILABLE', stale: 'NO' },
  ];
  const cols: DenseColumn[] = [{ key: 'key', header: 'Cache Area', width: '1fr' }, { key: 'value', header: 'Value', width: '120px' }, { key: 'stale', header: 'STALE', width: '80px' }];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="OFFLINE • Cached Snapshot Mode" right={<StatusBadge label={policy.mode === 'frozen' ? 'STALE' : 'LIVE'} variant={policy.mode === 'frozen' ? 'stale' : 'live'} />} /><div className="px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}><button type="button" onClick={() => savePolicyState({ ...policy, mode: policy.mode === 'frozen' ? 'normal' : 'frozen' })}>{policy.mode === 'frozen' ? 'EXIT OFFLINE' : 'ENTER OFFLINE'}</button></div><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" /></div>;
}

export function FnTUTOR({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel, focusedPanel } = useTerminalOS();
  const [track, setTrack] = React.useState<'CORE' | 'MAP' | 'PLATFORM'>('CORE');

  const steps = React.useMemo(() => {
    const core = [
      { id: '1', step: '1', mnemonic: 'HL+', action: 'Open unified search', why: 'Discover any function/security/field quickly' },
      { id: '2', step: '2', mnemonic: 'DES', action: 'Open reference sheet', why: 'Learn key fields and provenance badges' },
      { id: '3', step: '3', mnemonic: 'TOP', action: 'Open news hub', why: 'Use tags/headlines for drill workflow' },
      { id: '4', step: '4', mnemonic: 'FLD', action: 'Open field catalog', why: 'Understand field ids and cadence' },
      { id: '5', step: '5', mnemonic: 'LINE', action: 'Open lineage view', why: 'Trace source transforms and freshness' },
      { id: '6', step: '6', mnemonic: 'MON+', action: 'Build monitor worksheet', why: 'Create streaming table with custom columns' },
      { id: '7', step: '7', mnemonic: 'ALRT+', action: 'Create field alerts', why: 'Route alert rules and evidence trails' },
      { id: '8', step: '8', mnemonic: 'WS', action: 'Save workspace', why: 'Persist full dock layout and pane state' },
    ];
    const map = [
      { id: 'm1', step: '1', mnemonic: 'GEO', action: 'Open global intelligence map', why: 'Primary world map drill entrypoint' },
      { id: 'm2', step: '2', mnemonic: 'GEO.N', action: 'Open geo news heat', why: 'See region-tagged headline intensity' },
      { id: 'm3', step: '3', mnemonic: 'GEO.C', action: 'Open company footprint map', why: 'Explore facilities and exposure' },
      { id: 'm4', step: '4', mnemonic: 'RGN', action: 'Open region dossier', why: 'Region-centric macro/news/risk pack' },
      { id: 'm5', step: '5', mnemonic: 'NMAP', action: 'Open news map overlay', why: 'Cross-check map + narrative signals' },
      { id: 'm6', step: '6', mnemonic: 'RELG', action: 'Open relationship graph', why: 'Expand peer/ownership/correlation links' },
      { id: 'm7', step: '7', mnemonic: 'SCN', action: 'Open supply chain network', why: 'Drill supplier/customer stress channels' },
      { id: 'm8', step: '8', mnemonic: 'SHOCK.G', action: 'Run geo shock simulator', why: 'Test regional disruption scenarios' },
    ];
    const platform = [
      { id: 'p1', step: '1', mnemonic: 'NAVTREE', action: 'Browse full function catalog', why: 'View taxonomy-scale mnemonic library' },
      { id: 'p2', step: '2', mnemonic: 'DOCK', action: 'Manage pane engine', why: 'Split/tab/focus and 2-up workspace modes' },
      { id: 'p3', step: '3', mnemonic: 'FLOAT', action: 'Use pop-out panes', why: 'Multi-monitor style workflows' },
      { id: 'p4', step: '4', mnemonic: 'KEYMAP', action: 'Customize keybindings', why: 'Keyboard-first terminal operations' },
      { id: 'p5', step: '5', mnemonic: 'PINBAR', action: 'Run global pin strip', why: 'Keep heads-up fields always visible' },
      { id: 'p6', step: '6', mnemonic: 'STATUS', action: 'Check system health', why: 'Feed/runtime state and ops confidence' },
      { id: 'p7', step: '7', mnemonic: 'DIAG', action: 'Open diagnostics', why: 'Validate FPS/render and memory' },
      { id: 'p8', step: '8', mnemonic: 'OFFLINE', action: 'Toggle offline mode', why: 'Test stale/cached behavior safely' },
    ];
    return track === 'MAP' ? map : track === 'PLATFORM' ? platform : core;
  }, [track]);

  const cols: DenseColumn[] = [
    { key: 'step', header: '#', width: '38px', align: 'right' },
    { key: 'mnemonic', header: 'Function', width: '100px' },
    { key: 'action', header: 'Action', width: '1fr' },
    { key: 'why', header: 'Why', width: '1.1fr' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="TUTOR • Guided Walkthrough" right={<StatusBadge label={`${track} TRACK`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <button type="button" onClick={() => setTrack('CORE')}>CORE</button>
        <button type="button" onClick={() => setTrack('MAP')}>GLOBAL MAP</button>
        <button type="button" onClick={() => setTrack('PLATFORM')}>PLATFORM</button>
        <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>Click any row to open that function in the focused pane.</span>
      </div>
      <DenseTable
        columns={cols}
        rows={steps as unknown as Record<string, unknown>[]}
        rowKey="id"
        panelIdx={panelIdx}
        className="h-[58%]"
        onRowClick={(r) => navigatePanel(focusedPanel, String(r.mnemonic))}
      />
      <div style={{ borderTop: '1px solid #111', padding: '4px' }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, marginBottom: 2 }}>Where is the global map stack?</div>
        <div className="flex flex-wrap gap-1">
          {['GEO', 'GEO.N', 'GEO.C', 'GEO.R', 'GEO.M', 'RGN', 'NMAP', 'RELG', 'SCN'].map((m) => (
            <button key={m} type="button" onClick={() => navigatePanel(focusedPanel, m)} style={{ border: '1px solid #222', background: '#000', color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, marginTop: 4 }}>
          Tip: Use <code>NAVTREE GO</code> and filter NEWS_DOCS to browse the full map family.
        </div>
      </div>
    </div>
  );
}

// ── PREF — Preferences / Settings ────────────────────────────────────────────
const DENSITY_OPTIONS = [
  { id: 'comfortable', label: 'Comfortable', rowH: 22, fontSize: '13px', desc: 'More spacing, easier reading' },
  { id: 'default',     label: 'Default',     rowH: 20, fontSize: '12px', desc: 'Balanced density (recommended)' },
  { id: 'compact',     label: 'Compact',     rowH: 17, fontSize: '11px', desc: 'Bloomberg-style, maximum density' },
];

export function FnPREF({ panelIdx = 0 }: { panelIdx?: number }) {
  const { navigatePanel } = useTerminalOS();
  const [dock, setDock] = React.useState(() => loadDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);

  const [densityMode, setDensityMode] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    return window.localStorage.getItem('mm_density') ?? 'default';
  });

  const applyDensity = (id: string) => {
    setDensityMode(id);
    if (typeof window !== 'undefined') window.localStorage.setItem('mm_density', id);
    appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `PREF density:${id}`, mnemonic: 'PREF' });
  };

  const D = DENSITY;
  const rowStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    background: active ? D.rowSelectedBg : D.bgSurface,
    border: active ? `1px solid ${D.accentCyan}` : `1px solid ${D.borderColor}`,
    cursor: 'pointer',
    marginBottom: 4,
  });

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: D.fontFamily }}>
      <PanelSubHeader title="PREF • Preferences & Settings" right={<StatusBadge label="V1" variant="sim" />} />
      <div className="flex-1 min-h-0 overflow-auto" style={{ padding: '10px 12px' }}>

        {/* Density */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: D.accentAmber, fontSize: D.fontSizeHeader, fontWeight: 700, marginBottom: 6 }}>
            Display Density
          </div>
          {DENSITY_OPTIONS.map((opt) => (
            <div key={opt.id} onClick={() => applyDensity(opt.id)} style={rowStyle(densityMode === opt.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: D.textPrimary, fontSize: D.fontSizeDefault, fontWeight: 600 }}>{opt.label}</span>
                {densityMode === opt.id && <span style={{ color: D.accentGreen, fontSize: D.fontSizeTiny }}>✓ Active</span>}
              </div>
              <div style={{ color: D.textDim, fontSize: D.fontSizeTiny, marginTop: 1 }}>{opt.desc}</div>
            </div>
          ))}
        </div>

        {/* Layout mode */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: D.accentAmber, fontSize: D.fontSizeHeader, fontWeight: 700, marginBottom: 6 }}>
            Layout Mode
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['tile', 'tab', 'stack'] as const).map((mode) => (
              <button key={mode} type="button"
                onClick={() => { setDockLayout({ mode }); setDock(getDockLayout()); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: `PREF layout:${mode}`, mnemonic: 'PREF' }); }}
                style={{
                  background: dock.mode === mode ? D.accentAmber : D.bgSurfaceAlt,
                  color: dock.mode === mode ? '#000' : D.textSecondary,
                  border: `1px solid ${D.borderColor}`,
                  padding: '4px 14px',
                  cursor: 'pointer',
                  fontFamily: D.fontFamily,
                  fontSize: D.fontSizeTiny,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Live mode */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: D.accentAmber, fontSize: D.fontSizeHeader, fontWeight: 700, marginBottom: 6 }}>
            Streaming Mode
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button"
              onClick={() => { setDockLayout({ highDensityLiveMode: !dock.highDensityLiveMode }); appendAuditEvent({ panelIdx, type: 'GO', actor: 'USER', detail: 'PREF live toggle', mnemonic: 'PREF' }); }}
              style={{
                background: dock.highDensityLiveMode ? D.accentGreen : D.bgSurfaceAlt,
                color: dock.highDensityLiveMode ? '#000' : D.textSecondary,
                border: `1px solid ${D.borderColor}`,
                padding: '4px 14px',
                cursor: 'pointer',
                fontFamily: D.fontFamily,
                fontSize: D.fontSizeTiny,
                fontWeight: 700,
              }}
            >
              {dock.highDensityLiveMode ? '● Live Mode ON' : 'Live Mode OFF'}
            </button>
            <button type="button"
              onClick={() => { setDockLayout({ highDensityMode: !dock.highDensityMode }); }}
              style={{
                background: dock.highDensityMode ? D.accentCyan : D.bgSurfaceAlt,
                color: dock.highDensityMode ? '#000' : D.textSecondary,
                border: `1px solid ${D.borderColor}`,
                padding: '4px 14px',
                cursor: 'pointer',
                fontFamily: D.fontFamily,
                fontSize: D.fontSizeTiny,
                fontWeight: 700,
              }}
            >
              {dock.highDensityMode ? '▪ High Density ON' : 'High Density OFF'}
            </button>
          </div>
          <div style={{ color: D.textDim, fontSize: D.fontSizeTiny, marginTop: 4 }}>
            Live Mode increases streaming rate and fills panels with more data. High Density reduces row padding.
          </div>
        </div>

        {/* Quick links */}
        <div>
          <div style={{ color: D.accentAmber, fontSize: D.fontSizeHeader, fontWeight: 700, marginBottom: 6 }}>
            Advanced Settings
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { label: 'Keymap Editor', code: 'KEYMAP' },
              { label: 'Layout Templates', code: 'LAYOUT' },
              { label: 'Field Catalog', code: 'FLD' },
              { label: 'Policy Rules', code: 'POLICY' },
              { label: 'Entitlements', code: 'ENT' },
              { label: 'Audit Log', code: 'AUD' },
              { label: 'API Keys', code: 'API' },
              { label: 'Data Sources', code: 'SRC' },
            ].map(({ label, code }) => (
              <button key={code} type="button"
                onClick={() => navigatePanel(panelIdx, code)}
                style={{
                  background: D.bgSurfaceAlt,
                  color: D.accentCyan,
                  border: `1px solid ${D.borderColor}`,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontFamily: D.fontFamily,
                  fontSize: D.fontSizeTiny,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

