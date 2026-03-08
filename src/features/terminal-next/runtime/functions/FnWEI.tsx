'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, StatusBadge } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity, makeIndex, makeETF, makeCountry } from '../entities/types';
import type { DrillIntent } from '../entities/linkResolver';

function fmtN(n: number, dec = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPct(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}
function clrPct(n: number): string {
  return n > 0 ? DENSITY.accentGreen : n < 0 ? DENSITY.accentRed : DENSITY.textPrimary;
}

const MASTER = [
  // Americas
  { symbol: 'SPX Index', name: 'S&P 500', region: 'US', ccy: 'USD', base: 5280, type: 'INDEX' },
  { symbol: 'INDU Index', name: 'Dow Jones', region: 'US', ccy: 'USD', base: 39380, type: 'INDEX' },
  { symbol: 'CCMP Index', name: 'NASDAQ Comp', region: 'US', ccy: 'USD', base: 16720, type: 'INDEX' },
  { symbol: 'RTY Index', name: 'Russell 2000', region: 'US', ccy: 'USD', base: 2070, type: 'INDEX' },
  { symbol: 'NDX Index', name: 'NASDAQ 100', region: 'US', ccy: 'USD', base: 18300, type: 'INDEX' },
  { symbol: 'SPY US Equity', name: 'SPDR S&P 500 ETF', region: 'US', ccy: 'USD', base: 528, type: 'ETF' },
  { symbol: 'QQQ US Equity', name: 'Invesco QQQ', region: 'US', ccy: 'USD', base: 445, type: 'ETF' },
  { symbol: 'IWM US Equity', name: 'iShares Russell 2K', region: 'US', ccy: 'USD', base: 207, type: 'ETF' },
  { symbol: 'SPTSX Index', name: 'TSX Composite', region: 'CA', ccy: 'CAD', base: 22100, type: 'INDEX' },
  { symbol: 'IBOV Index', name: 'Bovespa', region: 'BR', ccy: 'BRL', base: 126500, type: 'INDEX' },
  { symbol: 'MEXBOL Index', name: 'IPC Mexico', region: 'MX', ccy: 'MXN', base: 55400, type: 'INDEX' },
  // Europe
  { symbol: 'UKX Index', name: 'FTSE 100', region: 'GB', ccy: 'GBP', base: 8260, type: 'INDEX' },
  { symbol: 'DAX Index', name: 'DAX 40', region: 'DE', ccy: 'EUR', base: 18350, type: 'INDEX' },
  { symbol: 'CAC Index', name: 'CAC 40', region: 'FR', ccy: 'EUR', base: 8020, type: 'INDEX' },
  { symbol: 'SX5E Index', name: 'Euro Stoxx 50', region: 'EU', ccy: 'EUR', base: 5030, type: 'INDEX' },
  { symbol: 'SMI Index', name: 'Swiss Market', region: 'CH', ccy: 'CHF', base: 11700, type: 'INDEX' },
  { symbol: 'AEX Index', name: 'AEX (Netherlands)', region: 'NL', ccy: 'EUR', base: 880, type: 'INDEX' },
  { symbol: 'OMX Index', name: 'OMX Stockholm', region: 'SE', ccy: 'SEK', base: 2520, type: 'INDEX' },
  { symbol: 'OSEBX Index', name: 'Oslo Stock Exchange', region: 'NO', ccy: 'NOK', base: 1432, type: 'INDEX' },
  { symbol: 'BEL20 Index', name: 'BEL 20 (Belgium)', region: 'BE', ccy: 'EUR', base: 3750, type: 'INDEX' },
  // Asia-Pacific
  { symbol: 'NKY Index', name: 'Nikkei 225', region: 'JP', ccy: 'JPY', base: 38900, type: 'INDEX' },
  { symbol: 'TPX Index', name: 'TOPIX', region: 'JP', ccy: 'JPY', base: 2712, type: 'INDEX' },
  { symbol: 'HSI Index', name: 'Hang Seng', region: 'HK', ccy: 'HKD', base: 17200, type: 'INDEX' },
  { symbol: 'SHCOMP Index', name: 'Shanghai Comp', region: 'CN', ccy: 'CNY', base: 3100, type: 'INDEX' },
  { symbol: 'SHSZ300 Index', name: 'CSI 300', region: 'CN', ccy: 'CNY', base: 3580, type: 'INDEX' },
  { symbol: 'KOSPI Index', name: 'KOSPI', region: 'KR', ccy: 'KRW', base: 2680, type: 'INDEX' },
  { symbol: 'AS51 Index', name: 'ASX 200', region: 'AU', ccy: 'AUD', base: 7900, type: 'INDEX' },
  { symbol: 'SENSEX Index', name: 'Sensex', region: 'IN', ccy: 'INR', base: 73800, type: 'INDEX' },
  { symbol: 'NIFTY Index', name: 'NIFTY 50', region: 'IN', ccy: 'INR', base: 22330, type: 'INDEX' },
  { symbol: 'TWSE Index', name: 'TAIEX', region: 'TW', ccy: 'TWD', base: 20000, type: 'INDEX' },
  // MENA + Africa
  { symbol: 'TASI Index', name: 'Tadawul', region: 'SA', ccy: 'SAR', base: 12200, type: 'INDEX' },
  { symbol: 'DFMGI Index', name: 'Dubai FM Gen', region: 'AE', ccy: 'AED', base: 4250, type: 'INDEX' },
  { symbol: 'FTSE JSE Index', name: 'JSE All-Share', region: 'ZA', ccy: 'ZAR', base: 78200, type: 'INDEX' },
  // Sector ETFs
  { symbol: 'XLK US Equity', name: 'SPDR Technology', region: 'US', ccy: 'USD', base: 215, type: 'ETF' },
  { symbol: 'XLF US Equity', name: 'SPDR Financials', region: 'US', ccy: 'USD', base: 42, type: 'ETF' },
  { symbol: 'XLE US Equity', name: 'SPDR Energy', region: 'US', ccy: 'USD', base: 91, type: 'ETF' },
  { symbol: 'XLV US Equity', name: 'SPDR Healthcare', region: 'US', ccy: 'USD', base: 140, type: 'ETF' },
  { symbol: 'XLI US Equity', name: 'SPDR Industrials', region: 'US', ccy: 'USD', base: 127, type: 'ETF' },
  { symbol: 'GLD US Equity', name: 'SPDR Gold', region: 'US', ccy: 'USD', base: 218, type: 'ETF' },
  { symbol: 'TLT US Equity', name: 'iShares 20Y Treas', region: 'US', ccy: 'USD', base: 89, type: 'ETF' },
];

function hash(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

const COLS = [
  { key: 'name', label: 'Index / ETF', w: '2fr', align: 'left' },
  { key: 'symbol', label: 'Ticker', w: '100px', align: 'left' },
  { key: 'region', label: 'Rgn', w: '32px', align: 'left' },
  { key: 'ccy', label: 'CCY', w: '36px', align: 'left' },
  { key: 'type', label: 'Type', w: '44px', align: 'left' },
  { key: 'last', label: 'Last', w: '80px', align: 'right' },
  { key: 'chg', label: 'Chg', w: '64px', align: 'right' },
  { key: 'pct', label: '%Chg', w: '62px', align: 'right' },
  { key: 'open', label: 'Open', w: '72px', align: 'right' },
  { key: 'high', label: 'High', w: '72px', align: 'right' },
  { key: 'low', label: 'Low', w: '72px', align: 'right' },
  { key: 'time', label: 'Time', w: '48px', align: 'right' },
];

type SortKey = 'name' | 'symbol' | 'region' | 'last' | 'chg' | 'pct';
type SortDir = 'asc' | 'desc';

export function FnWEI({ panelIdx }: { panelIdx: number }) {
  const { state } = useTerminalStore();
  const { drill } = useDrill();
  const tick = state.tick;
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'region', dir: 'asc' });

  const rows = useMemo(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return MASTER.map((idx) => {
      const h = hash(idx.symbol);
      const noise = (((h * 7 + tick * 3) & 0xFFFF) % 400 - 200) / 100;
      const last = idx.base * (1 + noise * 0.003);
      const chg = last - idx.base;
      const pct = (chg / idx.base) * 100;
      const open = last + (((h * 11) % 40 - 20) / 10) * 0.01 * idx.base;
      const high = Math.max(last, open) * (1 + (h % 8) * 0.0005);
      const low = Math.min(last, open) * (1 - (h % 9) * 0.0005);
      return { id: idx.symbol, ...idx, last, chg, pct, open, high, low, time: timeStr };
    });
  }, [tick]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = a[sort.key as keyof typeof a]; const vb = b[sort.key as keyof typeof b];
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  const prevRef = useRef<Map<string, number>>(new Map());
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    const next: Record<string, 'up' | 'down'> = {};
    for (const r of rows) {
      const prev = prevRef.current.get(r.id);
      if (prev != null && prev !== r.last) next[r.id] = r.last > prev ? 'up' : 'down';
      prevRef.current.set(r.id, r.last);
    }
    if (Object.keys(next).length > 0) {
      setFlashMap(next);
      const t = setTimeout(() => setFlashMap({}), DENSITY.flashDurationMs);
      return () => clearTimeout(t);
    }
  }, [rows]);

  const makeRowEntity = (row: typeof rows[number]) => {
    if (row.type === 'INDEX') return makeIndex(row.symbol, row.name);
    if (row.type === 'ETF') return makeETF(row.symbol, row.name);
    return makeSecurity(row.symbol, row.name);
  };

  const gridCols = COLS.map((c) => c.w).join(' ');
  const RH = DENSITY.rowHeightPx;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`WEI • World Equity Indices — ${sorted.length} rows`} right={<StatusBadge label="SIM" variant="sim" />} />
      {/* Header row */}
      <div className="flex-none grid select-none" style={{ gridTemplateColumns: gridCols, height: RH, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        {COLS.map((col) => (
          <button key={col.key} type="button"
            onClick={() => setSort((s) => ({ key: col.key as SortKey, dir: s.key === col.key && s.dir === 'asc' ? 'desc' : 'asc' }))}
            className="truncate hover:text-white"
            style={{ padding: `0 2px`, textAlign: col.align as 'left' | 'right', color: sort.key === col.key ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
            {col.label}{sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
          </button>
        ))}
      </div>
      {/* Data rows */}
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {sorted.map((row, ri) => {
          const flash = flashMap[row.id];
          const entity = makeRowEntity(row);
          return (
            <div key={row.id}
              className={`grid items-center cursor-pointer hover:bg-[#0a1520] ${flash === 'up' ? 'cell-flash-up' : flash === 'down' ? 'cell-flash-down' : ''}`}
              style={{ gridTemplateColumns: gridCols, height: RH, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: ri % 2 === 1 ? '#060606' : DENSITY.bgBase }}
              onClick={(e) => drill(entity, e.shiftKey ? 'OPEN_IN_NEW_PANEL' : 'OPEN_IN_PLACE', panelIdx)}
              onAuxClick={(e) => { if (e.button === 1) drill(entity, 'INSPECT_OVERLAY', panelIdx); }}
              title="Click: DES  •  Shift+Click: send to panel  •  Alt+Click: inspect"
            >
              <span className="px-[2px] truncate" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{row.name}</span>
              <span className="px-[2px] truncate cursor-pointer hover:underline" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}
                onClick={(e) => { e.stopPropagation(); drill(entity, e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE', panelIdx); }}>
                {row.symbol.split(' ').slice(0, 2).join(' ')}
              </span>
              <span className="px-[2px] cursor-pointer hover:underline" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}
                onClick={(e) => { e.stopPropagation(); const ce = makeCountry(row.region, row.region); drill(ce, e.shiftKey ? 'OPEN_IN_NEW_PANEL' : 'OPEN_IN_PLACE', panelIdx); }}>
                {row.region}
              </span>
              <span className="px-[2px]" style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>{row.ccy}</span>
              <span className="px-[2px]" style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>{row.type}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{fmtN(row.last, row.last < 100 ? 3 : 2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: clrPct(row.chg), fontSize: DENSITY.fontSizeDefault }}>{(row.chg >= 0 ? '+' : '') + fmtN(row.chg, 2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: clrPct(row.pct), fontSize: DENSITY.fontSizeDefault }}>{fmtPct(row.pct)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{fmtN(row.open, 2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>{fmtN(row.high, 2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny }}>{fmtN(row.low, 2)}</span>
              <span className="px-[2px] tabular-nums text-right" style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>{row.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
