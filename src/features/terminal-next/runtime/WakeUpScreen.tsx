'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';

const EXAMPLES = [
  { cmd: 'AAPL US DES GO', desc: 'Load Apple, Description screen' },
  { cmd: 'IBM US HP GO', desc: 'IBM Historical Prices' },
  { cmd: 'WEI GO', desc: 'World Equity Indices monitor' },
  { cmd: 'TOP GO', desc: 'Top news headlines' },
  { cmd: 'EURUSD Curncy GP GO', desc: 'EUR/USD daily price chart' },
  { cmd: 'MSFT US OWN GO', desc: 'Microsoft institutional ownership' },
  { cmd: 'SPX Index GIP GO', desc: 'S&P 500 intraday chart' },
  { cmd: 'ECO GO', desc: 'Economic calendar' },
  { cmd: 'BLTR GO', desc: 'Order blotter' },
  { cmd: 'NVDA US FA GO', desc: 'NVIDIA financial statements' },
];

export function WakeUpScreen({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel, navigatePanel } = useTerminalOS();
  const p = panels[panelIdx]!;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily, background: DENSITY.bgBase }}>
      {/* Title block */}
      <div style={{ padding: `${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>
          PANEL {panelIdx + 1} — TERMINAL READY
        </div>
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, marginTop: 2 }}>
          Type a command + GO to begin  •  F2=MENU  •  Ctrl+K=SEARCH  •  F1=HELP
        </div>
      </div>

      {/* Command grammar */}
      <div style={{ padding: `${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Command Grammar
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 16px', fontSize: DENSITY.fontSizeTiny }}>
          {[
            ['<TICKER> <MARKET> <MNEMONIC> GO', 'e.g. AAPL US DES GO'],
            ['<MNEMONIC> GO', 'e.g. WEI GO'],
            ['<TICKER> <MARKET> GO', 'Load security, keep function'],
            ['<TIMEFRAME> GO', '5D, 1M, 3M, 1Y, 5Y (charts)'],
            ['WS <name> GO', 'Save / load workspace'],
            ['GRAB GO', 'Export panel snapshot'],
            ['HL GO  or  Ctrl+K', 'Search securities & functions'],
          ].map(([cmd, note]) => (
            <React.Fragment key={cmd}>
              <span style={{ color: DENSITY.accentAmber, fontWeight: 700 }}>{cmd}</span>
              <span style={{ color: DENSITY.textDim }}>{note}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Examples — clickable */}
      <div style={{ padding: `${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Quick Start Examples (click to run)
        </div>
        {EXAMPLES.map((ex) => (
          <div key={ex.cmd} className="flex items-center cursor-pointer hover:bg-[#0a0a0a]"
            style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad2}px` }}
            onClick={() => {
              dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: ex.cmd });
              // auto-execute
              const raw = ex.cmd.toUpperCase().replace(/ GO$/, '').trim();
              const parts = raw.split(' ');
              const mnemonic = parts.find((t) => ['WEI','TOP','DES','HP','GP','GIP','FA','CN','OWN','RELS','MGMT','DVD','EVT','ECO','FXC','IMAP','ALRT','BLTR','ORD','IB','ANR'].includes(t)) ?? 'DES';
              const secParts = parts.filter((t) => !['WEI','TOP','DES','HP','GP','GIP','FA','CN','OWN','RELS','MGMT','DVD','EVT','ECO','FXC','IMAP','ALRT','BLTR','ORD','IB','ANR','GO','EQUITY','CORP','CURNCY','INDEX','COMDTY'].includes(t));
              const security = secParts.length > 0 ? parts.slice(0, parts.indexOf(mnemonic)).join(' ') || p.activeSecurity : p.activeSecurity;
              navigatePanel(panelIdx, mnemonic, security);
            }}
          >
            <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, width: 200, flexShrink: 0 }}>{ex.cmd}</span>
            <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{ex.desc}</span>
          </div>
        ))}
      </div>

      {/* Recent history */}
      {p.history.length > 1 && (
        <div style={{ padding: `${DENSITY.pad4}px` }}>
          <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Panel History
          </div>
          {[...p.history].reverse().slice(0, 10).map((h, i) => (
            <div key={`${h.ts}-${i}`} className="flex items-center cursor-pointer hover:bg-[#0a0a0a]"
              style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad2}px` }}
              onClick={() => navigatePanel(panelIdx, h.mnemonic, h.security, h.sector)}
            >
              <span style={{ color: DENSITY.textDim, width: 55, fontSize: DENSITY.fontSizeTiny }}>
                {new Date(h.ts).toLocaleTimeString()}
              </span>
              <span style={{ color: DENSITY.accentAmber, width: 50, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>{h.mnemonic}</span>
              <span style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{h.security}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
