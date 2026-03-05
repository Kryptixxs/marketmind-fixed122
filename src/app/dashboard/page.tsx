'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { QuantCommandBar } from '@/features/Terminal/components/QuantCommandBar';
import { QuantContextBar } from '@/features/Terminal/components/QuantContextBar';
import { QuantSidePanel } from '@/features/Terminal/components/QuantSidePanel';
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
import { PanelLeftClose, PanelRightClose } from 'lucide-center';

const WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'EURUSD', 'BTCUSD'];

export default function TerminalPage() {
  const { settings } = useSettings();
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
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

  // --- MODERN QUANT LAYOUT ---
  if (settings.theme === 'quant') {
    return (
      <div className="h-full w-full bg-background flex flex-col overflow-hidden text-text-primary">
        <QuantCommandBar activeSymbol={activeSymbol} onSymbolChange={setActiveSymbol} />
        
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 bg-black relative">
            <TradingChart data={chartData} symbol={activeSymbol} />
            
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="absolute top-6 right-6 p-2 bg-background border border-border text-text-tertiary hover:text-text-primary transition-all z-10"
            >
              {isPanelOpen ? <PanelRightClose size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
            </button>
          </div>

          <QuantSidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
            <div className="space-y-12">
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Market Internals</h3>
                <MarketInternals tick={activeQuote} />
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Structure & Flow</h3>
                <ICTPanel tick={activeQuote} />
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Confluence</h3>
                <ConfluenceScanner symbol={activeSymbol} />
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Macro Events</h3>
                <MiniCalendar />
              </section>
            </div>
          </QuantSidePanel>
        </div>

        <QuantContextBar 
          bias={activeQuote?.changePercent >= 0 ? 'Bullish' : 'Bearish'} 
          vol={Math.abs(activeQuote?.changePercent || 0) > 1.5 ? 'High' : 'Low'}
        />
      </div>
    );
  }

  // --- BLOOMBERG INSTITUTIONAL LAYOUT ---
  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <TerminalCommandBar />

      <div className="flex-1 w-full flex overflow-hidden">
        <PanelGroup orientation="horizontal" className="w-full h-full">
          
          {/* MARKET MONITOR (LEFT) */}
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
                          className={`cursor-pointer ${activeSymbol === sym ? 'bg-surface-highlight' : 'hover:bg-surface-highlight/50'}`}
                        >
                          <td className="font-bold">{sym}</td>
                          <td className="text-right font-mono">{tick?.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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

          <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />

          {/* PRICE ANALYTICS (CENTER) */}
          <Panel defaultSize={60} minSize={40}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={70}>
                <TerminalPanel title={`Price Analytics // ${activeSymbol}`}>
                  <div className="w-full h-full bg-black">
                    <TradingChart data={chartData} symbol={activeSymbol} />
                  </div>
                </TerminalPanel>
              </Panel>
              
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />

              {/* ANALYTICS MATRIX (BOTTOM) */}
              <Panel defaultSize={30}>
                <PanelGroup orientation="horizontal">
                  <Panel defaultSize={33}>
                    <TerminalPanel title="Market Internals">
                      <MarketInternals tick={activeQuote} />
                    </TerminalPanel>
                  </Panel>
                  <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />
                  <Panel defaultSize={34}>
                    <TerminalPanel title="Structure & Flow">
                      <ICTPanel tick={activeQuote} />
                    </TerminalPanel>
                  </Panel>
                  <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />
                  <Panel defaultSize={33}>
                    <TerminalPanel title="Confluence Engine">
                      <ConfluenceScanner symbol={activeSymbol} />
                    </TerminalPanel>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />

          {/* INTELLIGENCE (RIGHT) */}
          <Panel defaultSize={20} minSize={15}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={40}>
                <TerminalPanel title="Macro & Events">
                  <MiniCalendar />
                </TerminalPanel>
              </Panel>
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />
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