'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { TradeSetupPanel } from '@/features/Terminal/components/widgets/TradeSetupPanel';
import {
  Plus,
  Layout,
  Settings,
  Maximize2,
  ChevronDown,
  X,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  Activity,
  Wifi
} from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { searchSymbols } from '@/app/actions/searchSymbols';

const DEFAULT_WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'AAPL', 'NVDA', 'BTCUSD'];

const TIMEFRAMES = [
  { label: '1M', yf: '1m' },
  { label: '5M', yf: '5m' },
  { label: '15M', yf: '15m' },
  { label: '30M', yf: '30m' },
  { label: '1H', yf: '60m' },
  { label: '4H', yf: '240m' }, 
  { label: '1D', yf: '1d' },
  { label: '1W', yf: '1wk' },
];

const LABEL_MAP: Record<string, string> = {
  'NAS100': 'Nasdaq 100',
  'SPX500': 'S&P 500',
  'US30': 'Dow Jones',
  'CRUDE': 'Crude Oil',
  'GOLD': 'Gold',
  'EURUSD': 'EUR/USD',
  'BTCUSD': 'Bitcoin',
  'AAPL': 'Apple Inc.',
  'TSLA': 'Tesla Inc.',
  'NVDA': 'Nvidia Corp.',
};

export default function ChartsPage() {
  const [activeSymbol, setActiveSymbol] = useState('NAS100');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]); // Default 15M

  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Heartbeat state for live updates
  const [lastTickTime, setLastTickTime] = useState<number>(0);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchSymbols(q);
      setSearchResults(res);
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const saved = localStorage.getItem('vantage_charts_watchlist_v4');
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vantage_charts_watchlist_v4', JSON.stringify(watchlist));
  }, [watchlist]);

  const { data: marketData, error: streamError } = useMarketData(watchlist, timeframe.yf);
  const activeQuote = marketData[activeSymbol];
  const loading = Object.keys(marketData).length === 0 && !streamError;

  // Update heartbeat when active quote changes
  useEffect(() => {
    if (activeQuote) {
      setLastTickTime(Date.now());
    }
  }, [activeQuote?.price]);

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

  const addResolvedSymbol = (sym: string) => {
    if (!watchlist.includes(sym)) {
      setWatchlist(prev => [sym, ...prev]);
    }
    setActiveSymbol(sym);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    let symToAdd = searchQuery.toUpperCase().trim();
    
    if (searchResults.length > 0) {
      symToAdd = searchResults[0].symbol;
    } else {
      const res = await searchSymbols(symToAdd);
      if (res.length > 0) symToAdd = res[0].symbol;
    }
    
    addResolvedSymbol(symToAdd);
    setIsSearching(false);
  };

  const handleRemoveSymbol = (e: React.MouseEvent, sym: string) => {
    e.stopPropagation();
    const newList = watchlist.filter(s => s !== sym);
    setWatchlist(newList);
    if (activeSymbol === sym && newList.length > 0) setActiveSymbol(newList[0]);
  };

  const getLabel = (sym: string) => LABEL_MAP[sym] || 'Equities/Crypto';

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
    <div className="h-full flex flex-col bg-background overflow-hidden min-h-0">
      {/* --- ENHANCED TOOLBAR --- */}
      <div className="h-12 border-b border-border bg-surface flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Symbol Selector */}
          <div className="relative shrink-0">
            <div
              className="flex items-center gap-3 bg-background border border-border hover:border-accent/50 px-3 py-1.5 rounded-sm transition-all group"
              onClick={() => setIsSearchOpen(true)}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-text-primary tracking-tighter">{activeSymbol}</span>
                  <div className={`w-1.5 h-1.5 rounded-full bg-positive transition-opacity duration-300 ${Date.now() - lastTickTime < 1000 ? 'opacity-100 animate-pulse' : 'opacity-30'}`} />
                </div>
                <span className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest">{getLabel(activeSymbol)}</span>
              </div>
              <ChevronDown size={14} className="text-text-tertiary group-hover:text-accent" />
            </div>

            {isSearchOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-80 bg-surface-highlight border border-border rounded shadow-2xl z-50 p-1 flex flex-col">
                  <form onSubmit={handleAddSymbol} className="flex items-center gap-2 bg-background border border-border px-3 py-1 rounded-sm">
                    <Search size={14} className="text-text-tertiary" />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search ticker or company..."
                      className="flex-1 bg-transparent border-none outline-none text-xs py-2 text-text-primary uppercase font-mono"
                    />
                    {isSearching && <Loader2 size={12} className="animate-spin text-accent" />}
                  </form>
                  
                  {searchResults.length > 0 && (
                    <div className="flex flex-col mt-1 bg-background rounded-sm overflow-hidden border border-border">
                      {searchResults.map(res => (
                        <button
                          key={res.symbol}
                          onClick={() => addResolvedSymbol(res.symbol)}
                          className="flex items-center justify-between p-2.5 hover:bg-surface-highlight text-left border-b border-border/50 last:border-0 transition-colors"
                        >
                          <div className="flex flex-col overflow-hidden pr-2">
                            <span className="text-xs font-bold text-text-primary">{res.symbol}</span>
                            <span className="text-[10px] text-text-tertiary truncate">{res.name}</span>
                          </div>
                          <span className="text-[9px] text-text-secondary bg-surface px-1.5 py-0.5 rounded font-mono shrink-0 border border-border">{res.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-[1px] bg-border shrink-0 mx-2" />

          {/* TIMEFRAME SELECTOR - High Visibility */}
          <div className="flex items-center p-1 bg-background border border-border rounded-sm gap-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-sm transition-all uppercase tracking-tighter
                  ${timeframe.label === tf.label 
                    ? 'bg-accent text-accent-text shadow-[0_0_15px_rgba(255,153,0,0.3)]' 
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-surface-highlight border border-border rounded-sm">
            <Wifi size={12} className="text-positive" />
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Live Feed</span>
          </div>
          {loading && <Loader2 size={14} className="animate-spin text-accent" />}
          <button className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" title="Layout Settings"><Layout size={18} /></button>
          <button className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" title="Fullscreen" onClick={() => document.documentElement.requestFullscreen()}><Maximize2 size={18} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Watchlist Sidebar */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border bg-surface flex flex-col shrink-0 h-[200px] md:h-full">
          <div className="p-3 border-b border-border flex items-center justify-between shrink-0 bg-surface-highlight">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-text-tertiary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">Market Watch</span>
            </div>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-white/5 rounded text-text-tertiary hover:text-accent transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {watchlist.map(sym => {
              const data = marketData[sym];
              const isPositive = data?.changePercent != null ? data.changePercent >= 0 : true;

              return (
                <div
                  key={sym}
                  onClick={() => setActiveSymbol(sym)}
                  className={`p-3 border-b border-border/50 flex items-center justify-between cursor-pointer transition-all group
                    ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-primary tracking-tight">{sym}</span>
                      <button onClick={(e) => handleRemoveSymbol(e, sym)} className="opacity-0 group-hover:opacity-100 p-0.5 text-text-tertiary hover:text-negative transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                    <span className="text-[9px] text-text-tertiary truncate max-w-[80px] uppercase font-medium">{getLabel(sym)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    {!data && !streamError ? (
                      <Loader2 size={12} className="animate-spin text-text-tertiary" />
                    ) : (
                      <>
                        <span className="text-xs font-mono font-bold text-text-primary">
                          {data && data.price != null ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${isPositive ? 'text-positive' : 'text-negative'}`}>
                          {data && data.changePercent != null ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 bg-black relative min-h-[400px] md:min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-border">
          {chartData.length > 0 ? (
             <TradingChart data={chartData} symbol={activeSymbol} />
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 size={32} className="animate-spin text-accent" />
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-text-primary">Synchronizing Chart Engine...</span>
             </div>
          )}
          
          <div className="absolute top-4 left-4 p-4 bg-surface/80 backdrop-blur border border-border rounded-sm pointer-events-none flex flex-col gap-1 shadow-2xl">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-text-primary tracking-tighter">{activeSymbol}</span>
              {activeQuote && (
                <div className="flex flex-col items-end">
                  <span className="text-lg font-mono font-bold text-text-primary leading-none">${activeQuote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className={`text-xs font-mono font-bold ${activeQuote.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {activeQuote.changePercent >= 0 ? '+' : ''}{activeQuote.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase font-bold mt-2 pt-2 border-t border-border/50">
              <Clock size={12} />
              <span>{timeframe.label} Interval</span>
              <span className="text-border mx-1">|</span>
              <span className="text-accent">Real-time Feed</span>
            </div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="w-full md:w-80 bg-surface flex flex-col shrink-0 h-auto min-h-[400px] md:h-full">
          <TradeSetupPanel tick={activeQuote} timeframeLabel={timeframe.label} />
        </div>

      </div>
    </div>
  );
}