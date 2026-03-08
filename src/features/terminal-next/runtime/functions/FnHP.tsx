'use client';

import React, { useMemo, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { makeSecurity } from '../entities/types';
import { makeFieldValueEntity } from '../../services/fieldRuntime';

function hash(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateHistory(ticker: string, totalRows = 252) {
  const seed = hash(ticker);
  const base = 80 + (seed % 400);
  const rows: Array<{
    id: number; date: string; open: number; high: number; low: number;
    close: number; chg: number; pctChg: number; vol: number;
  }> = [];

  let price = base;
  const now = Date.now();

  for (let i = totalRows; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    // Skip weekends
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    const s = seed + i;
    const noise = (seededRandom(s) - 0.5) * 4;
    const trend = Math.sin(i / 40) * 0.5;
    price = Math.max(base * 0.5, price + noise + trend);

    const open = price + (seededRandom(s + 1) - 0.5) * 2;
    const close = price;
    const high = Math.max(open, close) + seededRandom(s + 2) * 3;
    const low = Math.min(open, close) - seededRandom(s + 3) * 2;
    const vol = 10e6 + seededRandom(s + 4) * 80e6;
    const chg = close - open;
    const pctChg = (chg / open) * 100;

    rows.push({
      id: rows.length,
      date: d.toISOString().slice(0, 10),
      open, high, low, close, chg, pctChg, vol,
    });
  }
  return rows.reverse();
}

const PAGE_SIZE = 50;

export function FnHP({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const [page, setPage] = useState(0);

  const allRows = useMemo(() => generateHistory(ticker, 500), [ticker]);

  const sorted = useMemo(() => [...allRows].sort((a, b) => b.date.localeCompare(a.date)), [allRows]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const cols: DenseColumn[] = [
    { key: 'date', header: 'Date', width: '88px' },
    { key: 'open', header: 'Open', width: '74px', align: 'right', format: (v) => Number(v).toFixed(2), entity: (r) => makeFieldValueEntity('PX_BID', r.open, { source: 'SIM' }) },
    { key: 'high', header: 'High', width: '74px', align: 'right', format: (v) => Number(v).toFixed(2), entity: (r) => makeFieldValueEntity('52W_HIGH', r.high, { source: 'SIM' }) },
    { key: 'low', header: 'Low', width: '74px', align: 'right', format: (v) => Number(v).toFixed(2), entity: (r) => makeFieldValueEntity('52W_LOW', r.low, { source: 'SIM' }) },
    { key: 'close', header: 'Close', width: '74px', align: 'right', format: (v) => Number(v).toFixed(2), entity: (r) => makeFieldValueEntity('PX_LAST', r.close, { source: 'SIM', asOf: new Date(Date.now() - 2 * 60 * 1000).toISOString() }) },
    { key: 'chg', header: 'Chg', width: '66px', align: 'right', tone: true, format: (v) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}`, entity: (r) => makeFieldValueEntity('PX_CHG', r.chg, { source: 'CALC' }) },
    { key: 'pctChg', header: '%Chg', width: '70px', align: 'right', tone: true, format: (v) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`, entity: (r) => makeFieldValueEntity('PCT_CHG', r.pctChg, { source: 'CALC' }) },
    { key: 'vol', header: 'Volume', width: '86px', align: 'right', format: (v) => Number(v) >= 1e6 ? `${(Number(v) / 1e6).toFixed(1)}M` : `${(Number(v) / 1e3).toFixed(0)}K`, entity: (r) => makeFieldValueEntity('VOLUME', r.vol, { source: 'SIM', asOf: new Date(Date.now() - 65 * 1000).toISOString() }) },
  ];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`HP • Historical Pricing — ${ticker} — ${allRows.length} trading days`} />
      <DenseTable
        columns={cols}
        rows={pageRows}
        rowKey="id"
        className="flex-1 min-h-0"
        boldEveryNth={5}
        panelIdx={panelIdx}
        rowEntity={() => makeSecurity(panels[panelIdx]!.activeSecurity)}
      />
      {/* Pagination */}
      <div className="flex items-center justify-between flex-none" style={{ height: 16, background: DENSITY.bgSurface, borderTop: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px` }}>
        <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
          style={{ color: page === 0 ? DENSITY.textMuted : DENSITY.accentAmber, background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', fontSize: DENSITY.fontSizeTiny }}>
          ◀ PREV
        </button>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
          Page {page + 1}/{totalPages} • Rows {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
        </span>
        <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          style={{ color: page >= totalPages - 1 ? DENSITY.textMuted : DENSITY.accentAmber, background: 'none', border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: DENSITY.fontSizeTiny }}>
          NEXT ▶
        </button>
      </div>
    </div>
  );
}
