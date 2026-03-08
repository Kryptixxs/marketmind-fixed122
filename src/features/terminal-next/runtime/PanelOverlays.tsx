'use client';

import React, { useState, useCallback } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { MNEMONIC_DEFS } from './MnemonicRegistry';
import type { MarketSector } from './panelState';

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
  { code: 'TOP', label: 'Top News' },
  { code: 'ECO', label: 'Economic Calendar' },
  { code: 'FXC', label: 'FX Cross Matrix' },
  { code: 'IMAP', label: 'Sector Heatmap' },
  { code: 'BLTR', label: 'Blotter' },
  { code: 'ALRT', label: 'Alerts' },
  { code: 'IB', label: 'Instant Bloomberg' },
  { code: 'ANR', label: 'Analytics Monitor' },
];

export function PanelMenuOverlay({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const sectorItems = SECTOR_MENUS[p.marketSector] ?? SECTOR_MENUS.EQUITY;
  const [tab, setTab] = useState<'security' | 'global'>('security');

  const items = tab === 'security' ? sectorItems : GLOBAL_MNEMONICS;

  return (
    <div className="absolute inset-0 z-30" style={{ background: '#000000f0', fontFamily: DENSITY.fontFamily }}>
      {/* Header */}
      <div style={{ padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700 }}>
          MENU — {p.activeSecurity} [{p.marketSector}]
        </div>
        <div className="flex gap-2 mt-1">
          {(['security', 'global'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{ fontSize: DENSITY.fontSizeTiny, color: tab === t ? DENSITY.accentAmber : DENSITY.textMuted, background: 'none', border: `1px solid ${tab === t ? DENSITY.accentAmber : DENSITY.gridlineColor}`, padding: '0 4px', cursor: 'pointer' }}>
              {t === 'security' ? 'SECURITY FUNCTIONS' : 'GLOBAL FUNCTIONS'}
            </button>
          ))}
        </div>
      </div>
      {/* Items */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 60px)' }}>
        {items.map((item, i) => (
          <button
            key={item.code}
            type="button"
            className="w-full text-left flex items-center hover:bg-[#1a2a3a]"
            style={{ height: DENSITY.rowHeightPx + 3, padding: `0 ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: 'none', cursor: 'pointer' }}
            onClick={() => { navigatePanel(panelIdx, item.code); dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); }}
          >
            <span style={{ color: DENSITY.textMuted, width: 20, fontSize: DENSITY.fontSizeTiny }}>{i + 1}</span>
            <span style={{ color: DENSITY.accentAmber, width: 52, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>{item.code}</span>
            <span style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{item.label}</span>
          </button>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `1px ${DENSITY.pad4}px`, fontSize: '8px', color: DENSITY.textMuted, borderTop: `1px solid ${DENSITY.gridlineColor}`, background: DENSITY.bgSurface }}>
        Click or type number + GO to navigate  •  F2/Esc to close
      </div>
    </div>
  );
}

export function PanelHelpOverlay({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const isDeskMode = p.overlayMode === 'help-desk';
  const mnDef = MNEMONIC_DEFS[p.activeMnemonic];

  return (
    <div className="absolute inset-0 z-30 overflow-auto" style={{ background: '#000000f0', fontFamily: DENSITY.fontFamily, padding: DENSITY.pad4 }}>
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
