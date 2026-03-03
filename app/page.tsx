'use client';

import React, { useState, useEffect } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { CorrelationMatrix } from '@/components/widgets/CorrelationMatrix';
import { ConfluenceScanner } from '@/components/widgets/ConfluenceScanner';
import { ICTPanel } from '@/components/widgets/ICTPanel';
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

const TIMEFRAMES = [
  { label: '1M', yf: '1m', tv: '1' },
  { label: '5M', yf: '5m', tv: '5' },
  { label: '15M', yf: '15m', tv: '15' },
  { label: '1H', yf: '60m', tv: '60' },
  { label: '1D', yf: '1d', tv: 'D' },
];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]); 
  
  const { data: marketData } = useMarketData(ALL_SYMBOLS, timeframe.yf);

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
    <div className="h-full w-full bg-background flex flex-col overflow-hidden min-h-0">
      <TerminalCommandBar />

      {/* 
        Responsive layout wrapper: 
        - Mobile: flex-col with vertical scrolling
        - Desktop (lg): CSS Grid, fixed height, no body scrolling 
      */}
      <div className="flex-1 w-full p-0.5 flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-12 gap-1 overflow-y-auto lg:overflow-hidden custom-scrollbar touch-pan-y">
        
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-3 lg:row-span-12 flex flex-col gap-1 min-h-[400px] lg:h-full shrink-0">
          <div className="flex-1 min-h-0">
            <Widget title="Market Watch // Realtime">
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
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
          </div>
          
          <div className="h-[250px] lg:h-[40%] min-h-0">
            <Widget title={`Cross-Asset Correlation (${timeframe.label})`}>
              {activeQuote ? (
                <div className="overflow-y-auto h-full custom-scrollbar">
                  <CorrelationMatrix activeTick={activeQuote} marketData={marketData} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-text-tertiary text-[10px]">Loading Math...</div>
              )}
            </Widget>
          </div>
        </div>

        {/* --- CENTER COLUMN --- */}
        <div className="lg:col-span-6 lg:row-span-12 flex flex-col gap-1 min-h-[600px] lg:h-full shrink-0">
          <div className="flex-1 lg:h-[70%] min-h-[350px] lg:min-h-0">
            <Widget 
              title={`${activeSymbol} • ${SYMBOL_MAP[activeSymbol]?.label || ''}`} 
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-background border border-border rounded-sm p-0.5 overflow-x-auto hide-scrollbar">
                     {TIMEFRAMES.map(tf => (
                       <button
                         key={tf.label}
                         onClick={() => setTimeframe(tf)}
                         className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-colors whitespace-nowrap ${timeframe.label === tf.label ? 'bg-accent/20 text-accent' : 'text-text-tertiary hover:text-text-primary'}`}
                       >
                         {tf.label}
                       </button>
                     ))}
                  </div>
                  <span className="text-positive flex items-center gap-1 text-[8px] whitespace-nowrap"><Wifi size={8}/> Live</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase font-mono text-[8px]">{activeQuote?.marketState || 'REGULAR'}</span>
                </div>
              }
            >
              <div className="w-full h-full bg-black">
                <TradingViewChart symbol={activeTV} interval={timeframe.tv} />
              </div>
            </Widget>
          </div>
          
          <div className="h-auto min-h-[300px] lg:h-[30%] lg:min-h-0 flex flex-col sm:flex-row gap-1">
            <div className="w-full sm:w-1/2 min-h-[250px] sm:min-h-0 h-full">
              <Widget title="ICT Structure Engine">
                <ICTPanel tick={activeQuote} timeframeLabel={timeframe.label} />
              </Widget>
            </div>
            <div className="w-full sm:w-1/2 min-h-[250px] sm:min-h-0 h-full">
              <Widget title="Terminal Confluences">
                <ConfluenceScanner symbol={activeSymbol} timeframeLabel={timeframe.label} />
              </Widget>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-3 lg:row-span-12 flex flex-col gap-1 min-h-[400px] lg:h-full shrink-0">
          <div className="h-[250px] lg:h-[50%] min-h-0">
            <Widget title="Filtered Economic Calendar">
              <MiniCalendar />
            </Widget>
          </div>

          <div className="flex-1 lg:h-[50%] min-h-[250px] lg:min-h-0">
            <Widget title="Live Intelligence Wire">
              <NewsFeed activeSymbol={activeSymbol} />
            </Widget>
          </div>
        </div>

      </div>
    </div>
  );
}