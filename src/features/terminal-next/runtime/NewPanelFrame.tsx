'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { PanelCommandLine } from './PanelCommandLine';
import { PanelMenuOverlay, PanelHelpOverlay } from './PanelOverlays';
import { HLSearchOverlay } from './HLSearchOverlay';
import { NextActionsStrip } from './ui/NextActionsStrip';
import { PanelFiller } from './fillers/PanelFillers';

const LINK_COLORS: Record<string, string> = { red: '#f00', green: '#0f0', blue: '#08f', yellow: '#ff0' };
const LINK_CYCLE = [null, 'red', 'green', 'blue', 'yellow'] as const;

// Dynamic hints computed at render time, not a static constant

function PanelHeader({ panelIdx }: { panelIdx: number }) {
  const { panels, focusedPanel, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const isFocused = focusedPanel === panelIdx;

  const linkIdx = LINK_CYCLE.indexOf(p.linkGroup as typeof LINK_CYCLE[number]);
  const toggleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = LINK_CYCLE[(linkIdx + 1) % LINK_CYCLE.length] ?? null;
    dispatchPanel(panelIdx, { type: 'SET_LINK_GROUP', color: next });
  };

  return (
    <div
      className="flex items-center justify-between flex-none select-none"
      style={{ height: DENSITY.panelHeaderHeightPx, background: DENSITY.bgHeader, padding: `0 ${DENSITY.pad4}px`, fontFamily: DENSITY.fontFamily }}
    >
      <div className="flex items-center gap-1 min-w-0 truncate">
        <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, flexShrink: 0 }}>P{panelIdx + 1}</span>
        <span style={{ color: '#fff', fontSize: DENSITY.fontSizeMicro, fontWeight: 700, flexShrink: 0 }}>{p.activeMnemonic}</span>
        <span style={{ color: '#aaa', fontSize: DENSITY.fontSizeMicro, flexShrink: 0 }}>—</span>
        <span className="truncate" style={{ color: '#e6e6e6', fontSize: DENSITY.fontSizeMicro }}>{p.activeSecurity}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.accentCyan}`, padding: '0 2px' }}>SIM</span>
        {isFocused && <span style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>FOCUS</span>}
        <span className="tabular-nums" style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>{p.timeframe}</span>
        <button
          type="button"
          onClick={toggleLink}
          title={p.linkGroup ? `Link: ${p.linkGroup}` : 'No link group'}
          style={{ width: 10, height: 10, flexShrink: 0, background: p.linkGroup ? LINK_COLORS[p.linkGroup] : '#222', border: '1px solid #444', cursor: 'pointer' }}
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
      style={{ height: DENSITY.toolbarHeightPx, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 1, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textDim }}
    >
      <button type="button" disabled={!canBack} onClick={() => dispatchPanel(panelIdx, { type: 'GO_BACK' })}
        className="px-1 disabled:opacity-20 hover:text-white" title="Back (Ctrl+B)" style={{ background: 'none', border: 'none', cursor: canBack ? 'pointer' : 'default' }}>◀</button>
      <button type="button" disabled={!canFwd} onClick={() => dispatchPanel(panelIdx, { type: 'GO_FORWARD' })}
        className="px-1 disabled:opacity-20 hover:text-white" title="Forward (Ctrl+Shift+B)" style={{ background: 'none', border: 'none', cursor: canFwd ? 'pointer' : 'default' }}>▶</button>
      <span style={{ width: 1, height: 10, background: DENSITY.gridlineColor, margin: '0 2px' }} />
      <button type="button" onClick={() => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: p.overlayMode === 'menu' ? 'none' : 'menu' })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>MENU</button>
      <button type="button" onClick={() => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'search' })}
        className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>HL</button>
      <span style={{ width: 1, height: 10, background: DENSITY.gridlineColor, margin: '0 2px' }} />
      <div className="relative">
        <button type="button" onClick={() => setShowRecents(!showRecents)}
          className="px-1 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          RECENT {showRecents ? '▲' : '▼'}
        </button>
        {showRecents && (
          <div className="absolute top-full left-0"
            style={{ background: '#0a0a0a', border: `1px solid ${DENSITY.borderColor}`, zIndex: 40, minWidth: 180 }}
            onMouseLeave={() => setShowRecents(false)}>
            {p.recentSecurities.slice(0, 8).map((s) => (
              <button key={s} type="button"
                className="w-full text-left px-2 hover:bg-[#1a2a3a]"
                style={{ height: DENSITY.rowHeightPx, color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                onClick={() => { navigatePanel(panelIdx, p.activeMnemonic, s); setShowRecents(false); }}
              >{s}</button>
            ))}
            {p.recentSecurities.length === 0 && <div style={{ padding: 4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>No recent securities</div>}
          </div>
        )}
      </div>
      <button type="button"
        onClick={() => dispatchPanel(panelIdx, { type: 'TOGGLE_FAVORITE', item: `${p.activeSecurity}|${p.activeMnemonic}` })}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        style={{ color: isFav ? '#FFD700' : DENSITY.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>★</button>
      <span style={{ marginLeft: 'auto', color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
        {p.historyIdx + 1}/{p.history.length}
      </span>
    </div>
  );
}

function BreadcrumbStrip({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const ticker = p.activeSecurity.split(' ').slice(0, 2).join(' ');
  const crumbs = [
    { label: p.marketSector, action: () => navigatePanel(panelIdx, 'IMAP') },
    { label: ticker, action: () => navigatePanel(panelIdx, 'DES') },
    { label: p.activeMnemonic, action: () => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'menu' }) },
  ];
  return (
    <div className="flex items-center flex-none truncate"
      style={{ height: 13, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, fontFamily: DENSITY.fontFamily, fontSize: '8px', color: DENSITY.textMuted }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ margin: '0 3px', opacity: 0.5 }}>›</span>}
          <button type="button" onClick={(e) => { e.stopPropagation(); c.action(); }}
            className="hover:text-white"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '8px', fontFamily: DENSITY.fontFamily, padding: 0 }}>
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
  const hint = MNEMONIC_HINTS[mn] ?? DEFAULT_HINT;
  return (
    <div style={{ height: 12, background: '#020202', borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, display: 'flex', alignItems: 'center', flexShrink: 0, fontFamily: DENSITY.fontFamily, fontSize: '8px', color: DENSITY.textMuted, overflow: 'hidden' }}>
      {hint}
    </div>
  );
}

export function NewPanelFrame({ panelIdx, children }: { panelIdx: number; children: React.ReactNode }) {
  const { panels, focusedPanel, setFocusedPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const isFocused = focusedPanel === panelIdx;

  return (
    <div
      className="flex flex-col min-h-0 min-w-0 overflow-hidden relative"
      style={{ background: DENSITY.bgBase, border: `1px solid ${isFocused ? DENSITY.focusBorderColor : DENSITY.gridlineColor}` }}
      onClick={() => setFocusedPanel(panelIdx)}
    >
      <PanelHeader panelIdx={panelIdx} />
      <PanelToolbar panelIdx={panelIdx} />
      <BreadcrumbStrip panelIdx={panelIdx} />
      <NextActionsStrip panelIdx={panelIdx} />
      <KeyboardHintStrip panelIdx={panelIdx} />
      <PanelCommandLine panelIdx={panelIdx} isFocused={isFocused} />

      {/* Function body */}
      <div className="flex-1 min-h-0 overflow-hidden relative" style={{ background: DENSITY.bgBase }}>
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
