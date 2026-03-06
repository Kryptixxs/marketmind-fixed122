'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Clock3,
  Loader2,
  Radar,
  Shield,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { useTunnel } from '@/features/Terminal/context/TunnelContext';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { useSettings } from '@/services/context/SettingsContext';

const MARKET_CATEGORIES: Record<string, string[]> = {
  Equities: ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD'],
  Indices: ['NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 'FTSE100', 'NIKKEI'],
  Forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
  Commodities: ['GOLD', 'SILVER', 'CRUDE', 'NATGAS', 'COPPER'],
  Crypto: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'],
  Macro: ['DXY', 'VIX', 'US10Y', 'US2Y'],
};

const ALL_SYMBOLS = Object.values(MARKET_CATEGORIES).flat();

const LABELS: Record<string, string> = {
  AAPL: 'Apple', NVDA: 'NVIDIA', MSFT: 'Microsoft', TSLA: 'Tesla', GOOGL: 'Alphabet', AMZN: 'Amazon', META: 'Meta', AMD: 'AMD',
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', US30: 'Dow Jones', RUSSELL: 'Russell 2000', DAX40: 'DAX 40', FTSE100: 'FTSE 100', NIKKEI: 'Nikkei',
  EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', USDJPY: 'USD/JPY', AUDUSD: 'AUD/USD', USDCAD: 'USD/CAD',
  GOLD: 'Gold', SILVER: 'Silver', CRUDE: 'Crude Oil', NATGAS: 'Nat Gas', COPPER: 'Copper',
  BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum', SOLUSD: 'Solana', BNBUSD: 'BNB', XRPUSD: 'XRP',
  DXY: 'Dollar Index', VIX: 'Volatility', US10Y: '10Y Yield', US2Y: '2Y Yield',
};

const TIMEFRAMES: Array<{ label: string; interval: string }> = [
  { label: '5M', interval: '5m' },
  { label: '15M', interval: '15m' },
  { label: '1H', interval: '60m' },
  { label: '4H', interval: '240m' },
  { label: '1D', interval: '1d' },
];

function PanelHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="h-7 min-h-[28px] flex items-center justify-between px-2 border-b border-border bg-surface shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary truncate">{title}</span>
      </div>
      <span className="text-[8px] text-text-tertiary font-mono">PROTOTYPE</span>
    </div>
  );
}

function fmtPrice(symbol: string, value: number) {
  if (symbol.includes('USD') && symbol.length === 6) return value.toFixed(4);
  if (value < 10) return value.toFixed(3);
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function seedFromSymbol(symbol: string) {
  return symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('SPX500');
  const [activeCategory, setActiveCategory] = useState('Indices');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [candleHistory, setCandleHistory] = useState<OHLCV[]>([]);

  const { settings, updateSettings } = useSettings();
  const { push } = useTunnel();
  const { data: marketData } = useMarketData(ALL_SYMBOLS);
  const { data: selectedOnlyData } = useMarketData([selectedSymbol], timeframe.interval);
  const displayData = useMemo(() => {
    const minuteBucket = Math.floor(Date.now() / 60_000);
    const toFallback = (sym: string) => {
      const seed = seedFromSymbol(sym);
      const base = 20 + (seed % 2000) + (sym.includes('USD') ? 0.25 : 0);
      const drift = ((minuteBucket % 17) - 8) * 0.03;
      const changePercent = (((seed % 13) - 6) * 0.18) + drift;
      return {
        price: Number((base * (1 + changePercent / 100)).toFixed(4)),
        changePercent: Number(changePercent.toFixed(2)),
      };
    };
    return Object.fromEntries(
      ALL_SYMBOLS.map((sym) => {
        const live = marketData[sym];
        return [sym, live ?? toFallback(sym)];
      })
    ) as Record<string, { price: number; changePercent: number }>;
  }, [marketData]);
  const selectedTick = selectedOnlyData[selectedSymbol] || displayData[selectedSymbol];

  const drillToSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
    push({ type: 'SYMBOL', symbol: sym, label: LABELS[sym] || sym });
  };

  const loadHistory = useCallback(async (symbol: string, interval: string) => {
    const res = await fetchMarketData(symbol, interval);
    setCandleHistory(res?.history ?? []);
  }, []);

  useEffect(() => {
    setCandleHistory([]);
    loadHistory(selectedSymbol, timeframe.interval).catch(() => setCandleHistory([]));
  }, [selectedSymbol, timeframe.interval, loadHistory]);

  useEffect(() => {
    const onPreset = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail?.toUpperCase();
      if (detail === 'BMON' || detail === 'FLOW' || detail === 'MACRO' || detail === 'RISK') {
        updateSettings({ activeWorkspace: detail });
      }
    };
    window.addEventListener('vantage-workspace-preset', onPreset as EventListener);
    return () => window.removeEventListener('vantage-workspace-preset', onPreset as EventListener);
  }, [updateSettings]);

  const chartData = useMemo(() => {
    if (!candleHistory.length) return [];
    const mapped = candleHistory.map((h) => ({
      time: Math.floor(h.timestamp / 1000),
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
    }));
    if (mapped.length && selectedTick?.price) {
      const last = mapped[mapped.length - 1];
      last.high = Math.max(last.high, selectedTick.price);
      last.low = Math.min(last.low, selectedTick.price);
      last.close = selectedTick.price;
    }
    return mapped;
  }, [candleHistory, selectedTick]);

  const watchlist = MARKET_CATEGORIES[activeCategory] || [];
  const topMovers = useMemo(() => {
    return ALL_SYMBOLS
      .sort((a, b) => Math.abs(displayData[b]!.changePercent) - Math.abs(displayData[a]!.changePercent))
      .slice(0, 12);
  }, [displayData]);

  const orderBook = useMemo(() => {
    const px = selectedTick?.price ?? 0;
    if (!px) return { bids: [], asks: [] as Array<{ price: number; size: number }> };
    const tickSize = px < 50 ? 0.01 : 0.05;
    const bids = Array.from({ length: 8 }, (_, i) => ({
      price: Number((px - tickSize * (i + 1)).toFixed(4)),
      size: Math.floor(120 + (Math.sin(i + px) + 1) * 420),
    }));
    const asks = Array.from({ length: 8 }, (_, i) => ({
      price: Number((px + tickSize * (i + 1)).toFixed(4)),
      size: Math.floor(100 + (Math.cos(i + px) + 1) * 390),
    }));
    return { bids, asks };
  }, [selectedTick?.price]);

  const tradeTape = useMemo(() => {
    const px = selectedTick?.price ?? 0;
    if (!px) return [];
    const now = Date.now();
    return Array.from({ length: 14 }, (_, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const price = px * (1 + dir * (0.00015 + (i % 5) * 0.00008));
      return {
        id: `${selectedSymbol}-${i}`,
        time: new Date(now - i * 17_000).toISOString().slice(11, 19),
        price,
        size: Math.floor(25 + (i + 1) * 7),
        side: dir > 0 ? 'BUY' : 'SELL',
      };
    });
  }, [selectedTick?.price, selectedSymbol]);

  const blotter = useMemo(() => {
    return topMovers.slice(0, 14).map((sym, i) => {
      const tick = displayData[sym]!;
      const qty = 50 + i * 25;
      const avg = tick.price * (1 - tick.changePercent / 100 / 3);
      const pnl = (tick.price - avg) * qty;
      return { sym, qty, avg, last: tick.price, pnl, side: i % 2 === 0 ? 'LONG' : 'SHORT' };
    });
  }, [displayData, topMovers]);

  const flowHeatmap = useMemo(() => {
    return topMovers.slice(0, 10).map((sym, i) => {
      const tick = displayData[sym];
      const seed = seedFromSymbol(sym);
      const imbalance = ((seed % 31) - 15) / 15;
      const pressure = Math.min(99, Math.abs(Math.round(tick.changePercent * 7 + i * 3)));
      return {
        sym,
        pressure,
        imbalance,
        trend: tick.changePercent >= 0 ? 'UP' : 'DN',
      };
    });
  }, [displayData, topMovers]);

  const macroEvents = useMemo(() => {
    const now = new Date();
    const hh = now.toISOString().slice(11, 16);
    return [
      `${hh} UTC  US Initial Claims beat by 12k`,
      `${hh} UTC  ECB speaker signals data-dependent path`,
      `${hh} UTC  Crude inventories draw larger than expected`,
      `${hh} UTC  Nasdaq breadth improves to 62% advancers`,
      `${hh} UTC  Vol regime stable; no stress trigger fired`,
      `${hh} UTC  FX carry basket modest risk-on tilt`,
    ];
  }, []);

  const riskStrip = useMemo(() => {
    const values = blotter.map((b) => b.pnl);
    const gross = values.reduce((a, b) => a + Math.abs(b), 0);
    const net = values.reduce((a, b) => a + b, 0);
    const var95 = gross * 0.042;
    const drawdown = Math.min(0, net / Math.max(gross, 1) * 100);
    return { gross, net, var95, drawdown };
  }, [blotter]);

  const loadedCount = ALL_SYMBOLS.filter((s) => marketData[s]?.price).length;
  const workspacePreset = settings.activeWorkspace;
  const layout = settings.workspaceLayouts[workspacePreset];
  const showDepth = layout.showDepth;
  const showRisk = layout.showRisk;
  const showMacro = layout.showMacro;
  const showBlotter = layout.showBlotter;
  const showMovers = layout.showMovers;
  const rightTitle =
    workspacePreset === 'FLOW' ? 'Depth / Tape' :
    workspacePreset === 'MACRO' ? 'Macro / Signal Board' :
    workspacePreset === 'RISK' ? 'Risk / Exposure Console' : 'Depth / Tape / Risk';

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <TerminalCommandBar />

      <div className="h-8 border-b border-border bg-surface flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Radar size={12} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Market Operations Workspace</span>
        </div>
        <div className="flex items-center gap-1">
          {(['BMON', 'FLOW', 'MACRO', 'RISK'] as const).map((p) => (
            <button
              key={p}
              onClick={() => updateSettings({ activeWorkspace: p })}
              className={`px-2 py-0.5 text-[8px] font-bold uppercase border rounded ${
                workspacePreset === p ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
          <span className="ml-2 text-[9px] font-mono text-text-tertiary">{loadedCount}/{ALL_SYMBOLS.length} feeds online</span>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 grid gap-px bg-border overflow-hidden"
        style={{
          gridTemplateColumns: `${layout.leftWidth}px 1fr ${layout.rightWidth}px`,
          gridTemplateRows: `minmax(320px, ${100 - layout.bottomHeight}%) minmax(260px, ${layout.bottomHeight}%)`,
        }}
      >
        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="Cross-Asset Monitor" icon={<Waves size={11} className="text-cyan" />} />
          <div className="flex flex-wrap border-b border-border bg-surface shrink-0">
            {Object.keys(MARKET_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
                  activeCategory === cat ? 'text-accent border-b border-accent bg-accent/10' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {watchlist.map((sym) => {
              const t = displayData[sym];
              const hasData = !!t?.price;
              const up = (t?.changePercent ?? 0) >= 0;
              const active = selectedSymbol === sym;
              return (
                <button
                  key={sym}
                  onClick={() => drillToSymbol(sym)}
                  className={`w-full text-left px-2 py-1 border-b border-border/30 ${active ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold ${active ? 'text-accent' : 'text-text-primary'}`}>{sym}</div>
                      <div className="text-[8px] text-text-tertiary truncate">{LABELS[sym] || sym}</div>
                    </div>
                    <div className="text-right">
                      {hasData ? (
                        <>
                          <div className="text-[10px] font-mono text-text-primary">{fmtPrice(sym, t!.price)}</div>
                          <div className={`text-[8px] font-mono font-bold ${up ? 'text-positive' : 'text-negative'}`}>
                            {up ? '+' : ''}{t!.changePercent.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <Loader2 size={10} className="animate-spin text-text-tertiary ml-auto" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-background flex flex-col min-h-0">
          <PanelHeader title={`${selectedSymbol} — ${LABELS[selectedSymbol] || selectedSymbol}`} icon={<BookOpen size={11} className="text-accent" />} />
          <div className="h-8 border-b border-border bg-surface px-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                    timeframe.label === tf.label ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            {selectedTick?.price ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-text-primary">{fmtPrice(selectedSymbol, selectedTick.price)}</span>
                <span className={`text-[10px] font-mono font-bold ${selectedTick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {selectedTick.changePercent >= 0 ? '+' : ''}{selectedTick.changePercent.toFixed(2)}%
                </span>
              </div>
            ) : (
              <Loader2 size={12} className="animate-spin text-accent" />
            )}
          </div>
          <div className="flex-1 min-h-0">
            {chartData.length ? (
              <TradingChart key={`${selectedSymbol}-${timeframe.interval}`} data={chartData} symbol={selectedSymbol} />
            ) : (
              <div className="h-full flex items-center justify-center"><Loader2 size={18} className="animate-spin text-accent" /></div>
            )}
          </div>
        </div>

        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title={rightTitle} icon={<Shield size={11} className="text-warning" />} />

          {showDepth && (
          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Order Book ({selectedSymbol})</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-background border border-border rounded p-1">
                <div className="text-[8px] text-positive font-bold mb-1">Bids</div>
                {orderBook.bids.map((b) => (
                  <button
                    key={`b-${b.price}`}
                    onClick={() =>
                      push({
                        type: 'ORDER',
                        id: `b-${selectedSymbol}-${b.price}`,
                        symbol: selectedSymbol,
                        label: `${selectedSymbol} Bid ${b.price}`,
                        side: 'BUY',
                        qty: b.size,
                        price: b.price,
                      })
                    }
                    className="w-full flex justify-between text-[8px] font-mono hover:bg-surface-highlight"
                  >
                    <span className="text-positive">{fmtPrice(selectedSymbol, b.price)}</span>
                    <span className="text-text-tertiary">{b.size}</span>
                  </button>
                ))}
              </div>
              <div className="bg-background border border-border rounded p-1">
                <div className="text-[8px] text-negative font-bold mb-1">Asks</div>
                {orderBook.asks.map((a) => (
                  <button
                    key={`a-${a.price}`}
                    onClick={() =>
                      push({
                        type: 'ORDER',
                        id: `a-${selectedSymbol}-${a.price}`,
                        symbol: selectedSymbol,
                        label: `${selectedSymbol} Ask ${a.price}`,
                        side: 'SELL',
                        qty: a.size,
                        price: a.price,
                      })
                    }
                    className="w-full flex justify-between text-[8px] font-mono hover:bg-surface-highlight"
                  >
                    <span className="text-negative">{fmtPrice(selectedSymbol, a.price)}</span>
                    <span className="text-text-tertiary">{a.size}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          {showDepth && (
          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Time & Sales</div>
            <div className="bg-background border border-border rounded max-h-44 overflow-y-auto custom-scrollbar">
              {tradeTape.map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    push({
                      type: 'TAPE',
                      id: r.id,
                      symbol: selectedSymbol,
                      label: `${selectedSymbol} ${r.side} ${r.size}`,
                      side: r.side as 'BUY' | 'SELL',
                      qty: r.size,
                      price: r.price,
                      time: r.time,
                    })
                  }
                  className="w-full grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-2 py-1 border-b border-border/30 text-[8px] font-mono hover:bg-surface-highlight text-left"
                >
                  <span className="text-text-tertiary">{r.time}</span>
                  <span className={r.side === 'BUY' ? 'text-positive' : 'text-negative'}>{fmtPrice(selectedSymbol, r.price)}</span>
                  <span className="text-text-secondary">{r.size}</span>
                  <span className={r.side === 'BUY' ? 'text-positive' : 'text-negative'}>{r.side}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {showRisk && (
          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Desk Risk Strip</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">Gross</div>
                <div className="text-[10px] font-mono font-bold text-text-primary">${riskStrip.gross.toFixed(0)}</div>
              </div>
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">Net PnL</div>
                <div className={`text-[10px] font-mono font-bold ${riskStrip.net >= 0 ? 'text-positive' : 'text-negative'}`}>${riskStrip.net.toFixed(0)}</div>
              </div>
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">VaR 95%</div>
                <div className="text-[10px] font-mono font-bold text-warning">${riskStrip.var95.toFixed(0)}</div>
              </div>
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">Drawdown</div>
                <div className="text-[10px] font-mono font-bold text-negative">{riskStrip.drawdown.toFixed(2)}%</div>
              </div>
            </div>
          </div>
          )}

          {showMacro && (
          <div className="p-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Macro Board</div>
            {['SPX500', 'NAS100', 'US30', 'DXY', 'VIX', 'US10Y', 'GOLD', 'CRUDE'].map((sym) => {
              const t = marketData[sym];
              const up = (t?.changePercent ?? 0) >= 0;
              return (
                <div key={sym} className="flex items-center justify-between bg-background border border-border rounded px-2 py-1 mb-1">
                  <span className="text-[9px] font-bold text-text-primary">{LABELS[sym] || sym}</span>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-text-secondary">{fmtPrice(sym, t?.price ?? 0)}</div>
                    <div className={`text-[8px] font-mono ${up ? 'text-positive' : 'text-negative'}`}>{t ? `${up ? '+' : ''}${t.changePercent.toFixed(2)}%` : '--'}</div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          <div className="p-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Flow Heatmap</div>
            {flowHeatmap.map((f) => (
              <div key={f.sym} className="mb-1 rounded border border-border bg-background px-2 py-1">
                <div className="flex items-center justify-between text-[8px] font-mono">
                  <span className="text-text-primary font-bold">{f.sym}</span>
                  <span className={f.trend === 'UP' ? 'text-positive' : 'text-negative'}>
                    {f.trend} {f.pressure}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-surface-highlight overflow-hidden">
                  <div
                    className={`h-full ${f.imbalance >= 0 ? 'bg-positive' : 'bg-negative'}`}
                    style={{ width: `${Math.min(100, Math.max(8, Math.abs(Math.round(f.imbalance * 100))))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {showBlotter && (
        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="Execution Blotter" icon={<Clock3 size={11} className="text-warning" />} />
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Avg</th>
                  <th className="text-right">Last</th>
                  <th className="text-right">PnL</th>
                </tr>
              </thead>
              <tbody>
                {blotter.map((b) => (
                  <tr
                    key={b.sym}
                    onClick={() =>
                      push({
                        type: 'ORDER',
                        id: `blotter-${b.sym}-${b.side}`,
                        symbol: b.sym,
                        label: `${b.sym} ${b.side}`,
                        side: b.side === 'LONG' ? 'BUY' : 'SELL',
                        qty: b.qty,
                        price: b.last,
                      })
                    }
                    className="cursor-pointer"
                  >
                    <td className="font-bold text-text-primary">{b.sym}</td>
                    <td><span className={`badge ${b.side === 'LONG' ? 'badge-positive' : 'badge-negative'}`}>{b.side}</span></td>
                    <td className="text-right font-mono">{b.qty}</td>
                    <td className="text-right font-mono">{fmtPrice(b.sym, b.avg)}</td>
                    <td className="text-right font-mono">{fmtPrice(b.sym, b.last)}</td>
                    <td className={`text-right font-mono font-bold ${b.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{b.pnl >= 0 ? '+' : ''}{b.pnl.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="News / Alerts / Movers" icon={<Bell size={11} className="text-cyan" />} />
          <div className="flex-1 min-h-0 grid grid-cols-[1fr_170px] gap-px bg-border">
            <div className="bg-background min-h-0 overflow-hidden">
              <NewsFeed
                activeSymbol={selectedSymbol}
                onSelectArticle={(article) =>
                  push({
                    type: 'ARTICLE',
                    id: article.id || `dash-${article.source}-${article.time}`,
                    title: article.title,
                    label: article.title,
                    source: article.source,
                    time: article.time,
                    snippet: article.contentSnippet,
                    link: article.link,
                  })
                }
              />
            </div>
            <div className="bg-surface min-h-0 overflow-y-auto custom-scrollbar p-1.5">
              {showMovers && <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Top Movers</div>}
              {showMovers && topMovers.map((sym) => {
                const t = displayData[sym]!;
                const up = t.changePercent >= 0;
                return (
                  <button
                    key={sym}
                    onClick={() => drillToSymbol(sym)}
                    className="w-full bg-background border border-border rounded px-2 py-1 mb-1 text-left hover:border-border-highlight"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-primary">{sym}</span>
                      <span className={`text-[8px] font-mono ${up ? 'text-positive' : 'text-negative'}`}>
                        {up ? <TrendingUp size={9} className="inline mr-0.5" /> : <TrendingDown size={9} className="inline mr-0.5" />}
                        {up ? '+' : ''}{t.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[8px] text-text-tertiary truncate">{LABELS[sym] || sym}</div>
                  </button>
                );
              })}
              {showMovers && <div className="h-px bg-border my-1" />}
              <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Alert Log</div>
              {[
                `${selectedSymbol} touched intraday liquidity zone`,
                'Volatility cluster detected in index basket',
                'Cross-asset correlation shift > threshold',
              ].map((line, idx) => (
                <button
                  key={line}
                  onClick={() =>
                    push({
                      type: 'EVENT',
                      id: `alert-${idx}-${selectedSymbol}`,
                      label: line,
                      detail: `Desk signal generated for ${selectedSymbol} based on synthetic cross-asset model.`,
                      impact: idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW',
                    })
                  }
                  className="w-full text-left flex items-start gap-1.5 text-[8px] text-text-secondary mb-1 hover:bg-surface-highlight rounded px-1 py-0.5"
                >
                  <AlertTriangle size={9} className={idx === 0 ? 'text-warning mt-0.5' : 'text-text-tertiary mt-0.5'} />
                  <span>{line}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {!showBlotter && (
        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="Macro Event Tape" icon={<Clock3 size={11} className="text-warning" />} />
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
            {macroEvents.map((line) => (
              <button
                key={line}
                onClick={() =>
                  push({
                    type: 'EVENT',
                    id: `macro-${line.slice(0, 10)}`,
                    label: line,
                    detail: 'Macro desk timeline event generated from simulated macro tape.',
                    impact: 'MEDIUM',
                  })
                }
                className="w-full text-left mb-1 rounded border border-border bg-background px-2 py-1 text-[9px] text-text-secondary font-mono hover:bg-surface-highlight"
              >
                {line}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
