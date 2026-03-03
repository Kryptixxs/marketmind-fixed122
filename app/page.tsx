'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { CorrelationMatrix } from '@/components/widgets/CorrelationMatrix';
import { ConfluenceScanner } from '@/components/widgets/ConfluenceScanner';
import { ICTPanel } from '@/components/widgets/ICTPanel';
import { MiniCalendar } from '@/components/widgets/MiniCalendar';
import { Wifi, TrendingUp, TrendingDown, Plus, Search, X } from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';

const DEFAULT_WATCHLIST = ['^NDX', '^GSPC', 'CL=F', 'GC=F', 'EURUSD=X', 'BTC-USD'];
const MACRO_SYMBOLS = ['^VIX', 'DX-Y.NYB', '^TNX', '^IRX'];

const SYMBOL_MAP: Record<string, { tv: string, label: string }> = {
  '^NDX': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  '^GSPC': { tv: 'BLACKBULL:SPX500', label: 'S&P 500' },
  '^DJI': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  '^RUT': { tv: 'IG:RUSSELL', label: 'Russell 2000' },
  'CL=F': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GC=F': { tv: 'PEPPERSTONE:XAUUSD', label: 'Gold' },
  'EURUSD=X': { tv: 'FX:EURUSD', label: 'EUR/USD' },
  'BTC-USD': { tv: 'BINANCE:BTCUSDT', label: 'Bitcoin' },
};

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
  
  // Watchlist state management
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vantage_main_watchlist');
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vantage_main_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const allSymbols = [...new Set([...watchlist, ...MACRO_SYMBOLS])];
  const { data: marketData } = useMarketData(allSymbols, timeframe.yf);

  useEffect(() => {
    const handleSymbolChange = (e: any) => {
      const newSym = e.detail;
      if (!watchlist.includes(newSym)) {
        setWatchlist(prev => [newSym, ...prev]);
      }
      setActiveSymbol(newSym);
    };
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, [watchlist]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const sym = searchQuery.toUpperCase().trim();
    if (!watchlist.includes(sym)) {
      setWatchlist(prev => [sym, ...prev]);
    }
    setActiveSymbol(sym);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleRemoveSymbol = (e: React.MouseEvent, sym: string) => {
    e.stopPropagation();
    const newList = watchlist.filter(s => s !== sym);
    setWatchlist(newList);
    if (activeSymbol === sym && newList.length > 0) setActiveSymbol(newList[0]);
  };

  const activeQuote = marketData[activeSymbol];
  
  // Resolve TV Symbol or fallback to standard
  const getTVSymbol = (sym: string) => {
    if (SYMBOL_MAP[sym]) return SYMBOL_MAP[sym].tv;
    if (sym.includes('=')) return `FX:${sym.replace('=X', '')}`;
    if (sym.includes('-')) return `CRYPTO:${sym.replace('-', '')}`;
    return sym;
  };

  const getLabel = (sym: string) => SYMBOL_MAP[sym]?.label || 'Equities/Crypto';

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden min-h-0">
      <TerminalCommandBar />

      <div className="flex-1 w-full p-0.5 flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-12 gap-1 overflow-y-auto lg:overflow-hidden custom-scrollbar touch-pan-y">
        
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-3 lg:row-span-12 flex flex-col gap-1 min-h-[400px] lg:h-full shrink-0">
          <div className="flex-1 min-h-0">
            <Widget 
              title="Market Watch // Realtime"
              actions={
                <div className="relative">
                  <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-white/10 rounded transition-colors text-text-tertiary hover:text-text-primary" title="Add Ticker">
                    <Plus size={12} />
                  </button>
                  {isSearchOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-48 bg-surface-highlight border border-border rounded shadow-xl z-50 p-1">
                        <form onSubmit={handleAddSymbol} className="flex items-center gap-2 bg-background border border-border px-2 rounded">
                          <Search size={10} className="text-text-tertiary" />
                          <input 
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Add ticker..."
                            className="flex-1 bg-transparent border-none outline-none text-[10px] py-1.5 text-text-primary"
                          />
                        </form>
                      </div>
                    </>
                  )}
                </div>
              }
            >
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                {watchlist.map(sym => {
                  const data = marketData[sym];
                  const isPositive = data?.change >= 0;
                  
                  return (
                    <div 
                      key={sym} 
                      onClick={() => setActiveSymbol(sym)}
                      className={`flex justify-between items-center px-3 py-2 border-b border-border/20 cursor-pointer group transition-colors ${activeSymbol === sym ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'}`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[10px] text-text-primary">{sym}</span>
                          <button onClick={(e) => handleRemoveSymbol(e, sym)} className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative"><X size={10}/></button>
                        </div>
                        <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{getLabel(sym)}</span>
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
              title={`${activeSymbol} • ${getLabel(activeSymbol)}`} 
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
                <TradingViewChart symbol={getTVSymbol(activeSymbol)} interval={timeframe.tv} />
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