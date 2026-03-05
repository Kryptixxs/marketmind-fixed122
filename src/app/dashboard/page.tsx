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
import { useSettings } from '@/services/context/SettingsContext';

const WATCHLIST = [
  'NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 
  'GOLD', 'SILVER', 'CRUDE', 'NATGAS',
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD',
  'BTCUSD', 'ETHUSD', 'SOLUSD',
  'VIX', 'DXY', 'US10Y'
];

const TIMEFRAMES = [
  { label: '1M', yf: '1m' },
  { label: '5M', yf: '5m' },
  { label: '15M', yf: '15m' },
  { label: '1H', yf: '60m' },
  { label: '1D', yf: '1d' },
];

export default function TerminalPage() {
  const { settings } = useSettings();
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);
  
  const { data: marketData } = useMarketData(WATCHLIST, timeframe.yf);

  useEffect(() => {
    const handleSymbolChange = (e: any) => setActiveSymbol(e.detail);
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  const activeQuote = marketData[activeSymbol];

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
      <TerminalCommandBar />

      <div className="flex-1 w-full flex overflow-hidden">
        <PanelGroup orientation="horizontal" className="w-full h-full">
          
          {/* --- MARKET MONITOR (LEFT) --- */}
          <Panel defaultSize={20} minSize={15}>
            <TerminalPanel title="Market Monitor">
              <div className="h-full overflow-y-auto custom-scrollbar">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th className="text-right">Last</th>
                      <th className="text-right">% Chg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WATCHLIST.map(sym => {
                      const tick = marketData[sym];
                      const isPos = tick?.changePercent >= 0;
                      return (
                        <tr 
                          key={sym} 
                          onClick={() => setActiveSymbol(sym)}
                          className={`cursor-pointer hover:bg-surface-highlight transition-colors ${activeSymbol === sym ? 'bg-accent/5' : ''}`}
                        >
                          <td className={`font-bold ${activeSymbol === sym ? 'text-accent' : ''}`}>{sym}</td>
                          <td className="text-right font-mono">{tick?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                          <td className={`text-right font-mono ${isPos ? 'text-positive' : 'text-negative'}`}>
                            {isPos ? '+' : ''}{tick?.changePercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TerminalPanel>
          </Panel>

          <PanelResizeHandle className="w-px bg-border" />

          {/* --- PRICE ANALYTICS (CENTER) --- */}
          <Panel defaultSize={60} minSize={40}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={70}>
                <TerminalPanel 
                  title={`Price Analytics // ${activeSymbol}`}
                  actions={
                    <div className="flex items-center gap-1">
                      {TIMEFRAMES.map(tf => (
                        <button
                          key={tf.label}
                          onClick={() => setTimeframe(tf)}
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors ${timeframe.label === tf.label ? 'bg-accent/20 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <div className="w-full h-full bg-black">
                    <TradingChart data={chartData} symbol={activeSymbol} />
                  </div>
                </TerminalPanel>
              </Panel>
              
              <PanelResizeHandle className="h-px bg-border" />

              {/* --- ANALYTICS MATRIX (BOTTOM) --- */}
              <Panel defaultSize={30}>
                <PanelGroup orientation="horizontal">
                  <Panel defaultSize={33}>
                    <TerminalPanel title="Market Internals">
                      <MarketInternals tick={activeQuote} />
                    </TerminalPanel>
                  </Panel>
                  <PanelResizeHandle className="w-px bg-border" />
                  <Panel defaultSize={34}>
                    <TerminalPanel title="Structure & Flow">
                      <ICTPanel tick={activeQuote} />
                    </TerminalPanel>
                  </Panel>
                  <PanelResizeHandle className="w-px bg-border" />
                  <Panel defaultSize={33}>
                    <TerminalPanel title="Confluence Engine">
                      <ConfluenceScanner symbol={activeSymbol} />
                    </TerminalPanel>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-border" />

          {/* --- INTELLIGENCE (RIGHT) --- */}
          <Panel defaultSize={20} minSize={15}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={40}>
                <TerminalPanel title="Macro & Events">
                  <MiniCalendar />
                </TerminalPanel>
              </Panel>
              <PanelResizeHandle className="h-px bg-border" />
              <Panel defaultSize={60}>
                <TerminalPanel title="Live Intelligence">
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