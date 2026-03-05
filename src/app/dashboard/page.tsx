'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { ConfluenceScanner } from '@/features/Terminal/components/widgets/ConfluenceScanner';
import { ICTPanel } from '@/features/Terminal/components/widgets/ICTPanel';
import { MiniCalendar } from '@/features/Terminal/components/widgets/MiniCalendar';
import { MarketInternals } from '@/features/Terminal/components/widgets/MarketInternals';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

const WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'EURUSD', 'BTCUSD'];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("SPX500");

  const { data: marketData } = useMarketData(WATCHLIST);
  const activeQuote = marketData[activeSymbol];

  useEffect(() => {
    const handleSymbolChange = (e: any) => setActiveSymbol(e.detail);
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  const chartData = useMemo(() => {
    if (!activeQuote || !activeQuote.history) return [];
    return activeQuote.history.map(h => ({
      time: Math.floor(h.timestamp / 1000),
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close
    }));
  }, [activeQuote?.history]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      {/* Bloomberg Command Bar */}
      <TerminalCommandBar />

      {/* Main Terminal Grid */}
      <div className="flex-1 w-full flex overflow-hidden">
        <PanelGroup orientation="horizontal" className="w-full h-full">

          {/* ═══ LEFT: MARKET MONITOR WATCHLIST ═══ */}
          <Panel defaultSize={18} minSize={12}>
            <TerminalPanel title="Market Monitor" fnKey="F1">
              <div className="h-full overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th className="text-right">Last</th>
                      <th className="text-right">Chg%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WATCHLIST.map(sym => {
                      const tick = marketData[sym];
                      const isPos = tick?.changePercent >= 0;
                      const isActive = activeSymbol === sym;
                      return (
                        <tr
                          key={sym}
                          onClick={() => setActiveSymbol(sym)}
                          className={`cursor-pointer transition-colors ${isActive
                              ? 'active-row'
                              : 'hover:bg-surface-highlight/50'
                            }`}
                        >
                          <td className={`font-bold ${isActive ? 'text-accent' : ''}`}>{sym}</td>
                          <td className="text-right tabular-nums">{tick?.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`text-right tabular-nums font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                            {isPos ? '+' : ''}{tick?.changePercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Active Quote Detail */}
                {activeQuote && (
                  <div className="p-2 border-t border-border mt-2">
                    <div className="text-[9px] font-bold text-accent uppercase tracking-wider mb-2">{activeSymbol} — Detail</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Open</span>
                        <span className="tabular-nums">{activeQuote.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Chg</span>
                        <span className={`tabular-nums font-bold ${activeQuote.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {activeQuote.changePercent >= 0 ? '+' : ''}{activeQuote.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TerminalPanel>
          </Panel>

          <PanelResizeHandle className="w-[3px] bg-border hover:bg-accent transition-colors cursor-col-resize" />

          {/* ═══ CENTER: CHART + BOTTOM ANALYTICS ═══ */}
          <Panel defaultSize={62} minSize={40}>
            <PanelGroup orientation="vertical">
              {/* Chart */}
              <Panel defaultSize={68}>
                <TerminalPanel title={`${activeSymbol} — Price Analytics`}>
                  <div className="w-full h-full bg-background">
                    <TradingChart data={chartData} symbol={activeSymbol} />
                  </div>
                </TerminalPanel>
              </Panel>

              <PanelResizeHandle className="h-[3px] bg-border hover:bg-accent transition-colors cursor-row-resize" />

              {/* Bottom 3-panel strip */}
              <Panel defaultSize={32}>
                <PanelGroup orientation="horizontal">
                  <Panel defaultSize={33}>
                    <TerminalPanel title="Market Internals" fnKey="F7">
                      <MarketInternals tick={activeQuote} />
                    </TerminalPanel>
                  </Panel>

                  <PanelResizeHandle className="w-[3px] bg-border hover:bg-accent transition-colors cursor-col-resize" />

                  <Panel defaultSize={34}>
                    <TerminalPanel title="Structure & Flow" fnKey="F8">
                      <ICTPanel tick={activeQuote} />
                    </TerminalPanel>
                  </Panel>

                  <PanelResizeHandle className="w-[3px] bg-border hover:bg-accent transition-colors cursor-col-resize" />

                  <Panel defaultSize={33}>
                    <TerminalPanel title="Confluence Engine" fnKey="F9">
                      <ConfluenceScanner symbol={activeSymbol} />
                    </TerminalPanel>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-[3px] bg-border hover:bg-accent transition-colors cursor-col-resize" />

          {/* ═══ RIGHT: MACRO + NEWS ═══ */}
          <Panel defaultSize={20} minSize={14}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={35}>
                <TerminalPanel title="Macro & Events" fnKey="F10">
                  <MiniCalendar />
                </TerminalPanel>
              </Panel>

              <PanelResizeHandle className="h-[3px] bg-border hover:bg-accent transition-colors cursor-row-resize" />

              <Panel defaultSize={65}>
                <TerminalPanel title="Live Intelligence" fnKey="F11">
                  <NewsFeed activeSymbol={activeSymbol} />
                </TerminalPanel>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}