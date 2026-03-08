'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { TileLayoutRoot, TileGrid, TileCell, TerminalTile } from '../ui/TileLayout';
import { makeField, makeSecurity } from '../entities/types';
import { useDrill } from '../entities/DrillContext';
import { openContextMenuAt } from '../ui/ContextMenu';

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function hashStr(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

export interface OHLCVBar {
  ts: number;
  open: number; high: number; low: number; close: number; vol: number;
}

function generateBars(ticker: string, days: number): OHLCVBar[] {
  const seed = hashStr(ticker);
  const base = 80 + (seed % 400);
  const bars: OHLCVBar[] = [];
  let price = base;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const ts = now - i * 86400000;
    const d = new Date(ts);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const s = seed + i;
    const noise = (seededRandom(s) - 0.5) * 4;
    price = Math.max(base * 0.5, price + noise + Math.sin(i / 40) * 0.5);
    const open = price + (seededRandom(s + 1) - 0.5) * 2;
    const close = price;
    const high = Math.max(open, close) + seededRandom(s + 2) * 3;
    const low = Math.min(open, close) - seededRandom(s + 3) * 2;
    const vol = 10e6 + seededRandom(s + 4) * 80e6;
    bars.push({ ts, open, high, low, close, vol });
  }
  return bars;
}

function generateIntraday(ticker: string, minutesBack = 390): OHLCVBar[] {
  const seed = hashStr(ticker);
  const base = 80 + (seed % 400);
  const bars: OHLCVBar[] = [];
  let price = base;
  const now = Date.now();
  for (let i = minutesBack; i >= 0; i--) {
    const ts = now - i * 60000;
    const s = seed + i;
    const noise = (seededRandom(s) - 0.5) * 0.8;
    price = Math.max(base * 0.9, price + noise);
    const open = price + (seededRandom(s + 1) - 0.5) * 0.3;
    const close = price;
    const high = Math.max(open, close) + seededRandom(s + 2) * 0.5;
    const low = Math.min(open, close) - seededRandom(s + 3) * 0.4;
    const vol = 50000 + seededRandom(s + 4) * 500000;
    bars.push({ ts, open, high, low, close, vol });
  }
  return bars;
}

const TF_DAYS: Record<string, number> = { '5D': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '3Y': 756, '5Y': 1260, MAX: 2520 };
const TF_OPTIONS = ['5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];
const COMPARE_COLORS = ['#66c2ff', '#ffb000', '#4ce0a5', '#ff5b8a'];

interface CrosshairState { x: number; y: number; barIdx: number; visible: boolean }

function drawChart(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  seriesList: Array<{ bars: OHLCVBar[]; color: string; label: string }>,
  crosshair: CrosshairState | null,
  isIntraday = false,
) {
  ctx.clearRect(0, 0, W, H);

  const volH = Math.floor(H * 0.2);
  const mainH = H - volH - 2;
  const PAD_R = 42;
  const plotW = W - PAD_R;

  // Background
  ctx.fillStyle = DENSITY.bgBase;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#223041';
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    const y = (mainH / 10) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
    const x = (plotW / 10) * i;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mainH); ctx.stroke();
  }
  // Separator
  ctx.strokeStyle = DENSITY.groupSeparator;
  ctx.beginPath(); ctx.moveTo(0, mainH + 1); ctx.lineTo(W, mainH + 1); ctx.stroke();

  if (seriesList.length === 0 || seriesList[0]!.bars.length === 0) {
    ctx.fillStyle = DENSITY.textMuted;
    ctx.font = `${DENSITY.fontSizeDefault} ${DENSITY.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('NO DATA', W / 2, mainH / 2);
    return;
  }

  // Global price range (normalized to first series)
  const primary = seriesList[0]!;
  const allPrices = primary.bars.map((b) => b.close);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const rangeP = maxP - minP || 1;

  const toY = (p: number) => mainH - ((p - minP) / rangeP) * mainH;
  const toX = (i: number, n: number) => (i / Math.max(1, n - 1)) * plotW;

  // Volume bars
  const vols = primary.bars.map((b) => b.vol);
  const maxV = Math.max(...vols) || 1;
  for (let i = 0; i < vols.length; i++) {
    const bW = Math.max(1, plotW / vols.length - 0.5);
    const bH = (vols[i]! / maxV) * volH;
    const x = toX(i, vols.length);
    ctx.fillStyle = '#2a3545';
    ctx.fillRect(x - bW / 2, H - bH, bW, bH);
  }

  // Market open marker for intraday
  if (isIntraday) {
    const openIdx = Math.floor(primary.bars.length * 0.1);
    const ox = toX(openIdx, primary.bars.length);
    ctx.strokeStyle = '#51657e';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, mainH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = DENSITY.textSecondary;
    ctx.font = `8px ${DENSITY.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText('OPEN', ox + 2, 8);
  }

  // Price lines for each series
  seriesList.forEach(({ bars, color, label }, si) => {
    if (bars.length === 0) return;
    // Normalize to first series range
    const series = si === 0 ? bars : bars.map((b) => {
      const ref0 = primary.bars[0]!.close;
      const refS = bars[0]!.close;
      const scale = ref0 / refS;
      return { ...b, close: b.close * scale };
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < series.length; i++) {
      const x = toX(i, series.length);
      const y = toY(series[i]!.close);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Legend micro text
    if (seriesList.length > 1) {
      ctx.fillStyle = color;
      ctx.font = `8px ${DENSITY.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText(label, 4 + si * 60, mainH - 3);
    }
  });

  // Y-axis labels
  ctx.font = `8px ${DENSITY.fontFamily}`;
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = minP + (rangeP / 4) * i;
    const y = mainH - (i / 4) * mainH;
    ctx.fillStyle = '#0b1017';
    ctx.fillRect(plotW, y - 6, PAD_R, 11);
    ctx.strokeStyle = DENSITY.borderColor;
    ctx.strokeRect(plotW, y - 6, PAD_R, 11);
    ctx.fillStyle = DENSITY.textSecondary;
    ctx.fillText(val.toFixed(2), W - 1, y + 3);
  }

  // Crosshair
  if (crosshair?.visible && crosshair.barIdx >= 0 && crosshair.barIdx < primary.bars.length) {
    const cx = toX(crosshair.barIdx, primary.bars.length);
    const bar = primary.bars[crosshair.barIdx]!;
    const cy = toY(bar.close);

    ctx.strokeStyle = '#54677f';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, mainH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(plotW, cy); ctx.stroke();
    ctx.setLineDash([]);

    // OHLC tooltip
    const d = new Date(bar.ts).toISOString().slice(0, 10);
    const lines = [d, `O ${bar.open.toFixed(2)}`, `H ${bar.high.toFixed(2)}`, `L ${bar.low.toFixed(2)}`, `C ${bar.close.toFixed(2)}`];
    const bx = cx + 5 < plotW - 80 ? cx + 5 : cx - 75;
    ctx.fillStyle = '#0b1017';
    ctx.fillRect(bx - 2, 4, 72, 10 * lines.length + 4);
    ctx.fillStyle = DENSITY.accentAmber;
    ctx.font = `8px ${DENSITY.fontFamily}`;
    ctx.textAlign = 'left';
    lines.forEach((l, i) => ctx.fillText(l, bx, 12 + i * 10));
  }
}

export function FnGP({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const { drill } = useDrill();
  const p = panels[panelIdx]!;
  const ticker = p.activeSecurity.split(' ')[0] ?? 'AAPL';
  const days = TF_DAYS[p.timeframe] ?? 252;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [compareInput, setCompareInput] = useState('');
  const [compareTicker, setCompareTicker] = useState('');
  const [crosshair, setCrosshair] = useState<CrosshairState>({ x: 0, y: 0, barIdx: -1, visible: false });

  const primaryBars = useMemo(() => generateBars(ticker, days), [ticker, days]);
  const compareBars = useMemo(() => compareTicker ? generateBars(compareTicker, days) : [], [compareTicker, days]);

  const series = useMemo(() => {
    const s = [{ bars: primaryBars, color: COMPARE_COLORS[0]!, label: ticker }];
    if (compareBars.length > 0) s.push({ bars: compareBars, color: COMPARE_COLORS[1]!, label: compareTicker });
    return s;
  }, [primaryBars, compareBars, ticker, compareTicker]);

  const statRows = useMemo(() => {
    const first = primaryBars[0]?.close ?? 1;
    const last = primaryBars[primaryBars.length - 1]?.close ?? first;
    const hi = Math.max(...primaryBars.map((b) => b.high));
    const lo = Math.min(...primaryBars.map((b) => b.low));
    const ret = ((last - first) / first) * 100;
    const vol = Math.sqrt(primaryBars.reduce((acc, b, i, arr) => {
      if (i === 0) return acc;
      const prev = arr[i - 1]!.close;
      const r = (b.close - prev) / prev;
      return acc + r * r;
    }, 0) / Math.max(1, primaryBars.length - 1)) * Math.sqrt(252) * 100;
    return [
      { id: 'last', metric: 'Last', value: last.toFixed(2), chg: `${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%` },
      { id: 'hi', metric: 'High', value: hi.toFixed(2), chg: '+H' },
      { id: 'lo', metric: 'Low', value: lo.toFixed(2), chg: '-L' },
      { id: 'vol', metric: 'Vol Ann', value: `${vol.toFixed(1)}%`, chg: 'σ' },
      { id: 'beta', metric: 'Beta', value: (0.8 + (hashStr(ticker) % 16) / 10).toFixed(2), chg: 'Adj' },
      { id: 'atr', metric: 'ATR', value: ((hi - lo) / 14).toFixed(2), chg: '14d' },
      { id: 'rv', metric: 'RV 20d', value: `${(vol * 0.9).toFixed(1)}%`, chg: '20d' },
      { id: 'skew', metric: 'Skew', value: `${(hashStr(ticker) % 20 - 10).toFixed(1)}`, chg: '25d' },
    ];
  }, [primaryBars, ticker]);

  const volumeProfileRows = useMemo(() => {
    const maxVol = Math.max(...primaryBars.map((b) => b.vol), 1);
    const buckets = primaryBars.slice(-20).map((b, i) => ({
      id: `vp-${i}`,
      px: b.close.toFixed(2),
      vol: (b.vol / 1e6).toFixed(1) + 'M',
      bar: '█'.repeat(Math.max(1, Math.min(12, Math.round((b.vol / maxVol) * 12)))),
    }));
    return buckets.reverse();
  }, [primaryBars]);

  const relatedRows = useMemo(() => {
    const peers = ['MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'SPY', 'QQQ', 'IWM'];
    return peers.filter((x) => x !== ticker).slice(0, 8).map((sym, i) => ({
      id: sym,
      ticker: sym,
      perf: ((i % 2 === 0 ? 1 : -1) * (0.6 + ((hashStr(sym + ticker) % 20) / 10))).toFixed(2),
      spark: [0, 1, 2, 3, 4, 5].map((k) => {
        const v = (hashStr(sym) + i * 7 + k * 5) % 8;
        return ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'][v] ?? '▁';
      }).join(''),
    }));
  }, [ticker]);

  const statCols: DenseColumn[] = [
    { key: 'metric', header: 'Metric', width: '1fr' },
    { key: 'value', header: 'Value', width: '70px', align: 'right' },
    { key: 'chg', header: 'Ctx', width: '56px', align: 'right' },
  ];
  const profileCols: DenseColumn[] = [
    { key: 'px', header: 'Px', width: '70px', align: 'right' },
    { key: 'vol', header: 'Vol', width: '68px', align: 'right' },
    { key: 'bar', header: 'Profile', width: '1fr' },
  ];
  const relatedCols: DenseColumn[] = [
    { key: 'ticker', header: 'Ticker', width: '64px', entity: (r) => makeSecurity(`${String(r.ticker)} US Equity`, String(r.ticker)) },
    { key: 'perf', header: '%', width: '50px', align: 'right', tone: true, format: (v) => `${Number(v) >= 0 ? '+' : ''}${v}%` },
    { key: 'spark', header: 'Mini', width: '1fr' },
  ];
  const [relatedSel, setRelatedSel] = useState(0);

  const paint = useCallback((ch: CrosshairState | null = null) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const W = Math.floor(rect.width);
    const H = Math.floor(rect.height);
    if (W < 10 || H < 10) return;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, W, H, series, ch);
  }, [series]);

  useEffect(() => { paint(crosshair.visible ? crosshair : null); }, [paint, crosshair]);

  useEffect(() => {
    const ro = new ResizeObserver(() => paint());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [paint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const PAD_R = 42;
    const plotW = canvas.width - PAD_R;
    const n = primaryBars.length;
    const barIdx = Math.round((x / plotW) * (n - 1));
    setCrosshair({ x, y, barIdx: Math.max(0, Math.min(n - 1, barIdx)), visible: true });
  }, [primaryBars.length]);

  const handleMouseLeave = useCallback(() => {
    setCrosshair((c) => ({ ...c, visible: false }));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader
        title={`GP • ${ticker}${compareTicker ? ` vs ${compareTicker}` : ''} — ${p.timeframe}`}
        right={
          <div className="flex items-center gap-1">
            {TF_OPTIONS.map((tf) => (
              <button key={tf} type="button"
                onClick={() => dispatchPanel(panelIdx, { type: 'SET_TIMEFRAME', tf })}
                style={{ background: p.timeframe === tf ? '#1a2a3a' : 'none', color: p.timeframe === tf ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: '8px', border: `1px solid ${p.timeframe === tf ? DENSITY.accentAmber : DENSITY.gridlineColor}`, padding: '0 3px', cursor: 'pointer' }}>
                {tf}
              </button>
            ))}
            <input value={compareInput} onChange={(e) => setCompareInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') { setCompareTicker(compareInput); setCompareInput(''); } }}
              placeholder="vs..." style={{ width: 44, background: '#111', border: `1px solid ${DENSITY.gridlineColor}`, color: DENSITY.accentAmber, fontSize: '8px', padding: '0 2px', outline: 'none' }} />
          </div>
        }
      />
      <div className="flex-1 min-h-0">
        <TileLayoutRoot panelIdx={panelIdx}>
          <TileGrid
            spec={{
              columns: '1.9fr 1fr',
              rows: '1.2fr 0.8fr',
              areas: ['chart stats', 'vol rel'],
            }}
          >
            <TileCell area="chart">
              <TerminalTile
                id="gp-chart"
                title={`Price Chart • ${ticker}`}
                status={`${p.timeframe} • SIM`}
                shortcuts="DES/RELS"
                onShortcut={() => drill(makeSecurity(`${ticker} US Equity`, ticker), 'OPEN_IN_PLACE', panelIdx)}
                onEnter={() => drill(makeSecurity(`${ticker} US Equity`, ticker), 'OPEN_IN_PLACE', panelIdx)}
                onEnterNewPane={() => drill(makeSecurity(`${ticker} US Equity`, ticker), 'OPEN_IN_NEW_PANE', panelIdx)}
                onInspect={() => drill(makeSecurity(`${ticker} US Equity`, ticker), 'INSPECT_OVERLAY', panelIdx)}
                onMenu={(x, y) => openContextMenuAt(x, y, makeSecurity(`${ticker} US Equity`, ticker), panelIdx)}
                footer="ENTER Drill security • F2 Tile menu • Shift+Enter send"
              >
                <div ref={containerRef} className="h-full min-h-0 relative" style={{ cursor: 'crosshair' }}>
                  <div className="absolute left-1 top-1 z-10 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        drill(makeSecurity(`${ticker} US Equity`, ticker), e.shiftKey ? 'OPEN_IN_NEW_PANE' : 'OPEN_IN_PLACE', panelIdx);
                      }}
                      onContextMenu={(e) => { e.preventDefault(); openContextMenuAt(e.clientX, e.clientY, makeSecurity(`${ticker} US Equity`, ticker), panelIdx); }}
                      style={{ border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.panelBgAlt, color: DENSITY.accentCyan, fontSize: '8px', padding: '0 3px' }}
                    >
                      {ticker}
                    </button>
                    {compareTicker ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          drill(makeSecurity(`${compareTicker} US Equity`, compareTicker), e.shiftKey ? 'OPEN_IN_NEW_PANE' : 'OPEN_IN_PLACE', panelIdx);
                        }}
                        onContextMenu={(e) => { e.preventDefault(); openContextMenuAt(e.clientX, e.clientY, makeSecurity(`${compareTicker} US Equity`, compareTicker), panelIdx); }}
                        style={{ border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.panelBgAlt, color: DENSITY.accentAmber, fontSize: '8px', padding: '0 3px' }}
                      >
                        {compareTicker}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const last = primaryBars[primaryBars.length - 1]?.close ?? 0;
                        drill(makeField('PX_LAST', last), e.shiftKey ? 'OPEN_IN_NEW_PANE' : 'OPEN_IN_PLACE', panelIdx);
                      }}
                      style={{ border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.panelBgAlt, color: DENSITY.textSecondary, fontSize: '8px', padding: '0 3px' }}
                    >
                      PX_LAST
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>
              </TerminalTile>
            </TileCell>
            <TileCell area="stats">
              <TerminalTile id="gp-stats" title="Stats / Returns / Vol" status="Context pack">
                <DenseTable columns={statCols} rows={statRows} rowKey="id" panelIdx={panelIdx} className="h-full" compact />
              </TerminalTile>
            </TileCell>
            <TileCell area="vol">
              <TerminalTile id="gp-volume" title="Volume Profile" status="20 bars">
                <DenseTable columns={profileCols} rows={volumeProfileRows} rowKey="id" panelIdx={panelIdx} className="h-full" compact />
              </TerminalTile>
            </TileCell>
            <TileCell area="rel">
              <TerminalTile
                id="gp-related"
                title="Related Tickers Mini Chart Strip"
                status="Peers + sparkline"
                onEnter={() => {
                  const row = relatedRows[relatedSel];
                  if (!row) return;
                  drill(makeSecurity(`${row.ticker} US Equity`, row.ticker), 'OPEN_IN_PLACE', panelIdx);
                }}
                onEnterNewPane={() => {
                  const row = relatedRows[relatedSel];
                  if (!row) return;
                  drill(makeSecurity(`${row.ticker} US Equity`, row.ticker), 'OPEN_IN_NEW_PANE', panelIdx);
                }}
                onInspect={() => {
                  const row = relatedRows[relatedSel];
                  if (!row) return;
                  drill(makeSecurity(`${row.ticker} US Equity`, row.ticker), 'INSPECT_OVERLAY', panelIdx);
                }}
              >
                <DenseTable
                  columns={relatedCols}
                  rows={relatedRows}
                  rowKey="id"
                  selectedRow={relatedSel}
                  onRowClick={(r) => setRelatedSel(relatedRows.findIndex((x) => x.id === String(r.id)))}
                  panelIdx={panelIdx}
                  className="h-full"
                  compact
                />
              </TerminalTile>
            </TileCell>
          </TileGrid>
        </TileLayoutRoot>
      </div>
    </div>
  );
}

export function FnGIP({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const ticker = p.activeSecurity.split(' ')[0] ?? 'AAPL';
  const [crosshair, setCrosshair] = useState<CrosshairState>({ x: 0, y: 0, barIdx: -1, visible: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const bars = useMemo(() => generateIntraday(ticker, 390), [ticker]);
  const series = useMemo(() => [{ bars, color: COMPARE_COLORS[0]!, label: ticker }], [bars, ticker]);

  const paint = useCallback((ch: CrosshairState | null = null) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const W = Math.floor(rect.width);
    const H = Math.floor(rect.height);
    if (W < 10 || H < 10) return;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, W, H, series, ch, true);
  }, [series]);

  useEffect(() => { paint(crosshair.visible ? crosshair : null); }, [paint, crosshair]);

  useEffect(() => {
    const ro = new ResizeObserver(() => paint());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [paint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const PAD_R = 42;
    const plotW = canvas.width - PAD_R;
    const barIdx = Math.round((x / plotW) * (bars.length - 1));
    setCrosshair({ x, y, barIdx: Math.max(0, Math.min(bars.length - 1, barIdx)), visible: true });
  }, [bars.length]);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`GIP • Intraday — ${ticker}`} right={
        <span style={{ color: DENSITY.textMuted, fontSize: '8px' }}>1-min bars • {bars.length} pts</span>
      } />
      <div ref={containerRef} className="flex-1 min-h-0 relative" style={{ cursor: 'crosshair' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ display: 'block', width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCrosshair((c) => ({ ...c, visible: false }))}
        />
      </div>
    </div>
  );
}
