'use client';

import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { CorrelationMatrix } from '@/components/widgets/CorrelationMatrix';
import { ConfluenceScanner } from '@/components/widgets/ConfluenceScanner';
import { MarketInternals } from '@/components/widgets/MarketInternals';
import { MiniCalendar } from '@/components/widgets/MiniCalendar';
import { Wifi, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';

const SYMBOL_MAP: Record<string, { tv: string, label: string }> = {
  '^NDX': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  '^GSPC': { tv: 'BLACKBULL:SPX500', label: 'S&P 500' },
  '^DJI': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  '^RUT': { tv: 'IG:RUSSELL', label: 'Russell 2000' },
  'CL=F': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GC=F': { tv: 'PEPPERSTONE:XAUUSD', label: 'Gold' },
  'EURUSD=X': { tv: 'PEPPERSTONE:EURUSD', label: 'EUR/USD' },
  'BTC-USD': { tv: 'BINANCE:BTCUSDT', label: 'Bitcoin' },
};

const WATCHLIST_SYMBOLS = Object.keys(SYMBOL_MAP);
const MACRO_SYMBOLS = ['^VIX', 'DX-Y.NYB', '^TNX', '^IRX'];
const ALL_SYMBOLS = [...WATCHLIST_SYMBOLS, ...MACRO_SYMBOLS];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  
  // Real Data Pipeline
  const { data: marketData } = useMarketData(ALL_SYMBOLS);

  useEffect(() => {
    const handleSymbolChange = (e: any) => {
      const newSym = e.detail;
      if (SYMBOL_MAP[newSym] || newSym.length < 10) {
        setActiveSymbol(newSym);
      }
    };
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;

  return (
    <div className="h-full w-full bg-background overflow-hidden flex flex-col">
      <TerminalCommandBar />

      <div className="flex-1 w-full min-h-0 p-0.5">
        <PanelGroup direction="horizontal" className="h-full w-full">
          
          {/* --- LEFT PANEL: WATCHLIST & CORRELATION --- */}
          <Panel defaultSize={20} minSize={15} className="flex flex-col gap-0.5">
            <PanelGroup direction="vertical">
              <Panel defaultSize={60} minSize={30} className="pb-0.5">
                <Widget title="Market Watch // Realtime">
                  <div className="flex flex-col">
                    {WATCHLIST_SYMBOLS.map(sym => {
                      const data = marketData[sym];
                      const info = SYMBOL_MAP[sym];
                      const isPositive = data?.change >= 0;
                      
                      return (
                        <div 
                          key={sym} 
                          onClick={() => setActiveSymbol(sym)}
                          className={`flex justify-between items-center px-3 py-2 border-b border-border/20 cursor-pointer transition-colors ${activeSymbol === sym ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-[10px] text-text-primary">{sym}</span>
                            <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{info.label}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-mono font-bold text-text-primary">
                              {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                            </span>
                            <div className={`flex items-center gap-1 text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                              {isPositive ? <TrendingUp size={8}/> : <TrendingDown size={8}/>}
                              <span>{data ? `${Math.abs(data.changePercent).toFixed(2)}%` : '--'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Widget>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-background hover:bg-accent/30 transition-colors cursor-row-resize" />
              
              <Panel defaultSize={40} minSize={20} className="pt-0.5">
                <Widget title="Cross-Asset Correlation">
                  {activeQuote && <CorrelationMatrix activeTick={activeQuote} marketData={marketData} />}
                </Widget>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1 bg-background hover:bg-accent/30 transition-colors cursor-col-resize" />

          {/* --- CENTER PANEL: CHART & CONFLUENCE MATH --- */}
          <Panel defaultSize={55} minSize={30} className="flex flex-col gap-0.5">
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={40} className="pb-0.5">
                <Widget 
                  title={`${activeSymbol} • ${SYMBOL_MAP[activeSymbol]?.label || ''}`} 
                  actions={
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-positive flex items-center gap-1"><Wifi size={8}/> Live</span>
                      <span className="px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase font-mono">{activeQuote?.marketState || 'REGULAR'}</span>
                    </div>
                  }
                >
                  <div className="w-full h-full bg-black">
                    <TradingViewChart symbol={activeTV} />
                  </div>
                </Widget>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-background hover:bg-accent/30 transition-colors cursor-row-resize" />
              
              <Panel defaultSize={30} minSize={20} className="pt-0.5">
                <Widget title={`Terminal Engine // ${activeSymbol}`}>
                  <ConfluenceScanner symbol={activeSymbol} />
                </Widget>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1 bg-background hover:bg-accent/30 transition-colors cursor-col-resize" />

          {/* --- RIGHT PANEL: INTERNALS, CALENDAR, NEWS --- */}
          <Panel defaultSize={25} minSize={15} className="flex flex-col gap-0.5">
            <PanelGroup direction="vertical">
              <Panel defaultSize={20} minSize={15} className="pb-0.5">
                <Widget title="Market Internals">
                  <MarketInternals tick={activeQuote} />
                </Widget>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-background hover:bg-accent/30 transition-colors cursor-row-resize" />
              
              <Panel defaultSize={30} minSize={20} className="py-0.5">
                <Widget title="Economic Calendar">
                  <MiniCalendar />
                </Widget>
              </Panel>

              <PanelResizeHandle className="h-1 bg-background hover:bg-accent/30 transition-colors cursor-row-resize" />
              
              <Panel defaultSize={50} minSize={30} className="pt-0.5">
                <Widget title="Intelligence Wire">
                  <NewsFeed activeSymbol={activeSymbol} />
                </Widget>
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}