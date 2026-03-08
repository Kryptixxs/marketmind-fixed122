'use client';

import React, { useMemo, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity } from '../entities/types';
import { openContextMenu } from '../ui/ContextMenu';
import { useTerminalStore } from '../../store/TerminalStore';
import { listWorkspaces, saveWorkspace, deleteWorkspace } from '../workspaceManager';

function hash(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

function getMonitorList(): string[] {
  if (typeof window === 'undefined') return ['AAPL US Equity', 'MSFT US Equity', 'NVDA US Equity', 'SPX Index', 'EURUSD Curncy'];
  try {
    const raw = localStorage.getItem('vantage-monitor-list');
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (list.length === 0) return ['AAPL US Equity', 'MSFT US Equity', 'NVDA US Equity', 'SPX Index', 'EURUSD Curncy'];
    return list;
  } catch { return ['AAPL US Equity', 'MSFT US Equity', 'NVDA US Equity']; }
}

// ── MON — Monitor / Watchlist ─────────────────────────────────────────────────
export function FnMON({ panelIdx }: { panelIdx: number }) {
  const { drill } = useDrill();
  const { state } = useTerminalStore();
  const [list, setList] = useState(() => getMonitorList());
  const [input, setInput] = useState('');

  const rows = useMemo(() => list.map((sym) => {
    const ticker = sym.split(' ')[0] ?? sym;
    const h = hash(sym);
    const lq = state.quotes.find((q) => q.symbol.startsWith(ticker));
    const last = lq?.last ?? 100 + h % 200;
    const pct = lq?.pct ?? ((h % 200) - 100) / 100;
    const vol = lq?.volumeM ?? 20 + h % 80;
    const vwap = state.workerAnalytics?.vwapBySymbol[ticker + ' US'] ?? last - 0.12;
    return { sym, ticker, last, pct, vol, vwap };
  }), [list, state.quotes, state.tickMs]);

  const addSym = () => {
    const s = input.trim();
    if (!s) return;
    const full = s.includes(' ') ? s : s + ' US Equity';
    const next = [full, ...list].slice(0, 50);
    setList(next);
    try { localStorage.setItem('vantage-monitor-list', JSON.stringify(next)); } catch {}
    setInput('');
  };

  const removeSym = (sym: string) => {
    const next = list.filter((s) => s !== sym);
    setList(next);
    try { localStorage.setItem('vantage-monitor-list', JSON.stringify(next)); } catch {}
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title="MON • Monitor / Watchlist" />
      <div className="flex items-center flex-none"
        style={{ height: DENSITY.commandBarHeightPx, background: '#111', borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSym(); }}
          placeholder="AAPL US Equity  or  IBM US" className="flex-1 bg-transparent outline-none"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={addSym} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentGreen}`, padding: '0 4px', cursor: 'pointer' }}>ADD</button>
      </div>
      {/* Column headers */}
      <div className="flex-none grid select-none" style={{ gridTemplateColumns: '1fr 80px 60px 60px 70px 16px', height: DENSITY.rowHeightPx, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        {['Security', 'Last', '%Chg', 'Vol(M)', 'VWAP', ''].map((h, i) => (
          <span key={i} className="px-[2px]" style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>{h}</span>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {rows.map((row, ri) => {
          const entity = makeSecurity(row.sym, row.ticker);
          return (
            <div key={row.sym} className="grid items-center cursor-pointer hover:bg-[#0a1520]"
              style={{ gridTemplateColumns: '1fr 80px 60px 60px 70px 16px', height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: ri % 2 === 1 ? '#060606' : DENSITY.bgBase }}
              onClick={(e) => drill(entity, e.shiftKey ? 'OPEN_IN_NEW_PANEL' : 'OPEN_IN_PLACE', panelIdx)}
              onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}>
              <span className="px-[2px] truncate" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault }}>{row.ticker}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{row.last.toFixed(2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: row.pct >= 0 ? DENSITY.accentGreen : DENSITY.accentRed, fontSize: DENSITY.fontSizeDefault }}>
                {(row.pct >= 0 ? '+' : '') + row.pct.toFixed(2) + '%'}
              </span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{row.vol.toFixed(1)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{row.vwap.toFixed(2)}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); removeSym(row.sym); }}
                style={{ color: DENSITY.textMuted, fontSize: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>No symbols. Type above and press Enter.</div>}
      </div>
    </div>
  );
}

// ── WS — Workspace manager ─────────────────────────────────────────────────────
export function FnWS({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel } = useTerminalOS();
  const [workspaces, setWorkspaces] = useState(() => listWorkspaces());
  const [newName, setNewName] = useState('');

  const doSave = () => {
    const n = newName.trim() || 'DEFAULT';
    saveWorkspace(n, {
      panels: panels.map((p) => ({
        activeSecurity: p.activeSecurity,
        activeMnemonic: p.activeMnemonic,
        marketSector: p.marketSector,
        timeframe: p.timeframe,
        scrollPosition: p.scrollPosition,
        selectionCursor: p.selectionCursor,
        historyLength: p.history.length,
      })),
    });
    setWorkspaces(listWorkspaces());
    setNewName('');
  };

  const doLoad = (ws: ReturnType<typeof listWorkspaces>[number]) => {
    ws.panels.forEach((p, idx) => {
      if (idx < 4) navigatePanel(idx, p.activeMnemonic, p.activeSecurity, p.marketSector as Parameters<typeof navigatePanel>[3]);
    });
  };

  const doDelete = (name: string) => {
    deleteWorkspace(name);
    setWorkspaces(listWorkspaces());
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title="WS • Workspaces" />
      <div className="flex items-center flex-none"
        style={{ height: DENSITY.commandBarHeightPx, background: '#111', borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSave(); }}
          placeholder="Workspace name (Enter to save current layout)"
          className="flex-1 bg-transparent outline-none" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={doSave} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny, background: 'none', border: `1px solid ${DENSITY.accentGreen}`, padding: '0 4px', cursor: 'pointer' }}>SAVE</button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {workspaces.length === 0 && (
          <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
            No saved workspaces. Type a name above and press SAVE to save your current 4-panel layout.
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
