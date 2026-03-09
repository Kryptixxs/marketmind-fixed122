'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity, makeField, makeNews, makeFunction } from '../entities/types';
import { openContextMenu } from '../ui/ContextMenu';
import { useTerminalStore } from '../../store/TerminalStore';
import { loadAlertRules, evaluateTriggeredRules } from '../../services/alertMonitor';
import { intentFromMouseEvent, INTERACTION_HINT } from '../interaction';
import { getDockLayout } from '../dockLayoutStore';

function hash(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

// ── Mini Quote Block ──────────────────────────────────────────────────────────
export function MiniQuoteBlock({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const { state } = useTerminalStore();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const liveQuote = state.quotes.find((q) => q.symbol.startsWith(ticker));
  const h = hash(ticker);

  const fields: Array<{ label: string; value: string; fieldName: string; numVal: number }> = [
    { label: 'LAST', fieldName: 'PX_LAST', value: liveQuote ? liveQuote.last.toFixed(2) : (150 + h % 80).toFixed(2), numVal: liveQuote?.last ?? 150 + h % 80 },
    { label: 'BID', fieldName: 'PX_BID', value: liveQuote ? (liveQuote.last - 0.02).toFixed(2) : (149 + h % 80).toFixed(2), numVal: liveQuote ? liveQuote.last - 0.02 : 149 },
    { label: 'ASK', fieldName: 'PX_ASK', value: liveQuote ? (liveQuote.last + 0.03).toFixed(2) : (151 + h % 80).toFixed(2), numVal: liveQuote ? liveQuote.last + 0.03 : 151 },
    { label: 'CHG', fieldName: 'PX_CHG', value: liveQuote ? (liveQuote.abs >= 0 ? '+' : '') + liveQuote.abs.toFixed(2) : ((h % 20) - 10 >= 0 ? '+' : '') + (((h % 20) - 10) / 10).toFixed(2), numVal: liveQuote?.abs ?? 0 },
    { label: 'VOL', fieldName: 'VOLUME', value: liveQuote ? (liveQuote.volumeM).toFixed(1) + 'M' : (30 + h % 50) + 'M', numVal: liveQuote?.volumeM ?? 30 },
    { label: 'VWAP', fieldName: 'VWAP', value: state.workerAnalytics?.vwapBySymbol[ticker + ' US'] ? state.workerAnalytics.vwapBySymbol[ticker + ' US']!.toFixed(2) : (liveQuote ? liveQuote.last - 0.12 : 150 + h % 80 - 0.12).toFixed(2), numVal: 0 },
  ];

  return (
    <div style={{ borderTop: `1px solid ${DENSITY.borderColor}`, fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        BQ — Live Quote: {ticker}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr', gap: `0 6px`, padding: `${DENSITY.pad2}px ${DENSITY.pad4}px` }}>
        {fields.map((f) => {
          const entity = makeField(f.fieldName, f.numVal);
          return (
            <React.Fragment key={f.label}>
              <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{f.label}</span>
              <span
                className="tabular-nums cursor-pointer hover:underline"
                style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}
                onClick={(e) => drill(entity, intentFromMouseEvent(e), panelIdx)}
                onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}
                title={INTERACTION_HINT}
              >{f.value}</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Mini Peers / RELS ─────────────────────────────────────────────────────────
const PEER_MAP: Record<string, Array<{ sym: string; name: string }>> = {
  AAPL: [{ sym: 'MSFT US Equity', name: 'Microsoft' }, { sym: 'GOOGL US Equity', name: 'Alphabet' }, { sym: 'AMZN US Equity', name: 'Amazon' }, { sym: 'META US Equity', name: 'Meta' }, { sym: 'NVDA US Equity', name: 'NVIDIA' }],
  MSFT: [{ sym: 'AAPL US Equity', name: 'Apple' }, { sym: 'GOOGL US Equity', name: 'Alphabet' }, { sym: 'CRM US Equity', name: 'Salesforce' }, { sym: 'ORCL US Equity', name: 'Oracle' }, { sym: 'SAP US Equity', name: 'SAP SE' }],
  NVDA: [{ sym: 'AMD US Equity', name: 'AMD' }, { sym: 'INTC US Equity', name: 'Intel' }, { sym: 'AVGO US Equity', name: 'Broadcom' }, { sym: 'QCOM US Equity', name: 'Qualcomm' }, { sym: 'TXN US Equity', name: 'Texas Instr.' }],
};
const DEFAULT_PEERS = [{ sym: 'AAPL US Equity', name: 'Apple' }, { sym: 'MSFT US Equity', name: 'Microsoft' }, { sym: 'NVDA US Equity', name: 'NVIDIA' }, { sym: 'GOOGL US Equity', name: 'Alphabet' }, { sym: 'AMZN US Equity', name: 'Amazon' }];

export function MiniRelsBlock({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const { state } = useTerminalStore();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const peers = PEER_MAP[ticker] ?? DEFAULT_PEERS;

  return (
    <div style={{ borderTop: `1px solid ${DENSITY.borderColor}`, fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}`, display: 'flex', justifyContent: 'space-between' }}>
        <span>RELS — Peer Group</span>
        <button type="button" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => drill(makeFunction('RELS'), 'OPEN_IN_PLACE', panelIdx)}>MORE ▶</button>
      </div>
      {peers.map((p, i) => {
        const h = hash(p.sym);
        const lq = state.quotes.find((q) => q.symbol.startsWith(p.sym.split(' ')[0]!));
        const pct = lq ? lq.pct : ((h % 200) - 100) / 100;
        const entity = makeSecurity(p.sym, p.name);
        return (
          <div key={p.sym} className="flex items-center cursor-pointer"
            style={{
              height: DENSITY.rowHeightPx,
              padding: `0 ${DENSITY.pad4}px`,
              borderBottom: `1px solid ${DENSITY.gridlineColor}`,
              borderTop: i > 0 && i % 5 === 0 ? `1px solid ${DENSITY.groupSeparator}` : undefined,
              background: i % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = DENSITY.rowHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg; }}
            onClick={(e) => drill(entity, intentFromMouseEvent(e), panelIdx)}
            onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}>
            <span style={{ color: DENSITY.accentAmber, width: 50, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>{p.sym.split(' ')[0]}</span>
            <span className="flex-1 truncate" style={{ color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny }}>{p.name}</span>
            <span className="tabular-nums" style={{ color: pct >= 0 ? DENSITY.accentGreen : DENSITY.accentRed, fontSize: DENSITY.fontSizeDefault }}>
              {(pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Mini Key Fields ───────────────────────────────────────────────────────────
export function MiniKeyFields({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const h = hash(ticker);

  const fields = [
    { label: 'P/E', fieldName: 'PE_RATIO', value: (18 + h % 25).toFixed(1) + 'x' },
    { label: 'MKT CAP', fieldName: 'MARKET_CAP', value: '$' + (1.2 + (h % 20) / 10).toFixed(1) + 'T' },
    { label: 'BETA', fieldName: 'BETA', value: (0.8 + (h % 12) / 10).toFixed(2) },
    { label: 'DIV YLD', fieldName: 'DIV_YIELD', value: (1.2 + (h % 25) / 10).toFixed(2) + '%' },
    { label: 'EPS TTM', fieldName: 'EPS', value: '$' + (3 + (h % 80) / 10).toFixed(2) },
    { label: 'P/B', fieldName: 'PB_RATIO', value: (2 + h % 8).toFixed(1) + 'x' },
  ];

  return (
    <div style={{ borderTop: `1px solid ${DENSITY.borderColor}`, fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        KEY FIELDS — {ticker}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr', gap: `0 6px`, padding: `${DENSITY.pad2}px ${DENSITY.pad4}px` }}>
        {fields.map((f) => {
          const numVal = parseFloat(f.value.replace(/[^0-9.-]/g, ''));
          const entity = makeField(f.fieldName, isNaN(numVal) ? undefined : numVal);
          return (
            <React.Fragment key={f.label}>
              <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{f.label}</span>
              <span className="tabular-nums cursor-pointer hover:underline"
                style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}
                onClick={(e) => drill(entity, intentFromMouseEvent(e), panelIdx)}
                onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}
                title={INTERACTION_HINT}>{f.value}</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Mini News ─────────────────────────────────────────────────────────────────
const NEWS_TEMPLATES = [
  '{T} reports above consensus — analyst upgrades',
  '{T} announces strategic expansion initiative',
  '{T} buyback program approved by board',
  '{T} CFO comments on margin trajectory in interview',
];

export function MiniNewsBlock({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';

  return (
    <div style={{ borderTop: `1px solid ${DENSITY.borderColor}`, fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textSecondary, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}`, display: 'flex', justifyContent: 'space-between' }}>
        <span>CN — Recent Headlines</span>
        <button type="button" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => drill(makeFunction('CN'), 'OPEN_IN_PLACE', panelIdx)}>MORE ▶</button>
      </div>
      {NEWS_TEMPLATES.map((tpl, i) => {
        const headline = tpl.replace(/\{T\}/g, ticker);
        const entity = makeNews(headline, 'BBG');
        return (
          <div key={i} className="flex items-start cursor-pointer"
            style={{
              padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`,
              borderBottom: `1px solid ${DENSITY.gridlineColor}`,
              borderTop: i > 0 && i % 5 === 0 ? `1px solid ${DENSITY.groupSeparator}` : undefined,
              background: i % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg,
              minHeight: DENSITY.rowHeightPx,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = DENSITY.rowHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg; }}
            onClick={(e) => drill(entity, intentFromMouseEvent(e), panelIdx)}
            onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}>
            <span style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, lineHeight: 1.1 }}>{headline}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Alerts Snapshot ───────────────────────────────────────────────────────────
export function MiniAlertsBlock({ panelIdx }: { panelIdx: number }) {
  const { state } = useTerminalStore();
  const { drill } = useDrill();
  const rules = loadAlertRules();
  const triggered = evaluateTriggeredRules(rules, state.quotes);
  if (rules.length === 0) return null;

  return (
    <div style={{ borderTop: `1px solid ${DENSITY.borderColor}`, fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: triggered.length > 0 ? DENSITY.accentRed : DENSITY.textSecondary, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}`, display: 'flex', justifyContent: 'space-between' }}>
        <span>ALRT — Alerts {triggered.length > 0 ? `[${triggered.length} TRIGGERED]` : `[${rules.length}]`}</span>
        <button type="button" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => drill(makeFunction('ALRT'), 'OPEN_IN_PLACE', panelIdx)}>ALL ▶</button>
      </div>
      {rules.slice(0, 3).map((r) => {
        const isTriggered = triggered.some((t) => t.id === r.id);
        return (
          <div key={r.id} className="flex items-center"
            style={{ height: DENSITY.rowHeightPx, padding: `0 ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: isTriggered ? DENSITY.rowSelectedBg : DENSITY.panelBg }}>
            <span style={{ color: isTriggered ? DENSITY.accentRed : DENSITY.textSecondary, fontSize: DENSITY.fontSizeDefault, flex: 1 }}>{r.symbol}</span>
            <span className="tabular-nums" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{r.op} {r.value}</span>
            {isTriggered && <span style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny, marginLeft: 4 }}>● TRIGGERED</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── PanelFiller — appended after short-content functions ──────────────────────
const FILLER_SKIP = new Set(['GP', 'GIP', 'WEI', 'FXC', 'IMAP', 'HP', 'TOP', 'N', 'NEWS', 'FA', 'OWN', 'MGMT', 'RELS', 'DVD', 'CN', 'MON']);
const DENSITY_THRESHOLD: Record<string, number> = {
  DES: 6,
  WS: 6,
  NAVTREE: 6,
  DOCK: 6,
  ALRT: 6,
};

export function PanelFiller({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const layout = getDockLayout();
  const highDensity = layout.highDensityMode || layout.highDensityLiveMode;
  if (!highDensity && FILLER_SKIP.has(p.activeMnemonic)) return null;

  const threshold = (DENSITY_THRESHOLD[p.activeMnemonic] ?? 5) + (highDensity ? 3 : 0) + (layout.highDensityLiveMode ? 4 : 0);
  const blockFactories: Array<() => React.ReactNode> = [
    () => <MiniQuoteBlock panelIdx={panelIdx} />,
    () => <MiniKeyFields panelIdx={panelIdx} />,
    () => <MiniRelsBlock panelIdx={panelIdx} />,
    () => <MiniNewsBlock panelIdx={panelIdx} />,
    () => <MiniAlertsBlock panelIdx={panelIdx} />,
  ];
  const repeated: React.ReactNode[] = [];
  for (let i = 0; i < threshold; i += 1) {
    const mk = blockFactories[i % blockFactories.length]!;
    repeated.push(<React.Fragment key={`fill-${panelIdx}-${p.activeMnemonic}-${i}`}>{mk()}</React.Fragment>);
  }
  return <div className="flex flex-col min-h-0">{repeated}</div>;
}
