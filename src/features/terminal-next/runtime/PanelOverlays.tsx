'use client';

import React, { useState, useCallback } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { MNEMONIC_DEFS } from './MnemonicRegistry';
import type { MarketSector } from './panelState';
import { useDrill } from './entities/DrillContext';
import { makeField, makeFunction, makeNews, makeSecurity } from './entities/types';
import { addToMonitorList } from './monitorListStore';
import { addAlertRule } from '../services/alertMonitor';
import { appendAuditEvent } from './commandAuditStore';
import { getCatalogMnemonic } from '../mnemonics/catalog';

const SECTOR_MENUS: Record<MarketSector, Array<{ code: string; label: string }>> = {
  EQUITY: [
    { code: 'DES', label: 'Description & Fundamentals' },
    { code: 'HP', label: 'Historical Pricing (OHLCV)' },
    { code: 'GP', label: 'Price Chart (Daily)' },
    { code: 'GIP', label: 'Intraday Chart' },
    { code: 'FA', label: 'Financial Analysis' },
    { code: 'CN', label: 'Company News' },
    { code: 'OWN', label: 'Ownership & Holders' },
    { code: 'RELS', label: 'Related Securities (Peers)' },
    { code: 'MGMT', label: 'Management Team' },
    { code: 'DVD', label: 'Dividend History' },
    { code: 'EVT', label: 'Corporate Events' },
    { code: 'ORD', label: 'Order Ticket' },
    { code: 'ALRT', label: 'Price Alerts' },
    { code: 'TOP', label: 'Top News Feed' },
    { code: 'WEI', label: 'World Equity Indices' },
    { code: 'IMAP', label: 'Sector Heatmap' },
  ],
  CORP: [
    { code: 'DES', label: 'Bond Description' },
    { code: 'HP', label: 'Price History' },
    { code: 'GP', label: 'Price Chart' },
    { code: 'GC', label: 'Yield Curve' },
    { code: 'CN', label: 'Issuer News' },
    { code: 'RELS', label: 'Related Issues' },
    { code: 'ALRT', label: 'Alerts' },
  ],
  CURNCY: [
    { code: 'DES', label: 'FX Description' },
    { code: 'GP', label: 'Rate Chart' },
    { code: 'GIP', label: 'Intraday' },
    { code: 'FXC', label: 'FX Cross Matrix' },
    { code: 'CN', label: 'FX News' },
    { code: 'ECO', label: 'Economic Calendar' },
  ],
  COMDTY: [
    { code: 'DES', label: 'Commodity Description' },
    { code: 'HP', label: 'Price History' },
    { code: 'GP', label: 'Price Chart' },
    { code: 'CN', label: 'Commodity News' },
    { code: 'ECO', label: 'Economic Calendar' },
  ],
  INDEX: [
    { code: 'DES', label: 'Index Description' },
    { code: 'HP', label: 'Historical Prices' },
    { code: 'GP', label: 'Price Chart' },
    { code: 'WEI', label: 'World Equity Indices' },
    { code: 'IMAP', label: 'Sector Heatmap' },
    { code: 'CN', label: 'Index News' },
  ],
  GOVT: [
    { code: 'DES', label: 'Bond Description' },
    { code: 'HP', label: 'Price History' },
    { code: 'GC', label: 'Yield Curve' },
    { code: 'ECO', label: 'Economic Calendar' },
  ],
  MUNI: [
    { code: 'DES', label: 'Description' },
    { code: 'HP', label: 'Price History' },
  ],
  MTGE: [
    { code: 'DES', label: 'Description' },
    { code: 'HP', label: 'Price History' },
  ],
};

const GLOBAL_MNEMONICS = [
  { code: 'WEI', label: 'World Equity Indices' },
  { code: 'GMOV', label: 'Global Movers Block' },
  { code: 'SECH', label: 'Sector Heat Block' },
  { code: 'RFCM', label: 'Rates/FX/Commod Block' },
  { code: 'CRSP', label: 'Credit Spreads Block' },
  { code: 'NINT', label: 'News Intensity Block' },
  { code: 'CAL24', label: 'Calendar 24h Block' },
  { code: 'TOP', label: 'Top News' },
  { code: 'ECO', label: 'Economic Calendar' },
  { code: 'FXC', label: 'FX Cross Matrix' },
  { code: 'IMAP', label: 'Sector Heatmap' },
  { code: 'BLTR', label: 'Blotter' },
  { code: 'ALRT', label: 'Alerts' },
  { code: 'IB', label: 'Instant Bloomberg' },
  { code: 'ANR', label: 'Analytics Monitor' },
  { code: 'STAT', label: 'System Status' },
  { code: 'LAT', label: 'Latency Monitor' },
  { code: 'CACH', label: 'Cache & Offline' },
  { code: 'ERR', label: 'Error Console' },
  { code: 'ENT', label: 'Entitlements' },
  { code: 'AUD', label: 'Audit Trail' },
  { code: 'COMP', label: 'Compliance Locks' },
  { code: 'POL', label: 'Policy Rules' },
  { code: 'LINE', label: 'Data Lineage' },
  { code: 'FLD', label: 'Field Catalog Full' },
  { code: 'MAP', label: 'Field Mapping' },
  { code: 'QLT', label: 'Data Quality' },
  { code: 'MAC', label: 'Macro Recorder' },
  { code: 'JOB', label: 'Scheduled Jobs' },
  { code: 'HOT', label: 'Hotkey Editor' },
  { code: 'TPL', label: 'Layout Templates' },
  { code: 'RPT', label: 'Report Builder' },
  { code: 'EXP', label: 'Export Center' },
  { code: 'GRAB+', label: 'Screenshot + Annotation' },
  { code: 'CLIP', label: 'Clip Library' },
  { code: 'CHAT', label: 'Panel-linked Chat' },
  { code: 'SHAR', label: 'Share Workspace / Panel' },
  { code: 'NOTE', label: 'Structured Notes' },
  { code: 'TASK', label: 'Desk Task List' },
  { code: 'TCA', label: 'Transaction Cost Analysis' },
  { code: 'VEN', label: 'Venue Map' },
  { code: 'IMP', label: 'Impact Model' },
  { code: 'KILL', label: 'Kill Switch' },
  { code: 'REG', label: 'Regime Library' },
  { code: 'SHCK', label: 'Shock Library' },
  { code: 'XAS', label: 'Cross-Asset Spread Board' },
  { code: 'CORR+', label: 'Correlation Explorer' },
  { code: 'SENT', label: 'Sentiment Tape' },
  { code: 'WEB', label: 'Web Signals' },
  { code: 'SUPP', label: 'Supply Chain Signals' },
  { code: 'ESG', label: 'ESG Snapshot' },
  { code: 'COLS', label: 'Column Sets' },
  { code: 'PIN', label: 'Pinboard Strip' },
  { code: 'NAV', label: 'Navigation Graph' },
  { code: 'NX', label: 'Next Best Actions' },
  { code: 'GEO', label: 'Global Intelligence Map' },
  { code: 'GEO.N', label: 'Geo News Heat' },
  { code: 'GEO.C', label: 'Company Footprint Map' },
  { code: 'GEO.R', label: 'Regional Risk Map' },
  { code: 'GEO.M', label: 'Macro Map' },
  { code: 'GEO.X', label: 'Cross-Border Exposure' },
  { code: 'GEO.S', label: 'Supply Chain Disruption Map' },
  { code: 'GEO.E', label: 'Energy & Commodities Map' },
  { code: 'GEO.F', label: 'Freight & Shipping Lanes' },
  { code: 'GEO.A', label: 'Alerted Regions' },
  { code: 'RELG', label: 'Relationship Graph' },
  { code: 'RELT', label: 'Relationship Table' },
  { code: 'OUT', label: 'Outbound Impact' },
  { code: 'NET', label: 'Network Stress View' },
  { code: 'EVID', label: 'Evidence Panel' },
  { code: 'PATH', label: 'Causal Path Explorer' },
  { code: 'BASK', label: 'Basket Builder' },
  { code: 'THEME', label: 'Theme Graph' },
  { code: 'SENTR', label: 'Sentiment Narrative Graph' },
  { code: 'RGN', label: 'Region Dossier' },
  { code: 'RGN.C', label: 'Region Companies' },
  { code: 'RGN.N', label: 'Region News Center' },
  { code: 'RGN.M', label: 'Region Macro Monitor' },
  { code: 'RGN.R', label: 'Region Risk Register' },
  { code: 'NMAP', label: 'News Map Overlay' },
  { code: 'NREL', label: 'News Relationship Builder' },
  { code: 'NEX', label: 'News Exposures' },
  { code: 'NTIM', label: 'News Timeline Reaction' },
  { code: 'NQ', label: 'News Query Language' },
  { code: 'SCN', label: 'Supply Chain Network' },
  { code: 'SCN.R', label: 'Supply Chain Risk Monitor' },
  { code: 'FAC', label: 'Facility List' },
  { code: 'CUST', label: 'Customer Concentration' },
  { code: 'XDRV', label: 'Cross-Driver Dashboard' },
  { code: 'BETA.X', label: 'Cross-Asset Beta Matrix' },
  { code: 'REGI', label: 'Regime-conditioned Relations' },
  { code: 'HEDGE', label: 'Hedge Candidate Explorer' },
  { code: 'SHOCK.G', label: 'Geo Shock Simulator' },
  { code: 'NAVG', label: 'Navigation Graph Panel' },
  { code: 'BKMK', label: 'Bookmarks Stateful' },
  { code: 'TRAIL', label: 'Trail Recorder' },
  { code: 'RELATE', label: 'Related to This' },
  { code: 'FOCUS', label: 'Focus Mode' },
  { code: 'CMPY', label: 'Company Dossier' },
  { code: 'SECT', label: 'Sector Dossier' },
  { code: 'INDY', label: 'Industry Dossier' },
  { code: 'CTY', label: 'Country Dossier' },
  { code: 'CITY', label: 'City Hub Dossier' },
  { code: 'DOCK', label: 'Dockable Workspace Engine' },
  { code: 'FLOAT', label: 'Pop-out / Multi-monitor' },
  { code: 'LAYOUT', label: 'Layout Templates + Constraints' },
  { code: 'FOCUS+', label: 'Focus Mode Quick Return' },
  { code: 'PINBAR', label: 'Global Pin Strip' },
  { code: 'NAVTREE', label: 'Global Function Navigator' },
  { code: 'AUTH', label: 'Authentication Hub' },
  { code: 'MFA', label: 'Multi-factor Auth' },
  { code: 'SESS', label: 'Session Manager' },
  { code: 'ROLE', label: 'Roles & Permissions' },
  { code: 'PREF', label: 'Preferences' },
  { code: 'KEYMAP', label: 'Hotkey Editor Profiles' },
  { code: 'LINK', label: 'Pane Link Groups' },
  { code: 'FORMAT', label: 'Number/Time Formatting' },
  { code: 'CMDK', label: 'Global Command Palette' },
  { code: 'HL+', label: 'Unified Search Hub' },
  { code: 'RECENT', label: 'Recent Everything' },
  { code: 'SNAP', label: 'Workspace Snapshots' },
  { code: 'MIG', label: 'Layout Migration' },
  { code: 'SHARE', label: 'Share Pane/Entity/Workspace' },
  { code: 'NOTIF', label: 'Notification Center' },
  { code: 'ROUTE', label: 'Notification Routing Rules' },
  { code: 'ALRT+', label: 'Advanced Alerts' },
  { code: 'MON+', label: 'Monitor Builder Worksheets' },
  { code: 'ADMIN', label: 'Admin Console' },
  { code: 'AUDIT', label: 'Full Audit Trail' },
  { code: 'POLICY', label: 'Policy Rules Engine' },
  { code: 'DLP', label: 'Data Loss Prevention' },
  { code: 'SRC', label: 'Data Source Manager' },
  { code: 'API', label: 'API Keys + Developer Portal' },
  { code: 'WEBHOOK', label: 'Webhooks' },
  { code: 'PLUG', label: 'Plugin System' },
  { code: 'STATUS', label: 'System Status Ops' },
  { code: 'DIAG', label: 'Diagnostics Profiler' },
  { code: 'OFFLINE', label: 'Offline Mode' },
  { code: 'UPDATE', label: 'Release Notes + Versioning' },
  { code: 'HELP', label: 'Contextual Help Overlay' },
  { code: 'TUTOR', label: 'Guided Tutorials' },
  { code: 'DOCS', label: 'Documentation Center' },
  { code: 'LOCK', label: 'Screen Lock' },
  { code: 'PRIV', label: 'Privacy Controls' },
  { code: 'CONSENT', label: 'Data Usage Notices' },
  { code: 'GRIDCFG', label: 'Density/Grid Calibration' },
  { code: 'THEMEPRO', label: 'Palette + Contrast Tests' },
];

export function PanelMenuOverlay({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel, dispatchPanel } = useTerminalOS();
  const { drill } = useDrill();
  const p = panels[panelIdx]!;
  const sec = p.activeSecurity;
  const ticker = sec.split(' ')[0] ?? sec;
  const related = (getCatalogMnemonic(p.activeMnemonic)?.relatedCodes ?? MNEMONIC_DEFS[p.activeMnemonic]?.relatedCodes ?? []);
  const graphCodes = [p.activeMnemonic, ...related.slice(0, 12)];
  const primaryFlow = ['DES', 'CN', 'HP', 'OWN', 'RELS', 'GP'].filter((c) => c !== p.activeMnemonic);
  const primaryActions = primaryFlow
    .map((code) => ({ code, label: MNEMONIC_DEFS[code]?.title ?? code }))
    .filter((x) => x.code in MNEMONIC_DEFS);
  const fallbackActions = (SECTOR_MENUS[p.marketSector] ?? SECTOR_MENUS.EQUITY).slice(0, 8);
  const nextActions = primaryActions.length > 0 ? primaryActions : fallbackActions;
  const [cursor, setCursor] = useState(0);

  const relatedEntities = [
    { label: sec, entity: makeSecurity(sec, ticker) },
    { label: `${ticker} peers`, entity: makeFunction('RELS', 'Related Securities') },
    { label: `${ticker} ownership`, entity: makeFunction('OWN', 'Ownership') },
    { label: `${ticker} dividend`, entity: makeFunction('DVD', 'Dividend History') },
    { label: `${ticker} headline`, entity: makeNews(`${ticker} flow + ownership update`, 'BBG') },
    { label: `PX_LAST`, entity: makeField('PX_LAST') },
  ];

  type MenuRow =
    | { kind: 'header'; title: string }
    | { kind: 'action'; label: string; run: (intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANE' | 'INSPECT_OVERLAY') => void }
    | { kind: 'tool'; label: string; run: (intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANE' | 'INSPECT_OVERLAY') => void }
    | { kind: 'entity'; label: string; run: (intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANE' | 'INSPECT_OVERLAY') => void };

  const rows: MenuRow[] = [
    { kind: 'header', title: 'PRIMARY NEXT ACTIONS' },
    ...nextActions.map((item) => ({
      kind: 'action' as const,
      label: `${item.code} — ${item.label}`,
      run: (intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANE' | 'INSPECT_OVERLAY') => {
        const entity = makeFunction(item.code, item.label);
        drill(entity, intent, panelIdx);
      },
    })),
    { kind: 'header', title: 'SECONDARY TOOLS' },
    {
      kind: 'tool',
      label: 'Add alert',
      run: () => {
        addAlertRule(`ALERT IF ${ticker} PX_LAST > 200`);
        appendAuditEvent({ panelIdx, type: 'ALERT_CREATE', actor: 'USER', detail: `MENU alert ${ticker}`, mnemonic: p.activeMnemonic, security: sec });
      },
    },
    {
      kind: 'tool',
      label: 'Add to monitor',
      run: () => {
        addToMonitorList(sec);
        appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `MENU add monitor ${sec}`, mnemonic: p.activeMnemonic, security: sec });
      },
    },
    {
      kind: 'tool',
      label: 'Export panel snapshot',
      run: () => {
        appendAuditEvent({ panelIdx, type: 'EXPORT', actor: 'USER', detail: `MENU export ${p.activeMnemonic} ${sec}`, mnemonic: p.activeMnemonic, security: sec });
        const payload = JSON.stringify({ mnemonic: p.activeMnemonic, security: sec, ts: new Date().toISOString() }, null, 2);
        const w = window.open('', '_blank');
        if (w) w.document.write(`<pre style="background:#000;color:#ddd;font:11px monospace;padding:8px">${payload}</pre>`);
      },
    },
    {
      kind: 'tool',
      label: 'Inspect active security',
      run: (intent) => {
        drill(makeSecurity(sec, ticker), intent === 'OPEN_IN_NEW_PANE' ? 'OPEN_IN_PLACE' : 'INSPECT_OVERLAY', panelIdx);
      },
    },
    { kind: 'header', title: 'RELATED ENTITIES' },
    ...relatedEntities.map((re) => ({
      kind: 'entity' as const,
      label: re.label,
      run: (intent: 'OPEN_IN_PLACE' | 'OPEN_IN_NEW_PANE' | 'INSPECT_OVERLAY') => drill(re.entity, intent, panelIdx),
    })),
  ];
  const selectable = rows.filter((r): r is Exclude<MenuRow, { kind: 'header' }> => r.kind !== 'header');

  return (
    <div className="absolute inset-0 z-30" style={{ background: `${DENSITY.bgBase}f0`, fontFamily: DENSITY.fontFamily }}>
      {/* Header */}
      <div style={{ padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700 }}>
          MENU — {p.activeSecurity} [{p.marketSector}]
        </div>
        <div className="flex gap-1 mt-1 items-center">
          <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>GRAPH</span>
          {graphCodes.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>→</span>}
              <button
                type="button"
                onClick={() => { navigatePanel(panelIdx, c, p.activeSecurity, p.marketSector); dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); }}
                style={{ color: c === p.activeMnemonic ? DENSITY.accentCyan : DENSITY.accentAmber, border: `1px solid ${DENSITY.gridlineColor}`, background: DENSITY.bgSurfaceAlt, fontSize: DENSITY.fontSizeTiny, padding: '0 3px', cursor: 'pointer' }}
              >
                {c}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Items */}
      <div
        style={{ overflowY: 'auto', maxHeight: 'calc(100% - 70px)' }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, selectable.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
          else if (e.key === 'Enter' && e.altKey) { e.preventDefault(); selectable[cursor]?.run('INSPECT_OVERLAY'); }
          else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); selectable[cursor]?.run('OPEN_IN_NEW_PANE'); dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); }
          else if (e.key === 'Enter') { e.preventDefault(); selectable[cursor]?.run('OPEN_IN_PLACE'); dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); }
          else if (e.key === 'Escape') { e.preventDefault(); dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); }
        }}
      >
        {rows.map((row, i) => {
          if (row.kind === 'header') {
            return (
              <div key={`h-${row.title}-${i}`} style={{ height: 14, display: 'flex', alignItems: 'center', padding: `0 ${DENSITY.pad4}px`, color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
                {row.title}
              </div>
            );
          }
          const idx = selectable.findIndex((x) => x.label === row.label);
          const active = idx === cursor;
          return (
            <button
              key={`${row.kind}-${row.label}`}
              type="button"
              className="w-full text-left flex items-center hover:bg-[#1a2a3a]"
              style={{ height: DENSITY.rowHeightPx + 2, padding: `0 ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: active ? DENSITY.rowSelectedBg : 'none', cursor: 'pointer' }}
              onMouseEnter={() => setCursor(idx)}
              onClick={() => { row.run('OPEN_IN_PLACE'); dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); }}
            >
              <span style={{ color: DENSITY.textMuted, width: 20, fontSize: DENSITY.fontSizeTiny }}>{idx + 1}</span>
              <span style={{ color: row.kind === 'action' ? DENSITY.accentAmber : row.kind === 'tool' ? DENSITY.accentGreen : DENSITY.accentCyan, fontSize: DENSITY.fontSizeDefault }}>
                {row.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `1px ${DENSITY.pad4}px`, fontSize: '8px', color: DENSITY.textMuted, borderTop: `1px solid ${DENSITY.gridlineColor}`, background: DENSITY.bgSurface }}>
        ↑↓ select • Enter run • Shift+Enter new pane • Alt+Enter inspect • Esc close
      </div>
    </div>
  );
}

export function PanelHelpOverlay({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const isDeskMode = p.overlayMode === 'help-desk';
  const mnDef = MNEMONIC_DEFS[p.activeMnemonic];
  const catDef = getCatalogMnemonic(p.activeMnemonic);

  return (
    <div className="absolute inset-0 z-30 overflow-auto" style={{ background: `${DENSITY.bgBase}f0`, fontFamily: DENSITY.fontFamily, padding: DENSITY.pad4 }}>
      <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeHeader, borderBottom: `1px solid ${DENSITY.borderColor}`, paddingBottom: 2, marginBottom: 4 }}>
        {isDeskMode ? 'HELP DESK' : `HELP — ${p.activeMnemonic}`}
      </div>

      {isDeskMode ? (
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeDefault }}>
          <div style={{ color: DENSITY.textPrimary, marginBottom: 4 }}>Bloomberg Help Desk (Simulated)</div>
          <div style={{ marginBottom: 2 }}>• Type HELP ONCE for function help</div>
          <div style={{ marginBottom: 2 }}>• Call 1-800-BLOOMBERG for live support</div>
          <div style={{ marginBottom: 2 }}>• Use HL + Ctrl+K to search for any function or security</div>
        </div>
      ) : (
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeDefault }}>
          <div style={{ color: DENSITY.textPrimary, fontWeight: 700, marginBottom: 4 }}>{mnDef?.title ?? p.activeMnemonic}</div>
          {catDef?.helpMarkdown && (
            <div style={{ marginBottom: 6, color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny }}>
              {catDef.helpMarkdown.split('\n').slice(0, 6).map((line, i) => <div key={i}>{line.replace(/^#\s*/, '')}</div>)}
            </div>
          )}
          <div style={{ marginBottom: 6 }}>Active security: {p.activeSecurity}</div>
          <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, marginBottom: 2 }}>KEYBOARD SHORTCUTS</div>
          <div style={{ marginBottom: 1 }}>Enter = GO execute command</div>
          <div style={{ marginBottom: 1 }}>Esc = CANCEL / close overlay</div>
          <div style={{ marginBottom: 1 }}>F1 = HELP (F1 twice = Help Desk)</div>
          <div style={{ marginBottom: 1 }}>F2 = MENU (related functions)</div>
          <div style={{ marginBottom: 1 }}>Ctrl+K = HL Search overlay</div>
          <div style={{ marginBottom: 1 }}>Ctrl+B = Back in panel history</div>
          <div style={{ marginBottom: 1 }}>Ctrl+Shift+B = Forward</div>
          <div style={{ marginBottom: 1 }}>Ctrl+L = Focus command line</div>
          <div style={{ marginBottom: 1 }}>Alt+1..4 = Focus panel 1..4</div>
          <div style={{ marginBottom: 1 }}>Ctrl+` = Cycle panel focus</div>
          <div style={{ marginBottom: 1 }}>PageUp/Dn = Scroll table</div>
          <div style={{ marginTop: 6, color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>RELATED FUNCTIONS</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {(mnDef?.relatedCodes ?? []).map((c) => (
              <span key={c} style={{ border: `1px solid ${DENSITY.borderColor}`, padding: '0 3px', color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny }}>{c}</span>
            ))}
          </div>
          <div style={{ marginTop: 8, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
            Press F1 again for Help Desk  •  Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
