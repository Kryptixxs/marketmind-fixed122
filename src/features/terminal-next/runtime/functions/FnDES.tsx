'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, KeyValueGrid, PanelSubHeader, StatusBadge, type KVPair, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity, makeSector } from '../entities/types';
import { openContextMenu, openContextMenuAt } from '../ui/ContextMenu';
import { addSecurityNote, deleteSecurityNote, listSecurityNotes } from '../securityNotesStore';
import { appendAuditEvent } from '../commandAuditStore';
import { TileLayoutRoot, TileGrid, TileCell, TerminalTile } from '../ui/TileLayout';
import { makeFieldValueEntity } from '../../services/fieldRuntime';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }
function fmtB(n: number) { return n >= 1e12 ? (n / 1e12).toFixed(2) + 'T' : n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n.toLocaleString(); }

const SUMMARIES = [
  'Global technology and consumer platform company with diversified revenue streams across hardware, software, and services.',
  'Enterprise cloud and productivity software leader with strong recurring revenue and expanding AI capabilities.',
  'Semiconductor and AI computing platform company driving accelerated computing adoption worldwide.',
  'Diversified financial services holding company with operations in banking, insurance, and investments.',
];

export function FnDES({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const p = panels[panelIdx]!;
  const sec = p.activeSecurity;
  const ticker = sec.split(' ')[0] ?? 'AAPL';
  const [noteInput, setNoteInput] = React.useState('');
  const [noteTick, setNoteTick] = React.useState(0);

  const data = useMemo(() => {
    const seed = h(ticker);
    const mcap = 500e9 + (seed % 30) * 100e9;
    const pe = 15 + (seed % 25);
    const shares = mcap / (100 + (seed % 200));
    return {
      ticker,
      name: `${ticker} Inc`,
      exchange: seed % 2 === 0 ? 'NASDAQ' : 'NYSE',
      sector: 'Technology',
      industry: 'Software & Services',
      mcap,
      pe,
      eps: (100 + seed % 200) / pe,
      divYield: (1 + (seed % 40)) / 10,
      shares,
      avgVol: 30e6 + (seed % 50) * 1e6,
      beta: 0.8 + (seed % 15) / 10,
      high52: 100 + seed % 200 + 30,
      low52: 100 + seed % 200 - 50,
      summary: SUMMARIES[seed % SUMMARIES.length]!,
      relatedBonds: [`${ticker} 2.5 05/25`, `${ticker} 3.1 08/27`],
      relatedOptions: [`${ticker} 180C 06/21`],
      peers: ['MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'CRM', 'ORCL', 'ADBE'].filter((t) => t !== ticker),
    };
  }, [ticker]);

  const pairs: KVPair[] = [
    { label: 'Market Cap', value: fmtB(data.mcap), entity: makeFieldValueEntity('MARKET_CAP', data.mcap) },
    { label: 'P/E Ratio', value: data.pe.toFixed(1) + 'x', entity: makeFieldValueEntity('PE_RATIO', data.pe) },
    { label: 'EPS (TTM)', value: '$' + data.eps.toFixed(2), entity: makeFieldValueEntity('EPS', data.eps, { asOf: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() }) },
    { label: 'Div Yield', value: data.divYield.toFixed(2) + '%', entity: makeFieldValueEntity('DIV_YIELD', data.divYield) },
    { label: 'Shares Out', value: fmtB(data.shares), entity: makeFieldValueEntity('SHARES_OUT', data.shares) },
    { label: 'Avg Vol', value: fmtB(data.avgVol), entity: makeFieldValueEntity('VOLUME', data.avgVol) },
    { label: 'Beta', value: data.beta.toFixed(2), entity: makeFieldValueEntity('BETA', data.beta) },
    { label: '52W High', value: data.high52.toFixed(2), entity: makeFieldValueEntity('52W_HIGH', data.high52) },
    { label: '52W Low', value: data.low52.toFixed(2), entity: makeFieldValueEntity('52W_LOW', data.low52) },
    { label: 'Exchange', value: data.exchange },
    { label: 'Sector', value: data.sector, entity: makeSector(data.sector) },
    { label: 'Industry', value: data.industry },
  ];

  const tradingPairs: KVPair[] = [
    { label: 'VWAP', value: (data.low52 + (data.high52 - data.low52) * 0.46).toFixed(2), entity: makeFieldValueEntity('VWAP', data.low52 + (data.high52 - data.low52) * 0.46, { source: 'CALC' }) },
    { label: 'Turnover', value: '$' + fmtB(data.avgVol * (data.high52 * 0.45)), entity: makeFieldValueEntity('MARKET_CAP', data.avgVol * (data.high52 * 0.45), { source: 'CALC' }) },
    { label: 'Short Int', value: (1 + (h(ticker) % 16) / 10).toFixed(1) + '%', entity: makeFieldValueEntity('PCT_CHG', (1 + (h(ticker) % 16) / 10), { source: 'SIM' }) },
    { label: 'Vol(30d)', value: (18 + (h(ticker) % 22)).toFixed(1) + '%', entity: makeFieldValueEntity('PCT_CHG', (18 + (h(ticker) % 22)), { source: 'SIM' }) },
    { label: 'ATR', value: (1.2 + (h(ticker) % 20) / 10).toFixed(2), entity: makeFieldValueEntity('PX_CHG', (1.2 + (h(ticker) % 20) / 10), { source: 'CALC' }) },
    { label: 'Beta Adj', value: (data.beta * 0.93).toFixed(2), entity: makeFieldValueEntity('BETA', (data.beta * 0.93), { source: 'CALC' }) },
  ];
  const peerRows = data.peers.map((t, i) => ({
    id: t,
    ticker: t,
    rel: ['MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN'][i % 5] ?? 'MSFT',
    pe: (14 + ((h(t + ticker) + i) % 30)).toFixed(1),
    chg: ((i % 2 === 0 ? 1 : -1) * (0.4 + ((h(t) % 40) / 10))).toFixed(2),
  }));
  const ownershipRows = [
    { id: 'o1', holder: 'Vanguard', stake: '8.4%', type: 'Passive' },
    { id: 'o2', holder: 'BlackRock', stake: '7.2%', type: 'Passive' },
    { id: 'o3', holder: 'StateStreet', stake: '4.1%', type: 'Passive' },
    { id: 'o4', holder: 'FMR', stake: '2.6%', type: 'Active' },
  ];
  const eventRows = [
    { id: 'e1', dt: '2026-03-14', event: 'Earnings Q1', impact: 'High' },
    { id: 'e2', dt: '2026-03-22', event: 'Product cycle update', impact: 'Med' },
    { id: 'e3', dt: '2026-04-02', event: 'Macro-sensitive data', impact: 'Med' },
    { id: 'e4', dt: '2026-04-12', event: 'Regulatory hearing', impact: 'High' },
  ];
  const peerCols: DenseColumn[] = [
    { key: 'ticker', header: 'Ticker', width: '60px', entity: (r) => makeSecurity(`${String(r.ticker)} US Equity`, String(r.ticker)) },
    { key: 'rel', header: 'Pair', width: '1fr' },
    { key: 'pe', header: 'P/E', width: '55px', align: 'right', entity: (r) => makeFieldValueEntity('PE_RATIO', Number(r.pe), { source: 'CALC' }) },
    { key: 'chg', header: '%Chg', width: '62px', align: 'right', tone: true, format: (v) => `${Number(v) >= 0 ? '+' : ''}${v}%`, entity: (r) => makeFieldValueEntity('PCT_CHG', Number(r.chg), { source: 'CALC' }) },
  ];
  const ownCols: DenseColumn[] = [
    { key: 'holder', header: 'Holder', width: '1fr' },
    { key: 'stake', header: 'Stake', width: '62px', align: 'right', entity: (r) => makeFieldValueEntity('SHARES_HELD', Number(String(r.stake).replace('%', '')), { source: 'SIM' }) },
    { key: 'type', header: 'Type', width: '60px' },
  ];
  const evtCols: DenseColumn[] = [
    { key: 'dt', header: 'Date', width: '78px' },
    { key: 'event', header: 'Event', width: '1fr' },
    { key: 'impact', header: 'Imp', width: '52px' },
  ];
  const [peerSel, setPeerSel] = React.useState(0);
  const [evtSel, setEvtSel] = React.useState(0);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`DES • ${data.name} (${data.ticker})`} right={<StatusBadge label="SIM" variant="sim" />} />
      <div className="flex-1 min-h-0">
        <TileLayoutRoot panelIdx={panelIdx}>
          <TileGrid
            spec={{
              columns: '1.4fr 1fr',
              rows: '1fr 0.95fr 0.9fr',
              areas: ['fund trade', 'summary peers', 'bottom bottom'],
            }}
          >
            <TileCell area="fund">
              <TerminalTile id="des-fund" title="Key Fundamentals" status="Field grid" footer="ENTER drill selected field">
                <KeyValueGrid pairs={pairs} columns={2} panelIdx={panelIdx} />
              </TerminalTile>
            </TileCell>
            <TileCell area="trade">
              <TerminalTile id="des-trade" title="Trading Stats" status="Micro stats">
                <KeyValueGrid pairs={tradingPairs} columns={2} panelIdx={panelIdx} />
              </TerminalTile>
            </TileCell>
            <TileCell area="summary">
              <TerminalTile id="des-summary" title="Business Summary + Tags" status="Context">
                <div style={{ padding: DENSITY.pad4, color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, lineHeight: 1.3 }}>{data.summary}</div>
                <div className="flex flex-wrap gap-1" style={{ padding: `0 ${DENSITY.pad4}px ${DENSITY.pad4}px` }}>
                  {[...data.relatedBonds, ...data.relatedOptions].slice(0, 8).map((s) => (
                    <button key={s} type="button"
                      style={{ border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.panelBgAlt, color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny, padding: '0 3px' }}
                      onClick={(e) => drill(makeSecurity(s + ' Corp', s), e.shiftKey ? 'OPEN_IN_NEW_PANEL' : 'OPEN_IN_PLACE', panelIdx)}
                      onContextMenu={(e) => { e.preventDefault(); openContextMenu(e, makeSecurity(s + ' Corp', s), panelIdx); }}
                    >{s}</button>
                  ))}
                </div>
              </TerminalTile>
            </TileCell>
            <TileCell area="peers">
              <TerminalTile
                id="des-peers"
                title="Peer Quick Table"
                status="Comparable set"
                onEnter={() => {
                  const row = peerRows[peerSel];
                  if (!row) return;
                  drill(makeSecurity(`${row.ticker} US Equity`, row.ticker), 'OPEN_IN_PLACE', panelIdx);
                }}
                onEnterNewPane={() => {
                  const row = peerRows[peerSel];
                  if (!row) return;
                  drill(makeSecurity(`${row.ticker} US Equity`, row.ticker), 'OPEN_IN_NEW_PANE', panelIdx);
                }}
                onInspect={() => {
                  const row = peerRows[peerSel];
                  if (!row) return;
                  drill(makeSecurity(`${row.ticker} US Equity`, row.ticker), 'INSPECT_OVERLAY', panelIdx);
                }}
                onMenu={(x, y) => {
                  const row = peerRows[peerSel];
                  if (!row) return;
                  openContextMenuAt(x, y, makeSecurity(`${row.ticker} US Equity`, row.ticker), panelIdx);
                }}
              >
                <DenseTable
                  columns={peerCols}
                  rows={peerRows}
                  rowKey="id"
                  selectedRow={peerSel}
                  onRowClick={(r) => setPeerSel(peerRows.findIndex((x) => x.id === String(r.id)))}
                  panelIdx={panelIdx}
                  className="h-full"
                  compact
                />
              </TerminalTile>
            </TileCell>
            <TileCell area="bottom">
              <TerminalTile
                id="des-bottom"
                title="Ownership + Events + Notes"
                status="Desk workflow"
                onEnter={() => {
                  const row = eventRows[evtSel];
                  if (!row) return;
                  drill(makeSecurity(sec, row.event), 'OPEN_IN_PLACE', panelIdx);
                }}
                onEnterNewPane={() => {
                  const row = eventRows[evtSel];
                  if (!row) return;
                  drill(makeSecurity(sec, row.event), 'OPEN_IN_NEW_PANE', panelIdx);
                }}
                onInspect={() => {
                  const row = eventRows[evtSel];
                  if (!row) return;
                  drill(makeSecurity(sec, row.event), 'INSPECT_OVERLAY', panelIdx);
                }}
              >
                <div className="grid h-full min-h-0" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: DENSITY.gridlineColor }}>
                  <div style={{ minHeight: 0, background: DENSITY.panelBg }}>
                    <DenseTable columns={ownCols} rows={ownershipRows} rowKey="id" panelIdx={panelIdx} compact className="h-full" />
                  </div>
                  <div style={{ minHeight: 0, background: DENSITY.panelBg }}>
                    <DenseTable columns={evtCols} rows={eventRows} rowKey="id" panelIdx={panelIdx} compact selectedRow={evtSel} onRowClick={(r) => setEvtSel(eventRows.findIndex((x) => x.id === String(r.id)))} className="h-full" />
                  </div>
                  <div style={{ minHeight: 0, background: DENSITY.panelBg, padding: DENSITY.pad4 }}>
                    <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
                      <input
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          const note = addSecurityNote(sec, noteInput);
                          if (!note) return;
                          appendAuditEvent({ panelIdx, type: 'NOTE_ADD', actor: 'USER', detail: `DES note ${sec}` });
                          setNoteInput('');
                          setNoteTick((v) => v + 1);
                        }}
                        placeholder="Add note + Enter"
                        className="flex-1 bg-transparent outline-none"
                        style={{ color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, padding: '1px 4px', fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily }}
                      />
                    </div>
                    {(listSecurityNotes(sec) && noteTick >= 0) ? listSecurityNotes(sec).slice(0, 8).map((n) => (
                      <div key={n.id} className="flex items-center gap-1" style={{ borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: '1px 0' }}>
                        <span className="flex-1 truncate" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny }}>{n.text}</span>
                        <button type="button" onClick={() => { deleteSecurityNote(sec, n.id); setNoteTick((v) => v + 1); }}
                          style={{ color: DENSITY.accentRed, background: 'none', border: 'none', fontSize: DENSITY.fontSizeTiny, cursor: 'pointer' }}>DEL</button>
                      </div>
                    )) : null}
                  </div>
                </div>
              </TerminalTile>
            </TileCell>
          </TileGrid>
        </TileLayoutRoot>
      </div>
    </div>
  );
}
