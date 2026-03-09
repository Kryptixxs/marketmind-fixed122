'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity } from '../entities/types';
import { openContextMenu } from '../ui/ContextMenu';
import { useTerminalStore } from '../../store/TerminalStore';
import { listWorkspaces, saveWorkspace, deleteWorkspace } from '../workspaceManager';
import { addToMonitorList, loadMonitorList, saveMonitorList } from '../monitorListStore';
import { intentFromMouseEvent, INTERACTION_HINT } from '../interaction';
import { addCommandHistory, loadAllCommandHistories } from '../commandHistoryStore';
import { appendAuditEvent } from '../commandAuditStore';
import { getDockLayout, loadDockLayout, setDockLayout } from '../dockLayoutStore';
import { listPinItems, replacePinItems } from '../pinboardStore';
import { loadMonitorFields, removeMonitorField } from '../monitorFieldStore';
import { getFieldDef } from '../../services/fieldCatalog';
import { makeFieldValueEntity } from '../../services/fieldRuntime';

function hash(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

const LISTS_KEY = 'vantage-monitor-lists-v1';

function loadLists(): Record<string, string[]> {
  if (typeof window === 'undefined') return { DEFAULT: loadMonitorList() };
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    if (!parsed.DEFAULT) parsed.DEFAULT = loadMonitorList();
    return parsed;
  } catch {
    return { DEFAULT: loadMonitorList() };
  }
}

function saveLists(lists: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch {
    // Ignore storage failure.
  }
}

// ── MON — Monitor / Watchlist ─────────────────────────────────────────────────
export function FnMON({ panelIdx }: { panelIdx: number }) {
  const { drill } = useDrill();
  const { state } = useTerminalStore();
  const [lists, setLists] = useState<Record<string, string[]>>(() => loadLists());
  const [activeList, setActiveList] = useState('DEFAULT');
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'last' | 'pct' | 'vol'>('symbol');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [monitorFields, setMonitorFields] = useState<string[]>(() => loadMonitorFields());
  const liveMode = getDockLayout().highDensityLiveMode;
  useEffect(() => {
    const sync = () => setMonitorFields(loadMonitorFields());
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const list = useMemo(() => lists[activeList] ?? [], [lists, activeList]);

  const effectiveList = useMemo(() => {
    if (!liveMode) return list;
    const seedUniverse = state.quotes.slice(0, 140).map((q) => q.symbol);
    return Array.from(new Set([...list, ...seedUniverse])).slice(0, 160);
  }, [list, liveMode, state.quotes]);

  const rows = useMemo(() => effectiveList.map((sym) => {
    const ticker = sym.split(' ')[0] ?? sym;
    const h = hash(sym);
    const lq = state.quotes.find((q) => q.symbol.startsWith(ticker));
    const last = lq?.last ?? 100 + h % 200;
    const pct = lq?.pct ?? ((h % 200) - 100) / 100;
    const vol = lq?.volumeM ?? 20 + h % 80;
    const vwap = state.workerAnalytics?.vwapBySymbol[ticker + ' US'] ?? last - 0.12;
    const dynamic = monitorFields.reduce<Record<string, string | number>>((acc, fid) => {
      const field = fid.toUpperCase();
      if (field === 'PX_LAST') acc[field] = last;
      else if (field === 'PCT_CHG') acc[field] = pct;
      else if (field === 'VOLUME') acc[field] = vol;
      else if (field === 'VWAP') acc[field] = vwap;
      else if (field === 'BETA') acc[field] = 0.6 + ((h % 14) / 10);
      else if (field === 'MARKET_CAP') acc[field] = 200 + (h % 2000);
      else acc[field] = ((h % 400) - 200) / 10;
      return acc;
    }, {});
    return { sym, ticker, last, pct, vol, vwap, ...dynamic };
  }), [effectiveList, state.quotes, state.workerAnalytics?.vwapBySymbol, monitorFields]);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.sym.toUpperCase().includes(q) || r.ticker.toUpperCase().includes(q)) : rows;
    const sorted = [...base].sort((a, b) => {
      if (sortBy === 'symbol') return a.ticker.localeCompare(b.ticker);
      if (sortBy === 'last') return b.last - a.last;
      if (sortBy === 'pct') return b.pct - a.pct;
      return b.vol - a.vol;
    });
    return sorted;
  }, [rows, filter, sortBy]);

  const addSym = () => {
    const s = input.trim();
    if (!s) return;
    const full = s.includes(' ') ? s : s + ' US Equity';
    addToMonitorList(full);
    const next = [full, ...list.filter((x) => x !== full)].slice(0, liveMode ? 180 : 80);
    const updated = { ...lists, [activeList]: next };
    setLists(updated);
    saveLists(updated);
    if (activeList === 'DEFAULT') saveMonitorList(next);
    appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `MON add ${full}` });
    setInput('');
  };

  const removeSym = (sym: string) => {
    const next = list.filter((s) => s !== sym);
    const updated = { ...lists, [activeList]: next };
    setLists(updated);
    saveLists(updated);
    if (activeList === 'DEFAULT') saveMonitorList(next);
    appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `MON remove ${sym}` });
  };

  const createList = () => {
    const base = input.trim().toUpperCase();
    if (!base || lists[base]) return;
    const updated = { ...lists, [base]: [] };
    setLists(updated);
    setActiveList(base);
    saveLists(updated);
    setInput('');
  };

  const exportList = () => {
    const payload = { list: activeList, symbols: filteredRows.map((r) => r.sym), ts: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MON-${activeList}.json`;
    a.click();
    URL.revokeObjectURL(url);
    appendAuditEvent({ panelIdx, type: 'EXPORT', actor: 'USER', detail: `MON export ${activeList}` });
  };

  const drillSelected = (intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANEL' | 'INSPECT_OVERLAY') => {
    const row = filteredRows[selectedIdx];
    if (!row) return;
    drill(makeSecurity(row.sym, row.ticker), intent, panelIdx);
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title="MON • Monitor / Watchlist" />
      <div className="flex items-center flex-none"
        style={{ height: DENSITY.commandBarHeightPx, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <select value={activeList} onChange={(e) => setActiveList(e.target.value)}
          style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}`, color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny, height: DENSITY.rowHeightPx }}>
          {Object.keys(lists).sort().map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSym(); }}
          placeholder="AAPL US Equity  or  LIST NAME" className="flex-1 bg-transparent outline-none"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={addSym} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentGreen}`, padding: '0 4px', cursor: 'pointer' }}>ADD</button>
        <button type="button" onClick={createList} style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentCyan}`, padding: '0 4px', cursor: 'pointer' }}>NEW LIST</button>
        <button type="button" onClick={exportList} style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.borderColor}`, padding: '0 4px', cursor: 'pointer' }}>EXPORT</button>
      </div>
      <div className="flex items-center flex-none" style={{ height: DENSITY.rowHeightPx + 2, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4, background: DENSITY.bgBase }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={() => setSortBy('symbol')} style={{ color: sortBy === 'symbol' ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>SYM</button>
        <button type="button" onClick={() => setSortBy('last')} style={{ color: sortBy === 'last' ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>LAST</button>
        <button type="button" onClick={() => setSortBy('pct')} style={{ color: sortBy === 'pct' ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>%CHG</button>
        <button type="button" onClick={() => setSortBy('vol')} style={{ color: sortBy === 'vol' ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>VOL</button>
      </div>
      <div className="flex items-center gap-1 flex-none" style={{ minHeight: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px` }}>
        <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>FIELDS</span>
        {monitorFields.map((fid) => (
          <button
            key={fid}
            type="button"
            style={{ color: DENSITY.accentCyan, border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.bgSurfaceAlt, fontSize: DENSITY.fontSizeTiny, padding: '0 3px' }}
            onClick={() => {
              removeMonitorField(fid);
              const next = loadMonitorFields();
              setMonitorFields(next);
              appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `MON remove field ${fid}` });
            }}
            title={`Remove ${fid} column`}
          >
            {fid} ✕
          </button>
        ))}
      </div>
      {/* Column headers */}
      <div className="flex-none grid select-none" style={{ gridTemplateColumns: `1fr ${monitorFields.map(() => '80px').join(' ')} 16px`, height: DENSITY.rowHeightPx, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        {['Security', ...monitorFields.map((f) => getFieldDef(f)?.label ?? f), ''].map((h, i) => (
          <span key={i} className="px-[2px]" style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>{h}</span>
        ))}
      </div>
      <div
        className="flex-1 min-h-0 overflow-auto terminal-scrollbar outline-none"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filteredRows.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); drillSelected('OPEN_IN_NEW_PANEL'); }
          else if (e.key === 'Enter' && e.altKey) { e.preventDefault(); drillSelected('INSPECT_OVERLAY'); }
          else if (e.key === 'Enter') { e.preventDefault(); drillSelected('OPEN_IN_PLACE'); }
        }}
      >
        {filteredRows.map((row, ri) => {
          const entity = makeSecurity(row.sym, row.ticker);
          return (
            <div key={row.sym} className="grid items-center cursor-pointer"
              style={{ gridTemplateColumns: `1fr ${monitorFields.map(() => '80px').join(' ')} 16px`, height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: ri === selectedIdx ? DENSITY.rowSelectedBg : ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.bgBase }}
              onMouseEnter={(e) => { if (ri !== selectedIdx) e.currentTarget.style.background = DENSITY.rowHover; }}
              onMouseLeave={(e) => { if (ri !== selectedIdx) e.currentTarget.style.background = ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.bgBase; }}
              onClick={(e) => { setSelectedIdx(ri); drill(entity, intentFromMouseEvent(e), panelIdx); }}
              onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}
              title={INTERACTION_HINT}>
              <span className="px-[2px] truncate" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault }}>{row.ticker}</span>
              {monitorFields.map((fieldId) => {
                const raw = (row as Record<string, unknown>)[fieldId] as number | string;
                const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
                const text = Number.isFinite(num)
                  ? fieldId === 'PCT_CHG'
                    ? `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
                    : fieldId === 'VOLUME'
                      ? `${num.toFixed(1)}M`
                      : num.toFixed(2)
                  : String(raw ?? '—');
                const fEntity = makeFieldValueEntity(fieldId, raw, { source: 'SIM' });
                return (
                  <span
                    key={`${row.sym}-${fieldId}`}
                    className="px-[2px] tabular-nums text-right cursor-pointer hover:underline"
                    style={{ color: fieldId === 'PCT_CHG' && Number.isFinite(num) ? (num >= 0 ? DENSITY.accentGreen : DENSITY.accentRed) : DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}
                    onClick={(e) => { e.stopPropagation(); drill(fEntity, intentFromMouseEvent(e), panelIdx); }}
                  >
                    {text}
                  </span>
                );
              })}
              <button type="button" onClick={(e) => { e.stopPropagation(); removeSym(row.sym); }}
                style={{ color: DENSITY.textMuted, fontSize: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          );
        })}
        {filteredRows.length === 0 && <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>No symbols. Type above and press Enter.</div>}
      </div>
    </div>
  );
}

// ── WS — Workspace manager ─────────────────────────────────────────────────────
export function FnWS({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel, dispatchPanel, setFocusedPanel } = useTerminalOS();
  const [workspaces, setWorkspaces] = useState(() => listWorkspaces());
  const [newName, setNewName] = useState('');

  const doSave = () => {
    const n = newName.trim() || 'DEFAULT';
    saveWorkspace(n, {
      version: 3,
      focusedPanel: panelIdx,
      commandHistories: loadAllCommandHistories(panels.length),
      panels: panels.map((p) => ({ ...p })),
      dockLayout: loadDockLayout(),
      pins: listPinItems(500),
    });
    appendAuditEvent({ panelIdx, type: 'WORKSPACE_SAVE', actor: 'USER', detail: `WS ${n}` });
    setWorkspaces(listWorkspaces());
    setNewName('');
  };

  const doLoad = (ws: ReturnType<typeof listWorkspaces>[number]) => {
    ws.panels.forEach((p, idx) => { if (idx < panels.length) dispatchPanel(idx, { type: 'HYDRATE', snapshot: p }); });
    setFocusedPanel(ws.focusedPanel ?? 0);
    ws.commandHistories?.forEach((h, idx) => {
      h.forEach((cmd) => addCommandHistory(idx, cmd));
    });
    if (ws.dockLayout) setDockLayout(ws.dockLayout);
    if (ws.pins) replacePinItems(ws.pins);
    appendAuditEvent({ panelIdx, type: 'WORKSPACE_LOAD', actor: 'USER', detail: `WS ${ws.name}` });
  };

  const doDelete = (name: string) => {
    deleteWorkspace(name);
    setWorkspaces(listWorkspaces());
    appendAuditEvent({ panelIdx, type: 'WORKSPACE_DELETE', actor: 'USER', detail: `WS ${name}` });
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title="WS • Workspaces" />
      <div className="flex items-center flex-none"
        style={{ height: DENSITY.commandBarHeightPx, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSave(); }}
          placeholder="Workspace name (Enter to save current layout)"
          className="flex-1 bg-transparent outline-none" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={doSave} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentGreen}`, padding: '0 4px', cursor: 'pointer' }}>SAVE</button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {workspaces.length === 0 && (
          <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
            No saved workspaces. Type a name above and press SAVE to persist full dock state (panes + link groups + pins).
          </div>
        )}
        {workspaces.map((ws) => (
          <div key={ws.name} className="flex items-center"
            style={{ height: DENSITY.rowHeightPx + 2, padding: `0 ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: DENSITY.bgBase }}>
            <span style={{ color: DENSITY.accentAmber, flex: 1, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>{ws.name}</span>
            <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, marginRight: 8 }}>{new Date(ws.savedAt).toLocaleString()}</span>
            <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, marginRight: 8 }}>
              {ws.panels.map((p) => p.activeMnemonic).join(' | ')}
            </span>
            <button type="button" onClick={() => doLoad(ws)}
              style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentCyan}`, padding: '0 4px', cursor: 'pointer', marginRight: 4 }}>LOAD</button>
            <button type="button" onClick={() => doDelete(ws.name)}
              style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentRed}`, padding: '0 4px', cursor: 'pointer' }}>DEL</button>
          </div>
        ))}
      </div>
    </div>
  );
}
