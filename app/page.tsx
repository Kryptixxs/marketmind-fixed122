'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { CorrelationMatrix } from '@/components/widgets/CorrelationMatrix';
import { NarrativeTracker } from '@/components/macro/NarrativeTracker';
import { SetupScanner } from '@/components/macro/SetupScanner';
import { MarketPositioning } from '@/components/macro/MarketPositioning';
import { ScenarioTree } from '@/components/macro/ScenarioTree';
import { SessionTracker } from '@/components/widgets/SessionTracker';
import { 
  Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, 
  Terminal as TerminalIcon, Layers, Target, Search, Zap, ShieldAlert, 
  BarChart3, Globe, Cpu, Clock, ArrowUpRight, ArrowDownRight, Gauge
} from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { analyzeMarketState } from '@/lib/market-intelligence';

const SYMBOL_MAP: Record<string, { tv: string, label: string }> = {
  '^NDX': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  '^GSPC': { tv: 'BLACKBULL:SPX500', label: 'S&P 500' },
  '^DJI': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  '^RUT': { tv: 'IG:RUSSELL', label: 'Russell 2000' },
  'CL=F': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GC=F': { tv: 'PEPPERSTONE:XAUUSD', label: 'Gold' },
  'EURUSD=X': { tv: 'PEPPERSTONE:EURUSD', label: 'EUR/USD' },
};

const WATCHLIST_SYMBOLS = Object.keys(SYMBOL_MAP);
const MACRO_SYMBOLS = ['^VIX', 'DX-Y.NYB', '^TNX', '^IRX'];
const ALL_SYMBOLS = [...WATCHLIST_SYMBOLS, ...MACRO_SYMBOLS];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  
  const { data: marketData, error: streamError } = useMarketData(ALL_SYMBOLS);
  const loading = Object.keys(marketData).length === 0 && !streamError;

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

      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-0.5 w-full min-h-0 p-0.5">
        
        {/* --- COLUMN 1: MARKET WATCH & SCANNER --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="flex-1 min-h-0">
            <Widget title="Market Watch // Institutional">
              <div className="flex flex-col">
                {WATCHLIST_SYMBOLS.map(sym => {
                  const data = marketData[sym];
                  const info = SYMBOL_MAP[sym];
                  const isPositive = data?.change >= 0;
                  
                  return (
                    <div 
                      key={sym} 
                      onClick={() => setActiveSymbol(sym)}
                      className={`flex justify-between items-center px-2 py-1.5 border-b border-border/20 cursor-pointer hover:bg-surface-highlight transition-colors ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
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
                          <span>{data ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Widget>
          </div>
          
          <div className="h-[45%] min-h-0">
            <Widget title={`Setup Scanner // ${activeSymbol}`}>
              <SetupScanner activeSymbol={activeSymbol} />
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 2: MACRO & POSITIONING --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-[30%] min-h-0">
            <Widget title={`Macro Narrative // ${activeSymbol}`}>
              <NarrativeTracker activeSymbol={activeSymbol} price={activeQuote?.price || 0} />
            </Widget>
          </div>
          
          <div className="h-[35%] min-h-0">
            <Widget title={`Market Positioning // ${activeSymbol}`}>
              <MarketPositioning symbol={activeSymbol} />
            </Widget>
          </div>

          <div className="flex-1 min-h-0">
            <Widget title="Cross-Asset Correlation">
              {activeQuote ? (
                <CorrelationMatrix activeTick={activeQuote} marketData={marketData} />
              ) : (
                <div className="flex items-center justify-center h-full opacity-30"><Loader2 className="animate-spin" size={16} /></div>
              )}
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 3: MAIN CHART & SCENARIOS --- */}
        <div className="col-span-6 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="flex-1 min-h-0 relative">
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
          </div>

          <div className="h-[35%] grid grid-cols-2 gap-0.5 min-h-0">
            <Widget title="Scenario Tree (Next Event)">
              <ScenarioTree />
            </Widget>
            <div className="flex flex-col gap-0.5">
              <div className="h-1/2">
                <Widget title="Session Monitor">
                  <SessionTracker />
                </Widget>
              </div>
              <div className="flex-1">
                <Widget title="Intelligence Wire">
                  <NewsFeed activeSymbol={activeSymbol} />
                </Widget>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}