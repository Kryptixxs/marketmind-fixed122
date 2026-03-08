'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { PanelCommandLine } from './PanelCommandLine';
import { PanelMenuOverlay, PanelHelpOverlay } from './PanelOverlays';
import { HLSearchOverlay } from './HLSearchOverlay';
import { NextActionsStrip } from './ui/NextActionsStrip';
import { PanelFiller } from './fillers/PanelFillers';
import {
  getDockLayout,
  setDockLayout,
  setPanelFloating,
  subscribeDockLayout,
  insertPaneRelative,
  closePaneInDock,
  setActiveDockTab,
} from './dockLayoutStore';
import { TILE_HOTKEY_EVENT, type TileHotkeyEventDetail } from './ui/TileLayout';

const LINK_COLORS: Record<string, string> = { red: '#f00', green: '#0f0', blue: '#08f', yellow: '#ff0' };
const LINK_CYCLE = [null, 'red', 'green', 'blue', 'yellow'] as const;

// Dynamic hints computed at render time, not a static constant

function PanelHeader({ panelIdx }: { panelIdx: number }) {
  const { panels, focusedPanel, dispatchPanel, addPanel, closePanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const isFocused = focusedPanel === panelIdx;
  const [dock, setDock] = React.useState(() => getDockLayout());
  React.useEffect(() => subscribeDockLayout(() => setDock(getDockLayout())), []);

  const linkIdx = LINK_CYCLE.indexOf(p.linkGroup as typeof LINK_CYCLE[number]);
  const toggleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = LINK_CYCLE[(linkIdx + 1) % LINK_CYCLE.length] ?? null;
    dispatchPanel(panelIdx, { type: 'SET_LINK_GROUP', color: next });
  };

  return (
    <div
      className="flex items-center justify-between flex-none select-none"
      style={{ height: DENSITY.panelHeaderHeightPx, background: DENSITY.bgHeader, borderBottom: `1px solid ${DENSITY.borderColor}`, padding: `0 ${DENSITY.pad4}px`, fontFamily: DENSITY.fontFamily }}
    >
      <div className="flex items-center gap-1 min-w-0 truncate">
        <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, flexShrink: 0 }}>P{panelIdx + 1}</span>
        <span style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeMicro, fontWeight: 700, flexShrink: 0 }}>{p.activeMnemonic}</span>
        <span style={{ color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeMicro, flexShrink: 0 }}>—</span>
        <span className="truncate" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeMicro }}>{p.activeSecurity}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.accentCyan}`, padding: '0 2px' }}>SIM</span>
        {isFocused && <span style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>FOCUS</span>}
        <span className="tabular-nums" style={{ color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny }}>{p.timeframe}</span>
        <button type="button" title="Toggle float" onClick={(e) => { e.stopPropagation(); setPanelFloating(panelIdx, !dock.floatingPanels.includes(panelIdx)); }}
          style={{ background: 'none', border: 'none', color: DENSITY.textSecondary, cursor: 'pointer', fontSize: DENSITY.fontSizeTiny }}>◱</button>
        <button type="button" title="New tab pane (NP)" onClick={(e) => {
          e.stopPropagation();
          const next = addPanel(panelIdx);
          insertPaneRelative(panelIdx, next, 'tab');
          setActiveDockTab(next);
        }}
          style={{ background: 'none', border: 'none', color: DENSITY.textSecondary, cursor: 'pointer', fontSize: DENSITY.fontSizeTiny }}>＋</button>
        <button type="button" title="Split pane horizontally" onClick={(e) => {
          e.stopPropagation();
          const next = addPanel(panelIdx);
          insertPaneRelative(panelIdx, next, 'split-horizontal');
          setActiveDockTab(next);
        }}
          style={{ background: 'none', border: 'none', color: DENSITY.textSecondary, cursor: 'pointer', fontSize: DENSITY.fontSizeTiny }}>H</button>
        <button type="button" title="Split pane vertically" onClick={(e) => {
          e.stopPropagation();
          const next = addPanel(panelIdx);
          insertPaneRelative(panelIdx, next, 'split-vertical');
          setActiveDockTab(next);
        }}
          style={{ background: 'none', border: 'none', color: DENSITY.textSecondary, cursor: 'pointer', fontSize: DENSITY.fontSizeTiny }}>V</button>
        <button type="button" title="Close pane" onClick={(e) => { e.stopPropagation(); closePaneInDock(panelIdx); closePanel(panelIdx); }}
          style={{ background: 'none', border: 'none', color: DENSITY.textSecondary, cursor: 'pointer', fontSize: DENSITY.fontSizeTiny }}>✕</button>
        <button
          type="button"
          onClick={toggleLink}
          title={p.linkGroup ? `Link: ${p.linkGroup}` : 'No link group'}
          style={{ width: 10, height: 10, flexShrink: 0, background: p.linkGroup ? LINK_COLORS[p.linkGroup] : DENSITY.borderColor, border: `1px solid ${DENSITY.textDim}`, cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}

function PanelToolbar({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel, navigatePanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const canBack = p.historyIdx > 0;
  const canFwd = p.historyIdx < p.history.length - 1;
  const isFav = p.favorites.includes(`${p.activeSecurity}|${p.activeMnemonic}`);
  const [showRecents, setShowRecents] = React.useState(false);

  return (
    <div
      className="flex items-center flex-none select-none relative"
      style={{ height: DENSITY.toolbarHeightPx, background: DENSITY.panelBg, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 1, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary }}
    >
      <button type="button" disabled={!canBack} onClick={() => dispatchPanel(panelIdx, { type: 'GO_BACK' })}
        className="px-1 disabled:opacity-20 hover:text-white" title="Back (Ctrl+B)" style={{ background: 'none', border: 'none', cursor: canBack ? 'pointer' : 'default' }}>◀</button>
      <button type="button" disabled={!canFwd} onClick={() => dispatchPanel(panelIdx, { type: 'GO_FORWARD' })}
        className="px-1 disabled:opacity-20 hover:text-white" title="Forward (Ctrl+Shift+B)" style={{ background: 'none', border: 'none', cursor: canFwd ? 'pointer' : 'default' }}>▶</button>
      <span style={{ width: 1, height: 10, background: DENSITY.gridlineColor, margin: '0 2px' }} />
      <button type="button" onClick={() => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: p.overlayMode === 'menu' ? 'none' : 'menu' })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>MENU</button>
      <button type="button" onClick={() => dispatchPanel(panelIdx, { type: 'PRESS_HELP' })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>HELP</button>
      <button type="button" onClick={() => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'search' })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>HL</button>
      <button type="button" onClick={() => dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: 'GRAB' })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>GRAB</button>
      <span style={{ width: 1, height: 10, background: DENSITY.gridlineColor, margin: '0 2px' }} />
      <div className="relative">
        <button type="button" onClick={() => setShowRecents(!showRecents)}
          className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          RECENT {showRecents ? '▲' : '▼'}
        </button>
        {showRecents && (
          <div className="absolute top-full left-0"
            style={{ background: DENSITY.panelBgAlt, border: `1px solid ${DENSITY.borderColor}`, zIndex: 40, minWidth: 180 }}
            onMouseLeave={() => setShowRecents(false)}>
            {p.recentSecurities.slice(0, 8).map((s) => (
              <button key={s} type="button"
                className="w-full text-left px-2"
                style={{ height: DENSITY.rowHeightPx, color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                onClick={() => { navigatePanel(panelIdx, p.activeMnemonic, s); setShowRecents(false); }}
              >{s}</button>
            ))}
            {p.recentSecurities.length === 0 && <div style={{ padding: 4, color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>No recent securities</div>}
          </div>
        )}
      </div>
      <button type="button"
        onClick={() => dispatchPanel(panelIdx, { type: 'TOGGLE_FAVORITE', item: `${p.activeSecurity}|${p.activeMnemonic}` })}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        style={{ color: isFav ? '#FFD700' : DENSITY.textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>★</button>
      <span style={{ marginLeft: 'auto', color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>
        {p.historyIdx + 1}/{p.history.length}
      </span>
      <button type="button" onClick={() => setDockLayout({ focusFullscreen: !getDockLayout().focusFullscreen })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer', color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny }}>FOCUS+</button>
    </div>
  );
}

function BreadcrumbStrip({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const ticker = p.activeSecurity.split(' ').slice(0, 2).join(' ');
  const region = p.activeSecurity.includes(' US ') ? 'US' : p.activeSecurity.includes(' JP ') ? 'JP' : p.activeSecurity.includes(' LN ') ? 'UK' : 'GLB';
  const crumbs = [
    { label: p.marketSector, action: () => navigatePanel(panelIdx, 'IMAP') },
    { label: region, action: () => navigatePanel(panelIdx, 'RGN') },
    { label: ticker, action: () => navigatePanel(panelIdx, 'DES') },
    { label: p.activeMnemonic, action: () => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'menu' }) },
  ];
  return (
    <div className="flex items-center flex-none truncate"
      style={{ height: 13, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.groupSeparator}`, padding: `0 ${DENSITY.pad4}px`, fontFamily: DENSITY.fontFamily, fontSize: '8px', color: DENSITY.textDim }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ margin: '0 3px', opacity: 0.5 }}>›</span>}
          <button type="button" onClick={(e) => { e.stopPropagation(); c.action(); }}
            className="hover:text-white"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: i >= 2 ? DENSITY.textPrimary : DENSITY.textSecondary, fontSize: '8px', fontFamily: DENSITY.fontFamily, padding: 0 }}>
            {c.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

const MNEMONIC_HINTS: Record<string, string> = {
  GP:   'TF=1Y/5D/1M/etc  •  vs box=Compare  •  Crosshair=OHLC',
  GIP:  'Intraday bars  •  Crosshair=OHLC  •  Open line marked',
  FA:   'Click tab=IS/BS/CF  •  Enter=Drill field  •  ↑↓=Navigate',
  ORD:  'BUY/SELL toggle  •  MKT/LMT type  •  KILL=Cancel',
  HP:   'PgDn=Next page  •  Click col=Sort  •  Enter=Drill security',
  WEI:  '↑↓=Select  •  Enter=Chart  •  Shift+Enter=Send  •  Click col=Sort',
  IMAP: 'Click tile=RELS  •  Shift+Click=New panel',
  FXC:  'Click cell=DES  •  Right-click=Actions',
};
const DEFAULT_HINT = 'ENTER=Drill  SHIFT+ENTER=SendPanel  ALT+ENTER=Inspect  ↑↓=Select  PgDn=Scroll';

function KeyboardHintStrip({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const mn = panels[panelIdx]!.activeMnemonic;
  const hint = MNEMONIC_HINTS[mn] ?? 'ENTER Drill | SHIFT+ENTER Send | ALT+ENTER Inspect | F2 MENU | F1 HELP | Ctrl+K HL';
  return (
    <div style={{ height: 12, background: DENSITY.panelBg, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, display: 'flex', alignItems: 'center', flexShrink: 0, fontFamily: DENSITY.fontFamily, fontSize: '8px', color: DENSITY.textDim, overflow: 'hidden' }}>
      {hint}
    </div>
  );
}

export function NewPanelFrame({ panelIdx, children }: { panelIdx: number; children: React.ReactNode }) {
  const { panels, focusedPanel, setFocusedPanel, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const isFocused = focusedPanel === panelIdx;

  React.useEffect(() => {
    if (!isFocused) return;
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };
    const dispatchTileHotkey = (type: TileHotkeyEventDetail['type']) => {
      const evt = new CustomEvent<TileHotkeyEventDetail>(TILE_HOTKEY_EVENT, {
        detail: { panelIdx, type },
        cancelable: true,
      });
      return !window.dispatchEvent(evt) || evt.defaultPrevented;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ';') {
        if (dispatchTileHotkey('cycle')) {
          e.preventDefault();
          return;
        }
      }
      if (!isTypingTarget(e.target) && (e.key === 'Enter' || e.key === 'Return')) {
        const tileType = e.altKey ? 'inspect' : e.shiftKey ? 'enter_new_pane' : 'enter';
        if (dispatchTileHotkey(tileType)) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (p.overlayMode !== 'none') dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' });
        else dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      } else if (e.key === 'F1') {
        e.preventDefault();
        dispatchPanel(panelIdx, { type: 'PRESS_HELP' });
      } else if (e.key === 'F2') {
        if (dispatchTileHotkey('menu')) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: p.overlayMode === 'menu' ? 'none' : 'menu' });
      } else if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'search' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFocused, panelIdx, p.overlayMode, dispatchPanel]);

  return (
    <div
      data-panel-idx={panelIdx}
      className="flex flex-col min-h-0 min-w-0 overflow-hidden relative"
      style={{ background: DENSITY.panelBg, border: `1px solid ${isFocused ? DENSITY.focusBorderColor : DENSITY.borderColor}` }}
      onClick={() => setFocusedPanel(panelIdx)}
    >
      <PanelHeader panelIdx={panelIdx} />
      <PanelToolbar panelIdx={panelIdx} />
      <BreadcrumbStrip panelIdx={panelIdx} />
      <NextActionsStrip panelIdx={panelIdx} />
      <KeyboardHintStrip panelIdx={panelIdx} />
      <PanelCommandLine panelIdx={panelIdx} isFocused={isFocused} />

      {/* Function body */}
      <div className="flex-1 min-h-0 overflow-hidden relative" style={{ background: DENSITY.panelBg }}>
        <div className="h-full min-h-0 overflow-auto terminal-scrollbar">
          {children}
          <PanelFiller panelIdx={panelIdx} />
        </div>
        {p.overlayMode === 'menu' && <PanelMenuOverlay panelIdx={panelIdx} />}
        {(p.overlayMode === 'help' || p.overlayMode === 'help-desk') && <PanelHelpOverlay panelIdx={panelIdx} />}
        {p.overlayMode === 'search' && <HLSearchOverlay panelIdx={panelIdx} />}
        {/* 'inspector' mode is rendered globally by TerminalInspector — no local overlay needed */}
      </div>
    </div>
  );
}
