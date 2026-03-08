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
    { key: 'mnemonic', header: 'Fn', width: '70px' },
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
    { key: 'columns', header: 'Cols', width: '50px', align: 'right' },
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
    { key: 'targetMnemonic', header: 'Fn', width: '70px' },
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
  const [dock, setDock] = React.useState(() => loadDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);
  const defs = Object.values(MNEMONIC_DEFS)
    .filter((d) => d.code.includes(q.toUpperCase()) || d.title.toUpperCase().includes(q.toUpperCase()))
    .slice(0, 120)
    .map((d) => ({ id: d.code, code: d.code, title: d.title, related: d.relatedCodes.slice(0, 3).join(', ') }));
  const cols: DenseColumn[] = [
    { key: 'code', header: 'Fn', width: '90px' },
    { key: 'title', header: 'Title', width: '1fr' },
    { key: 'related', header: 'Related', width: '160px' },
  ];
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NAVTREE • Global Function Navigator" right={<StatusBadge label={`${defs.length} MATCH`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: '1px solid #111' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search function catalog" style={{ flex: 1, height: 16, background: '#000', border: '1px solid #222', color: '#e6e6e6', fontSize: DENSITY.fontSizeTiny, padding: '0 4px' }} />
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
    { key: 'mnemonic', header: 'Fn', width: '80px' },
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
    { key: 'prov', header: 'Prov', width: '60px' },
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
  const cols: DenseColumn[] = [{ key: 'pane', header: 'Pane', width: '70px' }, { key: 'renderMs', header: 'Render(ms)', width: '100px', align: 'right' }, { key: 'memMb', header: 'Mem(MB)', width: '90px', align: 'right' }, { key: 'virt', header: 'Virt', width: '80px' }];
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

