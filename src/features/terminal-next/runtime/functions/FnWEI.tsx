'use client';

import React, { useMemo, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity, makeIndex, makeETF, makeCountry } from '../entities/types';
import { openContextMenuAt } from '../ui/ContextMenu';
import { TileLayoutRoot, TileGrid, TileCell, TerminalTile } from '../ui/TileLayout';
import { makeFieldValueEntity } from '../../services/fieldRuntime';

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

  const makeRowEntity = (row: typeof rows[number]) => {
    if (row.type === 'INDEX') return makeIndex(row.symbol, row.name);
    if (row.type === 'ETF') return makeETF(row.symbol, row.name);
    return makeSecurity(row.symbol, row.name);
  };
  const [mainSel, setMainSel] = useState(0);
  const [moverSel, setMoverSel] = useState(0);
  const [dispSel, setDispSel] = useState(0);

  const movers = useMemo(() => [...rows].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 12), [rows]);
  const dispersion = useMemo(() => {
    const byRegion = new Map<string, { region: string; count: number; sum: number; abs: number }>();
    rows.forEach((r) => {
      const v = byRegion.get(r.region) ?? { region: r.region, count: 0, sum: 0, abs: 0 };
      v.count += 1;
      v.sum += r.pct;
      v.abs += Math.abs(r.pct);
      byRegion.set(r.region, v);
    });
    return Array.from(byRegion.values()).map((v) => ({
      id: v.region,
      region: v.region,
      avgPct: v.sum / Math.max(1, v.count),
      disp: v.abs / Math.max(1, v.count),
      breadth: `${Math.max(1, Math.floor(v.count * 0.6))}/${v.count}`,
    })).sort((a, b) => b.disp - a.disp);
  }, [rows]);

  const corr = useMemo(() => {
    const pairs = [
      ['SPX', 'NDX'], ['SPX', 'RTY'], ['DAX', 'SX5E'], ['NKY', 'HSI'],
      ['SPX', 'UKX'], ['SHCOMP', 'HSI'], ['SPX', 'VIX proxy'], ['NKY', 'USDJPY proxy'],
    ];
    return pairs.map((p, i) => {
      const seed = hash(`${p[0]}-${p[1]}`);
      const val = Math.max(-1, Math.min(1, ((seed + tick * 9) % 200) / 100 - 1));
      return { id: `${p[0]}-${p[1]}`, pair: `${p[0]}/${p[1]}`, corr: val, regime: Math.abs(val) > 0.75 ? 'TIGHT' : Math.abs(val) > 0.45 ? 'MID' : 'LOOSE' };
    });
  }, [tick]);

  const stripRows = useMemo(() => {
    const top = movers[0];
    const worst = movers[movers.length - 1];
    return [
      { id: 'a1', item: `ALRT ${top?.symbol ?? 'SPX'} momentum`, type: 'ALRT', value: top ? fmtPct(top.pct) : '+0.00%' },
      { id: 'a2', item: `NOTE dispersion ${dispersion[0]?.region ?? 'US'}`, type: 'NOTE', value: dispersion[0] ? dispersion[0].disp.toFixed(2) : '0.00' },
      { id: 'a3', item: `ALRT risk-off basket`, type: 'ALRT', value: worst ? fmtPct(worst.pct) : '-0.00%' },
      { id: 'a4', item: `NOTE corr regime`, type: 'NOTE', value: corr[0]?.regime ?? 'MID' },
      { id: 'a5', item: `ALRT cross-asset stress`, type: 'ALRT', value: `${(Math.abs(corr[0]?.corr ?? 0) * 100).toFixed(0)}%` },
      { id: 'a6', item: `NOTE close watchlist`, type: 'NOTE', value: `${rows.slice(0, 3).map((r) => r.symbol.split(' ')[0]).join(', ')}` },
    ];
  }, [movers, dispersion, corr, rows]);

  const mainCols: DenseColumn[] = [
    { key: 'name', header: 'Index / ETF', width: '2fr' },
    { key: 'symbol', header: 'Ticker', width: '92px', entity: (r) => makeRowEntity(r as typeof rows[number]) },
    { key: 'region', header: 'Rgn', width: '38px', entity: (r) => makeCountry(String(r.region), String(r.region)) },
    { key: 'type', header: 'Type', width: '44px' },
    { key: 'last', header: 'Last', width: '86px', align: 'right', format: (v) => fmtN(Number(v), Number(v) < 100 ? 3 : 2), entity: (r) => makeFieldValueEntity('PX_LAST', r.last, { source: 'SIM' }) },
    { key: 'chg', header: 'Chg', width: '72px', align: 'right', tone: true, format: (v) => (Number(v) >= 0 ? '+' : '') + fmtN(Number(v), 2), entity: (r) => makeFieldValueEntity('PX_CHG', r.chg, { source: 'CALC' }) },
    { key: 'pct', header: '%Chg', width: '66px', align: 'right', tone: true, format: (v) => fmtPct(Number(v)), entity: (r) => makeFieldValueEntity('PCT_CHG', r.pct, { source: 'CALC' }) },
    { key: 'time', header: 'Time', width: '50px', align: 'right' },
  ];
  const moverCols: DenseColumn[] = [
    { key: 'symbol', header: 'Ticker', width: '90px', entity: (r) => makeRowEntity(r as typeof rows[number]) },
    { key: 'name', header: 'Name', width: '1fr' },
    { key: 'pct', header: '%Chg', width: '68px', align: 'right', tone: true, format: (v) => fmtPct(Number(v)), entity: (r) => makeFieldValueEntity('PCT_CHG', r.pct, { source: 'CALC' }) },
  ];
  const dispCols: DenseColumn[] = [
    { key: 'region', header: 'Region', width: '60px', entity: (r) => makeCountry(String(r.region), String(r.region)) },
    { key: 'avgPct', header: 'Avg%', width: '66px', align: 'right', tone: true, format: (v) => fmtPct(Number(v)), entity: (r) => makeFieldValueEntity('PCT_CHG', r.avgPct, { source: 'CALC' }) },
    { key: 'disp', header: 'Disp', width: '62px', align: 'right', format: (v) => Number(v).toFixed(2), entity: (r) => makeFieldValueEntity('PX_CHG', r.disp, { source: 'CALC' }) },
    { key: 'breadth', header: 'Br', width: '50px', align: 'right' },
  ];
  const corrCols: DenseColumn[] = [
    { key: 'pair', header: 'Pair', width: '1fr' },
    { key: 'corr', header: 'Corr', width: '70px', align: 'right', tone: true, format: (v) => Number(v).toFixed(2), entity: (r) => makeFieldValueEntity('BETA', r.corr, { source: 'CALC' }) },
    { key: 'regime', header: 'Regime', width: '58px' },
  ];
  const stripCols: DenseColumn[] = [
    { key: 'type', header: 'Type', width: '42px' },
    { key: 'item', header: 'Item', width: '1fr' },
    { key: 'value', header: 'Value', width: '120px', align: 'right', entity: (r) => makeFieldValueEntity('PCT_CHG', parseFloat(String(r.value)), { source: 'SIM' }) },
  ];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`WEI • World Equity Indices — ${sorted.length} rows`} right={<StatusBadge label="SIM" variant="sim" />} />
      <div className="flex-1 min-h-0">
        <TileLayoutRoot panelIdx={panelIdx}>
          <TileGrid
            spec={{
              columns: '2.2fr 1fr',
              rows: '1.2fr 0.9fr 0.9fr 0.5fr',
              areas: ['main movers', 'main disp', 'main corr', 'strip strip'],
            }}
          >
            <TileCell area="main">
              <TerminalTile
                id="wei-main"
                title="World Index Grid"
                status={`SIM • ${sorted.length} rows`}
                shortcuts="Ctrl+; cycle"
                onEnter={() => {
                  const row = sorted[mainSel];
                  if (!row) return;
                  drill(makeRowEntity(row), 'OPEN_IN_PLACE', panelIdx);
                }}
                onEnterNewPane={() => {
                  const row = sorted[mainSel];
                  if (!row) return;
                  drill(makeRowEntity(row), 'OPEN_IN_NEW_PANE', panelIdx);
                }}
                onInspect={() => {
                  const row = sorted[mainSel];
                  if (!row) return;
                  drill(makeRowEntity(row), 'INSPECT_OVERLAY', panelIdx);
                }}
                onMenu={(x, y) => {
                  const row = sorted[mainSel];
                  if (!row) return;
                  openContextMenuAt(x, y, makeRowEntity(row), panelIdx);
                }}
                footer={`Breadth ${dispersion[0]?.region ?? 'US'} • Disp ${dispersion[0]?.disp.toFixed(2) ?? '0.00'}`}
              >
                <DenseTable
                  columns={mainCols}
                  rows={sorted}
                  rowKey="id"
                  selectedRow={mainSel}
                  rowEntity={(r) => makeRowEntity(r as typeof rows[number])}
                  onRowClick={(r) => setMainSel(sorted.findIndex((x) => x.id === String(r.id)))}
                  panelIdx={panelIdx}
                  className="h-full"
                />
              </TerminalTile>
            </TileCell>
            <TileCell area="movers">
              <TerminalTile
                id="wei-movers"
                title="Top Movers"
                status="Abs move ranking"
                onEnter={() => {
                  const row = movers[moverSel];
                  if (!row) return;
                  drill(makeRowEntity(row), 'OPEN_IN_PLACE', panelIdx);
                }}
                onEnterNewPane={() => {
                  const row = movers[moverSel];
                  if (!row) return;
                  drill(makeRowEntity(row), 'OPEN_IN_NEW_PANE', panelIdx);
                }}
                onInspect={() => {
                  const row = movers[moverSel];
                  if (!row) return;
                  drill(makeRowEntity(row), 'INSPECT_OVERLAY', panelIdx);
                }}
                onMenu={(x, y) => {
                  const row = movers[moverSel];
                  if (!row) return;
                  openContextMenuAt(x, y, makeRowEntity(row), panelIdx);
                }}
              >
                <DenseTable
                  columns={moverCols}
                  rows={movers}
                  rowKey="id"
                  selectedRow={moverSel}
                  rowEntity={(r) => makeRowEntity(r as typeof rows[number])}
                  onRowClick={(r) => setMoverSel(movers.findIndex((x) => x.id === String(r.id)))}
                  panelIdx={panelIdx}
                  className="h-full"
                  compact
                />
              </TerminalTile>
            </TileCell>
            <TileCell area="disp">
              <TerminalTile
                id="wei-disp"
                title="Sector Dispersion"
                status="Region heat proxy"
                onEnter={() => {
                  const row = dispersion[dispSel];
                  if (!row) return;
                  drill(makeCountry(row.region, row.region), 'OPEN_IN_PLACE', panelIdx);
                }}
                onEnterNewPane={() => {
                  const row = dispersion[dispSel];
                  if (!row) return;
                  drill(makeCountry(row.region, row.region), 'OPEN_IN_NEW_PANE', panelIdx);
                }}
                onInspect={() => {
                  const row = dispersion[dispSel];
                  if (!row) return;
                  drill(makeCountry(row.region, row.region), 'INSPECT_OVERLAY', panelIdx);
                }}
              >
                <DenseTable
                  columns={dispCols}
                  rows={dispersion}
                  rowKey="id"
                  selectedRow={dispSel}
                  rowEntity={(r) => makeCountry(String(r.region), String(r.region))}
                  onRowClick={(r) => setDispSel(dispersion.findIndex((x) => x.id === String(r.id)))}
                  panelIdx={panelIdx}
                  className="h-full"
                  compact
                />
              </TerminalTile>
            </TileCell>
            <TileCell area="corr">
              <TerminalTile id="wei-corr" title="Correlation Matrix Mini" status="Cross-market">
                <DenseTable columns={corrCols} rows={corr} rowKey="id" panelIdx={panelIdx} className="h-full" compact />
              </TerminalTile>
            </TileCell>
            <TileCell area="strip">
              <TerminalTile id="wei-strip" title="Desk Strip: Alerts / Notes" status="Ops">
                <DenseTable columns={stripCols} rows={stripRows} rowKey="id" panelIdx={panelIdx} className="h-full" compact />
              </TerminalTile>
            </TileCell>
          </TileGrid>
        </TileLayoutRoot>
      </div>
    </div>
  );
}
