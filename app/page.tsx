'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle } from 'lucide-react';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { analyzeMarket } from '@/app/actions/analyzeMarket';

// Mapping Yahoo symbols to specific TradingView broker symbols
const SYMBOL_MAP: Record<string, { tv: string, label: string }> = {
  '^NDX': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  '^GSPC': { tv: 'BLACKBULL:SPX500', label: 'S&P 500' },
  '^DJI': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  '^RUT': { tv: 'IG:RUSSELL', label: 'Russell 2000' },
  'CL=F': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GC=F': { tv: 'PEPPERSTONE:XAUUSD', label: 'Gold' },
  '^TNX': { tv: 'TVC:US10Y', label: 'US 10Y Yield' },
  'EURUSD=X': { tv: 'PEPPERSTONE:EURUSD', label: 'EUR/USD' },
};

const WATCHLIST_SYMBOLS = Object.keys(SYMBOL_MAP);

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lastAnalyzedRef = useRef<string | null>(null);

  const refreshWatchlist = useCallback(async () => {
    try {
      const results: Record<string, any> = {};
      await Promise.all(WATCHLIST_SYMBOLS.map(async (sym) => {
        const data = await fetchMarketData(sym);
        if (data) results[sym] = data;
      }));
      setMarketData(results);
      setLoading(false);
    } catch (err) {
      console.error("Failed to refresh watchlist:", err);
    }
  }, []);

  useEffect(() => {
    refreshWatchlist();
    const interval = setInterval(refreshWatchlist, 30000);
    return () => clearInterval(interval);
  }, [refreshWatchlist]);

  // Trigger AI analysis when active symbol or its data changes
  useEffect(() => {
    const data = marketData[activeSymbol];
    if (!data) return;

    // Avoid re-analyzing the same price point for the same symbol
    const analysisKey = `${activeSymbol}-${data.price}`;
    if (lastAnalyzedRef.current === analysisKey) return;

    const runAnalysis = async () => {
      setAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeMarket(
          activeSymbol, 
          SYMBOL_MAP[activeSymbol].label, 
          data.price, 
          data.changePercent
        );
        if (result) {
          setAiAnalysis(result);
          lastAnalyzedRef.current = analysisKey;
        } else {
          setError("Analysis failed to generate.");
        }
      } catch (err) {
        setError("AI Service unavailable.");
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    };

    runAnalysis();
  }, [activeSymbol, marketData[activeSymbol]?.price]);

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;

  return (
    <div className="h-full w-full bg-background p-1 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-1 h-full w-full">
        
        {/* --- LEFT COLUMN: MARKET WATCH --- */}
        <div className="col-span-3 row-span-8 overflow-hidden">
          <Widget title="Market Watch // Institutional Feed">
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
           <Widget title="AI Intelligence">
             <div className="p-3 text-xs text-text-secondary leading-relaxed h-full flex flex-col">
               {analyzing ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
                   <Loader2 size={20} className="animate-spin text-accent" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Synthesizing Data...</span>
                 </div>
               ) : error ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-2 text-negative opacity-80">
                   <AlertCircle size={20} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                 </div>
               ) : aiAnalysis ? (
                 <>
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2 text-accent">
                       <Brain size={14} />
                       <span className="font-bold uppercase tracking-tight">Sentiment: {aiAnalysis.sentiment}</span>
                     </div>
                     {aiAnalysis.sentiment === 'Bullish' ? <TrendingUp size={14} className="text-positive" /> : <TrendingDown size={14} className="text-negative" />}
                   </div>
                   
                   <div className="space-y-3 flex-1">
                     <p className="text-text-primary leading-snug">
                       {aiAnalysis.analysis}
                     </p>
                     
                     <div className="pt-4 border-t border-border/50">
                       <div className="flex justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase text-text-tertiary">Trend Strength</span>
                          <span className={aiAnalysis.strength > 70 ? 'text-positive' : aiAnalysis.strength > 40 ? 'text-warning' : 'text-negative'}>
                            {aiAnalysis.strength}%
                          </span>
                       </div>
                       <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent transition-all duration-1000 ease-out" 
                            style={{ width: `${aiAnalysis.strength}%` }}
                          ></div>
                       </div>
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-tertiary">
                   <Loader2 size={16} className="animate-spin" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Waiting for Market Data...</span>
                 </div>
               )}
             </div>
           </Widget>
        </div>

      </div>
    </div>
  );
}