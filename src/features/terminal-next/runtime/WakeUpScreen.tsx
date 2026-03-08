'use client';

import React, { useState, useCallback } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { listWorkspaces } from './workspaceManager';

const QUICK_START: Array<{ cmd: string; title: string; category: string }> = [
  { cmd: 'AAPL US DES GO',     title: 'Apple — Description & Fundamentals',    category: 'Equity' },
  { cmd: 'WEI GO',             title: 'World Equity Indices Monitor',            category: 'Global' },
  { cmd: 'TOP GO',             title: 'Top News Headlines',                      category: 'News' },
  { cmd: 'EURUSD Curncy GP GO',title: 'EUR/USD Daily Price Chart',               category: 'FX' },
  { cmd: 'MSFT US OWN GO',     title: 'Microsoft Institutional Ownership',       category: 'Equity' },
  { cmd: 'ECO GO',             title: 'Economic Calendar',                       category: 'Macro' },
  { cmd: 'NVDA US FA GO',      title: 'NVIDIA Financial Statements',             category: 'Equity' },
  { cmd: 'GEO GO',             title: 'Global Intelligence Map',                 category: 'Geo' },
  { cmd: 'CHAIN GO',           title: 'Options Chain (current security)',         category: 'Derivatives' },
  { cmd: 'PORT GO',            title: 'Portfolio Monitor',                       category: 'Portfolio' },
  { cmd: 'MON+ GO',            title: 'Monitor Builder — Custom Watchlist',      category: 'Monitor' },
  { cmd: 'NAVTREE GO',         title: 'Browse All 2,900+ Functions',             category: 'Discovery' },
  { cmd: 'TUTOR GO',           title: 'Interactive Guided Tutorial',             category: 'Help' },
];

const WORKFLOW_RECIPES: Array<{ name: string; cmds: Array<[string, string]> }> = [
  {
    name: 'Equity Deep Dive',
    cmds: [
      ['DES', 'Fundamentals'],
      ['FA',  'Financials'],
      ['OWN', 'Ownership'],
      ['CN',  'Company News'],
      ['GP',  'Price Chart'],
    ],
  },
  {
    name: 'Market Overview',
    cmds: [
      ['WEI',  'World Indices'],
      ['TOP',  'Top News'],
      ['ECO',  'Calendar'],
      ['IMAP', 'Sector Heat'],
      ['GEO',  'Global Map'],
    ],
  },
  {
    name: 'Fixed Income',
    cmds: [
      ['CURV', 'Yield Curve'],
      ['GOVT', 'Govt Bonds'],
      ['CDS',  'Credit Default'],
      ['HY',   'High Yield'],
      ['TOP',  'Headlines'],
    ],
  },
];

const KEYBOARD_REFERENCE = [
  ['Enter',          'Execute command / drill selected row'],
  ['Shift+Enter',    'Open in new pane'],
  ['Alt+Enter',      'Open Inspector overlay'],
  ['F1',             'Contextual help for current function'],
  ['F2',             'Function menu — next actions'],
  ['Ctrl+K',         'Search — securities, functions, fields'],
  ['Ctrl+B',         'Navigate back in panel history'],
  ['Ctrl+L',         'Focus command line'],
  ['Alt+1…9',        'Jump to pane 1–9'],
  ['Ctrl+`',         'Cycle pane focus'],
  ['Esc',            'Close overlay / clear command'],
];

export function WakeUpScreen({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel, navigatePanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [activeTab, setActiveTab] = useState<'start' | 'workflow' | 'keyboard' | 'history'>('start');
  const workspaces = listWorkspaces().slice(0, 6);

  const run = useCallback((cmd: string) => {
    const raw = cmd.replace(/ GO$/, '').trim().toUpperCase();
    const parts = raw.split(' ');
    const MNEMONICS = new Set(['WEI','TOP','DES','HP','GP','GIP','FA','CN','OWN','RELS','MGMT',
      'DVD','EVT','ECO','FXC','IMAP','ALRT','BLTR','ORD','IB','ANR','CHAIN','PORT','MON+',
      'NAVTREE','GEO','CURV','GOVT','CDS','HY','IMAP']);
    const mnemonic = parts.find((t) => MNEMONICS.has(t)) ?? parts[parts.length - 1] ?? 'DES';
    const mnIdx = parts.indexOf(mnemonic);
    const secParts = parts.slice(0, mnIdx > 0 ? mnIdx : undefined).filter((t) =>
      !['GO','EQUITY','CORP','CURNCY','INDEX','COMDTY','US','LN','JP','GY'].includes(t)
    );
    const security = mnIdx > 0
      ? parts.slice(0, mnIdx).join(' ')
      : (secParts.length ? secParts.join(' ') + ' Equity' : p.activeSecurity);
    navigatePanel(panelIdx, mnemonic, security || p.activeSecurity);
    dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
  }, [panelIdx, p.activeSecurity, navigatePanel, dispatchPanel]);

  const D = DENSITY;

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: `0 14px`,
    height: 28,
    background: active ? D.bgSurface : 'transparent',
    border: 'none',
    borderBottom: active ? `2px solid ${D.accentAmber}` : `2px solid transparent`,
    color: active ? D.accentAmber : D.textSecondary,
    fontSize: D.fontSizeTiny,
    fontFamily: D.fontFamily,
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    letterSpacing: '0.05em',
  });

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: D.fontFamily, background: D.bgBase, color: D.textPrimary }}>

      {/* ── Brand header ────────────────────────────────────── */}
      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${D.borderColor}`, background: D.bgSurface }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: D.accentAmber, fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em' }}>
              MARKETMIND TERMINAL
            </div>
            <div style={{ color: D.textSecondary, fontSize: D.fontSizeTiny, marginTop: 2 }}>
              Panel {panelIdx + 1} — Ready for input &nbsp;·&nbsp;
              <span style={{ color: D.accentGreen }}>● B-PIPE SIM</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: D.textDim, fontSize: D.fontSizeTiny }}>
              Ctrl+K — global search
            </div>
            <div style={{ color: D.textDim, fontSize: D.fontSizeTiny, marginTop: 1 }}>
              F2 — function menu &nbsp;·&nbsp; F1 — help
            </div>
          </div>
        </div>

        {/* ── Inline quick command prompt ────────────────── */}
        <div
          className="flex items-center gap-2 mt-3"
          style={{ padding: '4px 8px', background: D.bgSurfaceAlt, border: `1px solid ${D.borderColor}` }}
        >
          <span style={{ color: D.accentAmber, fontSize: D.fontSizeTiny, fontWeight: 700 }}>{panelIdx + 1}&gt;</span>
          <input
            autoFocus={panelIdx === 0}
            value={p.commandInput}
            onChange={(e) => dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); run(p.commandInput || 'WEI GO'); }
            }}
            placeholder="AAPL US DES GO   or   WEI GO   or   Ctrl+K to search"
            className="flex-1 bg-transparent outline-none border-none"
            style={{ color: D.accentAmber, fontSize: D.fontSizeDefault }}
            autoComplete="off" spellCheck={false}
          />
          <button
            type="button"
            onClick={() => run(p.commandInput || 'WEI GO')}
            style={{ background: D.accentAmber, color: '#000', border: 'none', padding: '2px 10px', fontWeight: 700, fontSize: D.fontSizeTiny, cursor: 'pointer', fontFamily: D.fontFamily }}
          >
            GO
          </button>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex items-end flex-none" style={{ background: D.bgSurface, borderBottom: `1px solid ${D.borderColor}` }}>
        {(['start', 'workflow', 'keyboard', 'history'] as const).map((tab) => (
          <button key={tab} type="button" style={TAB_STYLE(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'start' ? 'Quick Start' : tab === 'workflow' ? 'Workflows' : tab === 'keyboard' ? 'Keyboard' : 'History'}
          </button>
        ))}
        {workspaces.length > 0 && (
          <div className="flex items-center gap-1 ml-auto px-3" style={{ fontSize: D.fontSizeTiny, color: D.textDim }}>
            Workspaces:
            {workspaces.map((ws) => (
              <button key={ws.name} type="button"
                onClick={() => navigatePanel(panelIdx, `WS ${ws.name}`)}
                style={{ color: D.accentCyan, background: 'none', border: `1px solid ${D.borderColor}`, padding: '0 5px', cursor: 'pointer', fontSize: D.fontSizeTiny, fontFamily: D.fontFamily }}
              >
                {ws.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto" style={{ padding: '0' }}>

        {/* Quick Start */}
        {activeTab === 'start' && (
          <div>
            <div style={{ padding: '6px 12px 4px', color: D.textDim, fontSize: D.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${D.gridlineColor}`, background: D.bgSurfaceAlt }}>
              Click any example to run immediately
            </div>
            {QUICK_START.map((ex, i) => (
              <div key={ex.cmd}
                className="flex items-center cursor-pointer"
                onClick={() => run(ex.cmd)}
                style={{
                  height: DENSITY.rowHeightPx + 2,
                  borderBottom: `1px solid ${D.gridlineColor}`,
                  padding: '0 12px',
                  background: i % 2 === 1 ? D.rowZebra : D.panelBg,
                  gap: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = D.rowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? D.rowZebra : D.panelBg)}
              >
                <span style={{ color: D.textDim, fontSize: D.fontSizeTiny, width: 90, flexShrink: 0 }}>{ex.category}</span>
                <span style={{ color: D.accentAmber, fontSize: D.fontSizeDefault, width: 200, flexShrink: 0, fontWeight: 600 }}>{ex.cmd}</span>
                <span style={{ color: D.textSecondary, fontSize: D.fontSizeDefault }}>{ex.title}</span>
                <span style={{ marginLeft: 'auto', color: D.textDim, fontSize: D.fontSizeTiny }}>click to run →</span>
              </div>
            ))}
            <div style={{ padding: '8px 12px', color: D.textDim, fontSize: D.fontSizeTiny, borderTop: `1px solid ${D.gridlineColor}` }}>
              Tip: Use <span style={{ color: D.accentAmber }}>Ctrl+K</span> to search 2,900+ functions by name, category, or keyword.
              Use <span style={{ color: D.accentAmber }}>NAVTREE GO</span> to browse the full function catalog.
            </div>
          </div>
        )}

        {/* Workflow Recipes */}
        {activeTab === 'workflow' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, padding: 1, background: D.gridlineColor }}>
            {WORKFLOW_RECIPES.map((wf) => (
              <div key={wf.name} style={{ background: D.panelBg, padding: '10px 12px' }}>
                <div style={{ color: D.accentAmber, fontSize: D.fontSizeHeader, fontWeight: 700, marginBottom: 6 }}>{wf.name}</div>
                {wf.cmds.map(([code, label]) => (
                  <div key={code}
                    className="flex items-center cursor-pointer"
                    onClick={() => navigatePanel(panelIdx, code, p.activeSecurity)}
                    style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${D.gridlineColor}`, gap: 8 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = D.rowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: D.accentCyan, fontSize: D.fontSizeDefault, width: 50, fontWeight: 700 }}>{code}</span>
                    <span style={{ color: D.textSecondary, fontSize: D.fontSizeDefault }}>{label}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, color: D.textDim, fontSize: D.fontSizeTiny }}>
                  Security: <span style={{ color: D.textSecondary }}>{p.activeSecurity}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard Reference */}
        {activeTab === 'keyboard' && (
          <div>
            <div style={{ padding: '6px 12px 4px', color: D.textDim, fontSize: D.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${D.gridlineColor}`, background: D.bgSurfaceAlt }}>
              Universal keyboard shortcuts — work in every panel
            </div>
            {KEYBOARD_REFERENCE.map(([key, desc], i) => (
              <div key={key}
                style={{
                  height: DENSITY.rowHeightPx + 2,
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0 12px',
                  borderBottom: `1px solid ${D.gridlineColor}`,
                  background: i % 2 === 1 ? D.rowZebra : D.panelBg,
                }}
              >
                <span style={{ color: D.accentAmber, fontSize: D.fontSizeDefault, width: 140, fontWeight: 700, flexShrink: 0 }}>{key}</span>
                <span style={{ color: D.textSecondary, fontSize: D.fontSizeDefault }}>{desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div>
            <div style={{ padding: '6px 12px 4px', color: D.textDim, fontSize: D.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${D.gridlineColor}`, background: D.bgSurfaceAlt }}>
              Panel {panelIdx + 1} navigation history — click to replay
            </div>
            {p.history.length <= 1 ? (
              <div style={{ padding: '16px 12px', color: D.textDim, fontSize: D.fontSizeDefault }}>
                No history yet. Run a command to begin.
              </div>
            ) : (
              [...p.history].reverse().slice(0, 30).map((h, i) => (
                <div key={`${h.ts}-${i}`}
                  className="flex items-center cursor-pointer"
                  onClick={() => navigatePanel(panelIdx, h.mnemonic, h.security, h.sector)}
                  style={{
                    height: DENSITY.rowHeightPx + 2,
                    borderBottom: `1px solid ${D.gridlineColor}`,
                    padding: '0 12px',
                    background: i % 2 === 1 ? D.rowZebra : D.panelBg,
                    gap: 12,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = D.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? D.rowZebra : D.panelBg)}
                >
                  <span style={{ color: D.textDim, width: 75, fontSize: D.fontSizeTiny, flexShrink: 0 }}>
                    {new Date(h.ts).toLocaleTimeString()}
                  </span>
                  <span style={{ color: D.accentAmber, width: 60, fontSize: D.fontSizeDefault, fontWeight: 700, flexShrink: 0 }}>{h.mnemonic}</span>
                  <span style={{ color: D.textPrimary, fontSize: D.fontSizeDefault }}>{h.security}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Guide download footer */}
      <div style={{
        borderTop: `1px solid ${D.borderColor}`,
        padding: '6px 12px',
        background: D.bgSurface,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{ color: D.textDim, fontSize: D.fontSizeTiny }}>📖</span>
        <a
          href="/user-guide/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: D.accentCyan, fontSize: D.fontSizeTiny, textDecoration: 'none', fontWeight: 600 }}
        >
          Open Full User Guide ↗
        </a>
        <span style={{ color: D.textDim, fontSize: D.fontSizeTiny }}>·</span>
        <a
          href="/user-guide/index.html"
          download="MarketMind-Terminal-User-Guide.html"
          style={{ color: D.accentAmber, fontSize: D.fontSizeTiny, textDecoration: 'none', fontWeight: 600 }}
        >
          ⬇ Download HTML Guide
        </a>
        <span style={{ marginLeft: 'auto', color: D.textDim, fontSize: D.fontSizeTiny }}>
          Or type <span style={{ color: D.accentAmber }}>TUTOR GO</span> for the interactive walkthrough
        </span>
      </div>
    </div>
  );
}
