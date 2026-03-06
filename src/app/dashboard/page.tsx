'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { Widget } from '@/components/ui/Widget';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import {
  TrendingUp, TrendingDown, Activity, Globe, BarChart3,
  Loader2, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const MARKET_CATEGORIES = {
  'Indices': ['NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 'FTSE100', 'NIKKEI'],
  'Commodities': ['GOLD', 'SILVER', 'CRUDE', 'NATGAS', 'COPPER'],
  'Crypto': ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'],
  'Forex': ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
  'Equities': ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'],
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
  TSLA: 'Tesla', GOOGL: 'Alphabet', AMZN: 'Amazon', META: 'Meta',
  DXY: 'Dollar Index', VIX: 'VIX', US10Y: '10Y Yield', US2Y: '2Y Yield',
};

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('NAS100');
  const [activeCategory, setActiveCategory] = useState('Indices');
  const { data: marketData } = useMarketData(ALL_SYMBOLS);

  const selectedTick = marketData[selectedSymbol];

  const chartData = useMemo(() => {
    if (!selectedTick?.history) return [];
    return selectedTick.history.map(h => ({
      time: Math.floor(h.timestamp / 1000),
      open: h.open, high: h.high, low: h.low, close: h.close,
    }));
  }, [selectedTick?.history]);

  const categorySymbols = MARKET_CATEGORIES[activeCategory as keyof typeof MARKET_CATEGORIES] || [];

  const topMovers = useMemo(() => {
    return ALL_SYMBOLS
      .filter(s => marketData[s]?.changePercent != null)
      .sort((a, b) => Math.abs(marketData[b]!.changePercent) - Math.abs(marketData[a]!.changePercent))
      .slice(0, 8);
  }, [marketData]);

  const handleSymbolSelect = (sym: string) => {
    setSelectedSymbol(sym);
    window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <TerminalCommandBar />

      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: Market Monitor */}
        <Panel defaultSize={24} minSize={18} maxSize={35}>
          <Widget title="Market Monitor" accent="cyan">
            <div className="flex flex-col h-full">
              {/* Category Tabs */}
              <div className="flex border-b border-border bg-surface shrink-0 overflow-x-auto custom-scrollbar">
                {Object.keys(MARKET_CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0 ${
                      activeCategory === cat
                        ? 'text-cyan border-b border-cyan bg-cyan/5'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Symbol Table */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th className="text-right">Last</th>
                      <th className="text-right">Chg%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySymbols.map(sym => {
                      const tick = marketData[sym];
                      const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
                      const isSelected = sym === selectedSymbol;
                      return (
                        <tr
                          key={sym}
                          onClick={() => handleSymbolSelect(sym)}
                          className={`cursor-pointer ${isSelected ? 'active' : ''}`}
                        >
                          <td>
                            <div className="flex flex-col">
                              <span className={`font-bold ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{sym}</span>
                              <span className="text-[8px] text-text-tertiary">{LABELS[sym] || sym}</span>
                            </div>
                          </td>
                          <td className="text-right font-mono text-text-primary">
                            {tick?.price != null
                              ? tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : <Loader2 size={10} className="animate-spin text-text-tertiary inline" />
                            }
                          </td>
                          <td className="text-right">
                            {tick?.changePercent != null ? (
                              <span className={`inline-flex items-center gap-0.5 font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                                {isPos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {isPos ? '+' : ''}{tick.changePercent.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-text-muted">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Quick Stats Footer */}
              <div className="border-t border-border bg-surface p-2 shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  {['SPX500', 'VIX', 'DXY'].map(sym => {
                    const t = marketData[sym];
                    const p = t?.changePercent != null ? t.changePercent >= 0 : true;
                    return (
                      <div key={sym} className="text-center">
                        <div className="text-[8px] text-text-tertiary font-bold uppercase">{sym}</div>
                        <div className={`text-[10px] font-mono font-bold ${p ? 'text-positive' : 'text-negative'}`}>
                          {t?.price != null ? t.price.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '--'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Widget>
        </Panel>

        <PanelResizeHandle />

        {/* Right: Chart + Bottom Panels */}
        <Panel defaultSize={76}>
          <PanelGroup direction="vertical">
            {/* Main Chart */}
            <Panel defaultSize={60} minSize={35}>
              <Widget title={`${selectedSymbol} — ${LABELS[selectedSymbol] || selectedSymbol}`} accent="blue">
                <div className="h-full w-full relative">
                  {chartData.length > 0 ? (
                    <TradingChart key={selectedSymbol} data={chartData} symbol={selectedSymbol} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Loader2 size={24} className="animate-spin text-accent" />
                      <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
                        Loading {selectedSymbol}...
                      </span>
                    </div>
                  )}

                  {/* Overlay Stats */}
                  {selectedTick && (
                    <div className="absolute top-3 left-3 flex items-center gap-4 pointer-events-none">
                      <div className="bg-surface/90 backdrop-blur border border-border rounded px-3 py-1.5 flex items-center gap-3">
                        <span className="text-sm font-black text-text-primary">{selectedSymbol}</span>
                        <span className="text-sm font-mono font-bold text-text-primary">
                          {selectedTick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${selectedTick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {selectedTick.changePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {selectedTick.changePercent >= 0 ? '+' : ''}{selectedTick.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Widget>
            </Panel>

            <PanelResizeHandle />

            {/* Bottom Row */}
            <Panel defaultSize={40} minSize={20}>
              <PanelGroup direction="horizontal">
                {/* Movers */}
                <Panel defaultSize={30} minSize={20}>
                  <Widget title="Top Movers" accent="warning">
                    <div className="overflow-y-auto custom-scrollbar h-full">
                      <table className="data-table w-full">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th className="text-right">Price</th>
                            <th className="text-right">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topMovers.map(sym => {
                            const tick = marketData[sym]!;
                            const isPos = tick.changePercent >= 0;
                            return (
                              <tr key={sym} onClick={() => handleSymbolSelect(sym)} className="cursor-pointer">
                                <td>
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1 h-4 rounded-full ${isPos ? 'bg-positive' : 'bg-negative'}`} />
                                    <div className="flex flex-col">
                                      <span className="font-bold text-text-primary">{sym}</span>
                                      <span className="text-[8px] text-text-tertiary">{LABELS[sym]}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-right font-mono text-text-primary">
                                  {tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="text-right">
                                  <span className={`badge ${isPos ? 'badge-positive' : 'badge-negative'}`}>
                                    {isPos ? '+' : ''}{tick.changePercent.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Widget>
                </Panel>

                <PanelResizeHandle />

                {/* News Wire */}
                <Panel defaultSize={40} minSize={25}>
                  <Widget title="Intelligence Wire" accent="cyan">
                    <NewsFeed activeSymbol={selectedSymbol} />
                  </Widget>
                </Panel>

                <PanelResizeHandle />

                {/* Market Pulse */}
                <Panel defaultSize={30} minSize={20}>
                  <Widget title="Market Pulse" accent="positive">
                    <div className="p-3 flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar">
                      {/* Heatmap Grid */}
                      <div className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider mb-1">Sector Heatmap</div>
                      <div className="grid grid-cols-4 gap-1">
                        {['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD'].map(sym => {
                          const tick = marketData[sym];
                          const pct = tick?.changePercent ?? 0;
                          const isPos = pct >= 0;
                          const intensity = Math.min(Math.abs(pct) / 3, 1);
                          return (
                            <div
                              key={sym}
                              onClick={() => handleSymbolSelect(sym)}
                              className="p-1.5 rounded cursor-pointer text-center border border-transparent hover:border-border-highlight transition-all"
                              style={{
                                backgroundColor: isPos
                                  ? `rgba(16, 185, 129, ${0.05 + intensity * 0.2})`
                                  : `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`,
                              }}
                            >
                              <div className="text-[9px] font-bold text-text-primary">{sym}</div>
                              <div className={`text-[9px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                                {isPos ? '+' : ''}{pct.toFixed(1)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="h-px bg-border my-1" />

                      {/* Key Levels */}
                      <div className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider">Key Metrics</div>
                      {[
                        { label: 'Fear & Greed', sym: 'VIX', interpret: (v: number) => v > 25 ? 'FEAR' : v < 15 ? 'GREED' : 'NEUTRAL' },
                        { label: 'Dollar Strength', sym: 'DXY', interpret: (v: number) => v > 104 ? 'STRONG' : v < 100 ? 'WEAK' : 'NEUTRAL' },
                        { label: '10Y Yield', sym: 'US10Y', interpret: (v: number) => v > 4.5 ? 'HAWKISH' : v < 3.5 ? 'DOVISH' : 'NEUTRAL' },
                      ].map(({ label, sym, interpret }) => {
                        const tick = marketData[sym];
                        const val = tick?.price ?? 0;
                        const regime = interpret(val);
                        return (
                          <div key={sym} className="flex items-center justify-between bg-surface border border-border rounded px-2 py-1.5">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-text-tertiary font-bold uppercase">{label}</span>
                              <span className="text-[10px] font-mono font-bold text-text-primary">
                                {tick?.price != null ? tick.price.toFixed(2) : '--'}
                              </span>
                            </div>
                            <span className={`badge ${
                              regime === 'FEAR' || regime === 'HAWKISH' || regime === 'STRONG' ? 'badge-negative' :
                              regime === 'GREED' || regime === 'DOVISH' || regime === 'WEAK' ? 'badge-positive' :
                              'badge-accent'
                            }`}>
                              {regime}
                            </span>
                          </div>
                        );
                      })}

                      <div className="h-px bg-border my-1" />

                      {/* Crypto Quick View */}
                      <div className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider">Crypto</div>
                      {['BTCUSD', 'ETHUSD', 'SOLUSD'].map(sym => {
                        const tick = marketData[sym];
                        const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
                        return (
                          <div
                            key={sym}
                            onClick={() => handleSymbolSelect(sym)}
                            className="flex items-center justify-between bg-surface border border-border rounded px-2 py-1.5 cursor-pointer hover:border-border-highlight transition-colors"
                          >
                            <span className="text-[10px] font-bold text-text-primary">{sym.replace('USD', '')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-text-secondary">
                                {tick?.price != null ? `$${tick.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
                              </span>
                              <span className={`text-[9px] font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                                {tick?.changePercent != null ? `${isPos ? '+' : ''}${tick.changePercent.toFixed(1)}%` : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Widget>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
