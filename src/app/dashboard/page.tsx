'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { fetchSymbolCandles } from '@/app/actions/fetchMarketData';
import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { Loader2 } from 'lucide-react';

const MARKET_CATEGORIES: Record<string, string[]> = {
  'Equities': ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD'],
  'Indices': ['NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 'FTSE100', 'NIKKEI'],
  'Crypto': ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'],
  'Forex': ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
  'Commodities': ['GOLD', 'SILVER', 'CRUDE', 'NATGAS', 'COPPER'],
  'Macro': ['DXY', 'VIX', 'US10Y', 'US2Y'],
};

const ALL_SYMBOLS = Object.values(MARKET_CATEGORIES).flat();

const LABELS: Record<string, string> = {
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', US30: 'Dow Jones', RUSSELL: 'Russell 2K',
  DAX40: 'DAX', FTSE100: 'FTSE', NIKKEI: 'Nikkei', GOLD: 'Gold', SILVER: 'Silver',
  CRUDE: 'Crude Oil', NATGAS: 'Nat Gas', COPPER: 'Copper', BTCUSD: 'Bitcoin',
  ETHUSD: 'Ethereum', SOLUSD: 'Solana', BNBUSD: 'BNB', XRPUSD: 'XRP',
  EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', USDJPY: 'USD/JPY', AUDUSD: 'AUD/USD',
  USDCAD: 'USD/CAD', AAPL: 'Apple', NVDA: 'NVIDIA', MSFT: 'Microsoft',
  TSLA: 'Tesla', GOOGL: 'Alphabet', AMZN: 'Amazon', META: 'Meta', AMD: 'AMD',
  DXY: 'Dollar Idx', VIX: 'VIX', US10Y: '10Y Yield', US2Y: '2Y Yield',
};

function PanelHeader({ color, title, right }: { color: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="h-7 min-h-[28px] flex items-center justify-between px-2 border-b border-border bg-surface shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
        <span className={`text-[9px] font-bold uppercase tracking-widest ${color.replace('bg-', 'text-')} truncate`}>{title}</span>
      </div>
      {right}
    </div>
  );
}

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [activeCategory, setActiveCategory] = useState('Equities');
  const [candleHistory, setCandleHistory] = useState<OHLCV[]>([]);
  const { data: marketData } = useMarketData(ALL_SYMBOLS);
  const { data: selectedOnlyData } = useMarketData([selectedSymbol]);

  const selectedTick = selectedOnlyData[selectedSymbol] || marketData[selectedSymbol];
  const categorySymbols = MARKET_CATEGORIES[activeCategory] || [];
  const loadCandles = useCallback(async (sym: string) => {
    try {
      const candles = await fetchSymbolCandles(sym);
      setCandleHistory(candles);
    } catch {
      setCandleHistory([]);
    }
  }, []);

  useEffect(() => {
    setCandleHistory([]);
    loadCandles(selectedSymbol);
  }, [selectedSymbol, loadCandles]);
  const chartData = useMemo(() => {
    const hist = candleHistory.length > 0 ? candleHistory : (selectedTick?.history ?? []);
    if (hist.length > 0) {
      const mapped = hist.map((h) => ({
        time: Math.floor(h.timestamp / 1000),
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
      }));
      // Blend latest live tick onto last bar for near-real-time chart sync.
      if (selectedTick?.price && mapped.length > 0) {
        const last = mapped[mapped.length - 1];
        const p = selectedTick.price;
        last.high = Math.max(last.high, p);
        last.low = Math.min(last.low, p);
        last.close = p;
      }
      return mapped;
    }

    if (!selectedTick?.price || selectedTick.price <= 0) return [];

    // Seed a short baseline so chart appears immediately.
    const nowSec = Math.floor(Date.now() / 1000);
    return Array.from({ length: 40 }, (_, i) => {
      const t = nowSec - (39 - i) * 15;
      return {
        time: t,
        open: selectedTick.price,
        high: selectedTick.price,
        low: selectedTick.price,
        close: selectedTick.price,
      };
    });
  }, [selectedTick]);

  const topMovers = useMemo(() => {
    return ALL_SYMBOLS
      .filter(s => marketData[s]?.changePercent != null && marketData[s]!.price > 0)
      .sort((a, b) => Math.abs(marketData[b]!.changePercent) - Math.abs(marketData[a]!.changePercent))
      .slice(0, 12);
  }, [marketData]);

  const handleSymbolSelect = (sym: string) => {
    setSelectedSymbol(sym);
    window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
  };

  const loadedCount = ALL_SYMBOLS.filter(s => marketData[s]?.price).length;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <TerminalCommandBar />

      {/* Main grid: left watchlist | center chart+bottom | right pulse */}
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(170px,210px)_1fr_minmax(180px,220px)] gap-px bg-border overflow-hidden">

        {/* ═══ LEFT: Market Monitor ═══ */}
        <div className="bg-surface flex flex-col min-h-0 overflow-hidden">
          <PanelHeader color="bg-cyan" title="Market Monitor" />
          <div className="flex flex-wrap border-b border-border bg-surface shrink-0">
            {Object.keys(MARKET_CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
                  activeCategory === cat
                    ? 'text-cyan border-b border-cyan bg-cyan/5'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {categorySymbols.map(sym => {
              const tick = marketData[sym];
              const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
              const isSelected = sym === selectedSymbol;
              const hasData = tick?.price != null && tick.price > 0;
              return (
                <div
                  key={sym}
                  onClick={() => handleSymbolSelect(sym)}
                  className={`flex items-center justify-between px-2 py-1 border-b border-border/30 cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent/8 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className={`text-[10px] font-bold truncate ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{sym}</div>
                    <div className="text-[8px] text-text-tertiary truncate">{LABELS[sym] || sym}</div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-1">
                    {hasData ? (
                      <>
                        <span className="text-[10px] font-mono font-bold text-text-primary">
                          {tick!.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[9px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{tick!.changePercent.toFixed(2)}%
                        </span>
                      </>
                    ) : (
                      <Loader2 size={10} className="animate-spin text-text-tertiary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border bg-surface px-2 py-1 shrink-0">
            <div className="text-[8px] text-text-tertiary font-mono text-center">{loadedCount}/{ALL_SYMBOLS.length} loaded</div>
          </div>
        </div>

        {/* ═══ CENTER: Chart + Bottom Row ═══ */}
        <div className="bg-background flex flex-col min-h-0 overflow-hidden">
          {/* Chart (top 60%) */}
          <div className="flex-[3] min-h-0 border-b border-border relative">
            <div className="absolute inset-0 flex flex-col">
              <PanelHeader
                color="bg-accent"
                title={`${selectedSymbol} — ${LABELS[selectedSymbol] || selectedSymbol}`}
                right={selectedTick && selectedTick.price > 0 ? (
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-text-primary">
                      {selectedTick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${selectedTick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {selectedTick.changePercent >= 0 ? '+' : ''}{selectedTick.changePercent.toFixed(2)}%
                    </span>
                  </span>
                ) : undefined}
              />
              <div className="flex-1 min-h-0 bg-background">
                {chartData.length > 0 ? (
                  <TradingChart key={selectedSymbol} data={chartData} symbol={selectedSymbol} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-accent" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom row (40%): Movers + News */}
          <div className="flex-[2] min-h-0 grid grid-cols-[minmax(180px,1fr)_minmax(280px,2fr)] gap-px bg-border overflow-hidden">
            {/* Top Movers */}
            <div className="bg-surface flex flex-col min-h-0 overflow-hidden">
              <PanelHeader color="bg-warning" title="Top Movers" />
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {topMovers.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={14} className="animate-spin text-text-tertiary" />
                  </div>
                ) : topMovers.map(sym => {
                  const tick = marketData[sym]!;
                  const isPos = tick.changePercent >= 0;
                  return (
                    <div
                      key={sym}
                      onClick={() => handleSymbolSelect(sym)}
                      className="flex items-center justify-between px-2 py-1 border-b border-border/30 cursor-pointer hover:bg-surface-highlight transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-1 h-3 rounded-full shrink-0 ${isPos ? 'bg-positive' : 'bg-negative'}`} />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-text-primary truncate">{sym}</div>
                          <div className="text-[8px] text-text-tertiary truncate">{LABELS[sym]}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 ml-1">
                        <span className="text-[10px] font-mono text-text-primary">
                          {tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[8px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{tick.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intelligence Wire */}
            <div className="bg-surface flex flex-col min-h-0 overflow-hidden">
              <PanelHeader color="bg-cyan" title="Intelligence Wire" />
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <NewsFeed activeSymbol={selectedSymbol} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Market Pulse ═══ */}
        <div className="bg-surface flex flex-col min-h-0 overflow-hidden">
          <PanelHeader color="bg-positive" title="Market Pulse" />
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">

            {/* Heatmap */}
            <div className="text-[8px] font-bold uppercase text-text-tertiary tracking-wider">Heatmap</div>
            <div className="grid grid-cols-4 gap-0.5">
              {['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD'].map(sym => {
                const tick = marketData[sym];
                const pct = tick?.changePercent ?? 0;
                const isPos = pct >= 0;
                const intensity = Math.min(Math.abs(pct) / 3, 1);
                return (
                  <div
                    key={sym}
                    onClick={() => handleSymbolSelect(sym)}
                    className="p-1 rounded cursor-pointer text-center hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: isPos
                        ? `rgba(16, 185, 129, ${0.08 + intensity * 0.2})`
                        : `rgba(239, 68, 68, ${0.08 + intensity * 0.2})`,
                    }}
                  >
                    <div className="text-[7px] font-bold text-text-primary">{sym}</div>
                    <div className={`text-[7px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                      {tick?.price ? `${isPos ? '+' : ''}${pct.toFixed(1)}%` : '--'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-border my-0.5" />

            {/* Regime */}
            <div className="text-[8px] font-bold uppercase text-text-tertiary tracking-wider">Regime</div>
            {[
              { label: 'Fear & Greed', sym: 'VIX', interpret: (v: number) => v > 25 ? 'FEAR' : v < 15 ? 'GREED' : 'NEUTRAL' },
              { label: 'Dollar', sym: 'DXY', interpret: (v: number) => v > 104 ? 'STRONG' : v < 100 ? 'WEAK' : 'NEUTRAL' },
              { label: '10Y Yield', sym: 'US10Y', interpret: (v: number) => v > 4.5 ? 'HAWK' : v < 3.5 ? 'DOVE' : 'NEUTRAL' },
            ].map(({ label, sym, interpret }) => {
              const tick = marketData[sym];
              const val = tick?.price ?? 0;
              const hasData = tick?.price != null && tick.price > 0;
              const regime = hasData ? interpret(val) : '...';
              return (
                <div key={sym} className="flex items-center justify-between bg-background border border-border rounded px-2 py-1">
                  <div>
                    <div className="text-[8px] text-text-tertiary font-bold uppercase">{label}</div>
                    <div className="text-[9px] font-mono font-bold text-text-primary">
                      {hasData ? tick!.price.toFixed(2) : '--'}
                    </div>
                  </div>
                  <span className={`badge text-[7px] ${
                    regime === 'FEAR' || regime === 'HAWK' || regime === 'STRONG' ? 'badge-negative' :
                    regime === 'GREED' || regime === 'DOVE' || regime === 'WEAK' ? 'badge-positive' :
                    'badge-accent'
                  }`}>
                    {regime}
                  </span>
                </div>
              );
            })}

            <div className="h-px bg-border my-0.5" />

            {/* Crypto */}
            <div className="text-[8px] font-bold uppercase text-text-tertiary tracking-wider">Crypto</div>
            {['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'].map(sym => {
              const tick = marketData[sym];
              const hasData = tick?.price != null && tick.price > 0;
              const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
              return (
                <div
                  key={sym}
                  onClick={() => handleSymbolSelect(sym)}
                  className="flex items-center justify-between bg-background border border-border rounded px-2 py-1 cursor-pointer hover:border-border-highlight transition-colors"
                >
                  <span className="text-[9px] font-bold text-text-primary">{sym.replace('USD', '')}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-text-secondary">
                      {hasData ? `$${tick!.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '...'}
                    </span>
                    {hasData && (
                      <span className={`text-[8px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                        {isPos ? '+' : ''}{tick!.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="h-px bg-border my-0.5" />

            {/* Indices snapshot */}
            <div className="text-[8px] font-bold uppercase text-text-tertiary tracking-wider">Indices</div>
            {['SPX500', 'NAS100', 'US30'].map(sym => {
              const tick = marketData[sym];
              const hasData = tick?.price != null && tick.price > 0;
              const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
              return (
                <div
                  key={sym}
                  onClick={() => handleSymbolSelect(sym)}
                  className="flex items-center justify-between bg-background border border-border rounded px-2 py-1 cursor-pointer hover:border-border-highlight transition-colors"
                >
                  <span className="text-[9px] font-bold text-text-primary">{LABELS[sym]}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-text-secondary">
                      {hasData ? tick!.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                    </span>
                    {hasData && (
                      <span className={`text-[8px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                        {isPos ? '+' : ''}{tick!.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
