'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

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
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const allRows = useMemo(() => generateHistory(ticker, 500), [ticker]);

  const sorted = useMemo(() => {
    return [...allRows].sort((a, b) => {
      const va = a[sort.key as keyof typeof a]; const vb = b[sort.key as keyof typeof b];
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [allRows, sort]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = useCallback((key: string) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(0);
  }, []);

  const COLS = [
    { key: 'date', label: 'Date', w: '80px', align: 'left' },
    { key: 'open', label: 'Open', w: '70px', align: 'right' },
    { key: 'high', label: 'High', w: '70px', align: 'right' },
    { key: 'low', label: 'Low', w: '70px', align: 'right' },
    { key: 'close', label: 'Close', w: '70px', align: 'right' },
    { key: 'chg', label: 'Chg', w: '60px', align: 'right' },
    { key: 'pctChg', label: '%Chg', w: '60px', align: 'right' },
    { key: 'vol', label: 'Volume', w: '80px', align: 'right' },
  ];

  const gridCols = COLS.map((c) => c.w).join(' ');
  const RH = DENSITY.rowHeightPx;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`HP • Historical Pricing — ${ticker} — ${allRows.length} trading days`} />
      {/* Sort header */}
      <div className="flex-none grid select-none" style={{ gridTemplateColumns: gridCols, height: RH, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        {COLS.map((col) => (
          <button key={col.key} type="button" onClick={() => toggleSort(col.key)}
            style={{ padding: '0 2px', textAlign: col.align as 'left' | 'right', color: sort.key === col.key ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
            {col.label}{sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
          </button>
        ))}
      </div>
      {/* Data rows */}
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {pageRows.map((row, ri) => {
          const isBold = (ri + 1) % 5 === 0;
          return (
            <div key={row.id} className="grid items-center"
              style={{ gridTemplateColumns: gridCols, height: RH, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: ri % 2 === 1 ? '#060606' : DENSITY.bgBase, fontWeight: isBold ? 700 : 400 }}>
              <span className="px-[2px]" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>{row.date}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeDefault }}>{row.open.toFixed(2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeDefault }}>{row.high.toFixed(2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeDefault }}>{row.low.toFixed(2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{row.close.toFixed(2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: row.chg >= 0 ? DENSITY.accentGreen : DENSITY.accentRed, fontSize: DENSITY.fontSizeDefault }}>
                {(row.chg >= 0 ? '+' : '') + row.chg.toFixed(2)}
              </span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: row.pctChg >= 0 ? DENSITY.accentGreen : DENSITY.accentRed, fontSize: DENSITY.fontSizeDefault }}>
                {(row.pctChg >= 0 ? '+' : '') + row.pctChg.toFixed(2) + '%'}
              </span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>
                {row.vol >= 1e6 ? (row.vol / 1e6).toFixed(1) + 'M' : (row.vol / 1e3).toFixed(0) + 'K'}
              </span>
            </div>
          );
        })}
      </div>
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
