'use client';

import { useState, useEffect, useCallback } from 'react';
import { Widget } from '@/components/Widget';
import { TradingChart } from '@/components/TradingChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi, Loader2 } from 'lucide-react';
import { fetchMarketData } from '@/app/actions/fetchMarketData';

const WATCHLIST_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AAPL', 'TSLA', 'NVDA', 'EURUSD=X', 'GC=F'];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("BTC-USD");
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Fetch data for the entire watchlist
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
    const interval = setInterval(refreshWatchlist, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [refreshWatchlist]);

  const activeQuote = marketData[activeSymbol];

  return (
    <div className="h-full w-full bg-background p-1 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-1 h-full w-full">
        
        {/* --- LEFT COLUMN --- */}
        <div className="col-span-3 row-span-8 overflow-hidden">
          <Widget title="Market Watch">
            <div className="flex flex-col">
              {WATCHLIST_SYMBOLS.map(sym => {
                const data = marketData[sym];
                return (
                  <div 
                    key={sym} 
                    onClick={() => setActiveSymbol(sym)}
                    className={`flex justify-between items-center px-3 py-2 border-b border-border/50 cursor-pointer hover:bg-surface-highlight ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{sym}</span>
                      <span className="text-[9px] text-text-tertiary truncate max-w-[80px]">{data?.name || 'Loading...'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                      </span>
                      <span className={`text-[10px] font-mono ${data?.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {data ? `${data.change >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--'}
                      </span>
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

        {/* --- CENTER COLUMN --- */}
        <div className="col-span-6 row-span-12 overflow-hidden relative">
          <Widget 
            title={`${activeSymbol} • ${activeQuote?.name || ''}`} 
            actions={
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-positive flex items-center gap-1"><Wifi size={10}/> Live</span>
                <span className="px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase">{activeQuote?.marketState || 'REGULAR'}</span>
              </div>
            }
          >
            <div className="w-full h-full bg-black">
              <div className="flex items-center justify-center h-full text-text-tertiary text-[10px] uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin" /> : 'Chart Engine Active'}
              </div>
            </div>
          </Widget>
        </div>

        {/* --- RIGHT COLUMN --- */}
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