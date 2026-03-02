'use client';

import { useState, useEffect, useCallback } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMarketData } from '@/app/actions/fetchMarketData';

// Mapping Yahoo symbols to TradingView symbols
const SYMBOL_MAP: Record<string, { tv: string, label: string }> = {
  'NQ=F': { tv: 'CME_MINI:NQ1!', label: 'Nasdaq 100 Fut' },
  'ES=F': { tv: 'CME_MINI:ES1!', label: 'S&P 500 Fut' },
  'CL=F': { tv: 'NYMEX:CL1!', label: 'Crude Oil Fut' },
  '^GSPC': { tv: 'SP:SPX', label: 'S&P 500 Index' },
  '^NDX': { tv: 'NASDAQ:NDX', label: 'Nasdaq 100' },
  '^DJI': { tv: 'DJ:DJI', label: 'Dow Jones' },
  '^RUT': { tv: 'RUSSELL:RUT', label: 'Russell 2000' },
  'GC=F': { tv: 'COMEX:GC1!', label: 'Gold Futures' },
  '^TNX': { tv: 'TVC:US10Y', label: 'US 10Y Yield' },
  'EURUSD=X': { tv: 'FX:EURUSD', label: 'EUR/USD' },
};

const WATCHLIST_SYMBOLS = Object.keys(SYMBOL_MAP);

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("NQ=F");
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const refreshWatchlist = useCallback(async () => {
    const results: Record<string, any> = {};
    await Promise.all(WATCHLIST_SYMBOLS.map(async (sym) => {
      const data = await fetchMarketData(sym);
      if (data) results[sym] = data;
    }));
    setMarketData(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshWatchlist();
    const interval = setInterval(refreshWatchlist, 30000);
    return () => clearInterval(interval);
  }, [refreshWatchlist]);

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;

  return (
    <div className="h-full w-full bg-background p-1 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-1 h-full w-full">
        
        {/* --- LEFT COLUMN: MARKET WATCH --- */}
        <div className="col-span-3 row-span-8 overflow-hidden">
          <Widget title="Market Watch // Futures & Indices">
            <div className="flex flex-col">
              {WATCHLIST_SYMBOLS.map(sym => {
                const data = marketData[sym];
                const info = SYMBOL_MAP[sym];
                const isPositive = data?.change >= 0;
                
                return (
                  <div 
                    key={sym} 
                    onClick={() => setActiveSymbol(sym)}
                    className={`flex justify-between items-center px-3 py-2 border-b border-border/50 cursor-pointer hover:bg-surface-highlight transition-colors ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-[11px] text-text-primary">{sym}</span>
                      <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">{info.label}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-mono font-bold text-text-primary">
                        {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                      </span>
                      <div className={`flex items-center gap-1 text-[10px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                        {isPositive ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                        <span>{data ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Widget>
        </div>
        
        <div className="col-span-3 row-span-4 overflow-hidden">
           <Widget title="Global Vitals">
             <div className="p-3 grid grid-cols-2 gap-4 h-full content-start">
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">VIX Index</div>
                 <div className="text-xl font-bold text-warning">14.52</div>
               </div>
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">DXY Dollar</div>
                 <div className="text-xl font-bold text-text-primary">104.20</div>
               </div>
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">10Y Yield</div>
                 <div className="text-xl font-bold text-negative">4.31%</div>
               </div>
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">Liquidity</div>
                 <div className="text-xl font-bold text-positive">High</div>
               </div>
             </div>
           </Widget>
        </div>

        {/* --- CENTER COLUMN: TRADINGVIEW CHART --- */}
        <div className="col-span-6 row-span-12 overflow-hidden relative">
          <Widget 
            title={`${activeSymbol} • ${SYMBOL_MAP[activeSymbol]?.label || ''}`} 
            actions={
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-positive flex items-center gap-1"><Wifi size={10}/> Live</span>
                <span className="px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase">{activeQuote?.marketState || 'REGULAR'}</span>
              </div>
            }
          >
            <div className="w-full h-full bg-black">
              <TradingViewChart symbol={activeTV} />
            </div>
          </Widget>
        </div>

        {/* --- RIGHT COLUMN: NEWS & AI --- */}
        <div className="col-span-3 row-span-6 overflow-hidden">
           <Widget title="Intelligence Wire">
             <NewsFeed />
           </Widget>
        </div>

        <div className="col-span-3 row-span-6 overflow-hidden">
           <Widget title="AI Analysis">
             <div className="p-3 text-xs text-text-secondary leading-relaxed">
               <div className="flex items-center gap-2 mb-3 text-accent">
                 <Activity size={14} />
                 <span className="font-bold">Market Sentiment: {activeQuote?.changePercent >= 0 ? 'Bullish' : 'Bearish'}</span>
               </div>
               <p className="mb-2">
                 <span className="text-text-primary font-bold">Analysis:</span> {activeSymbol} is currently trading at {activeQuote?.price.toLocaleString()} {activeQuote?.currency}.
               </p>
               <p className="mb-2">
                 Daily volatility is {Math.abs(activeQuote?.changePercent || 0).toFixed(2)}%.
               </p>
               <div className="mt-4 p-2 bg-surface border border-border rounded">
                 <div className="flex justify-between mb-1">
                    <span>Trend Strength</span>
                    <span className="text-positive">High</span>
                 </div>
                 <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-accent"></div>
                 </div>
               </div>
             </div>
           </Widget>
        </div>

      </div>
    </div>
  );
}