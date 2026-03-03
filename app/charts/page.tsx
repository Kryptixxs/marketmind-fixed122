'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TradingViewChart from '@/components/TradingViewChart';
import { 
  Plus, 
  Layout, 
  Settings, 
  Maximize2, 
  ChevronDown,
  Clock,
  X,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchMarketData } from '@/app/actions/fetchMarketData';

const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'BTC-USD', 'GC=F'];

const TIMEFRAMES = [
  { label: '1M', value: '1' },
  { label: '5M', value: '5' },
  { label: '15M', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

function ChartsContent() {
  const searchParams = useSearchParams();
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[3]);
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search / Add Symbol state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle symbol from query param
  useEffect(() => {
    const sym = searchParams.get('symbol');
    if (sym) {
      setActiveSymbol(sym.toUpperCase());
    }
  }, [searchParams]);

  // Load watchlist from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vantage_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        setWatchlist(DEFAULT_WATCHLIST);
      }
    }
  }, []);

  // Save watchlist changes
  useEffect(() => {
    localStorage.setItem('vantage_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch market data for watchlist
  const loadData = useCallback(async () => {
    setError(null);
    try {
      const results: Record<string, any> = {};
      await Promise.all(watchlist.map(async (sym) => {
        const data = await fetchMarketData(sym);
        if (data) results[sym] = data;
      }));
      setQuotes(results);
    } catch (err) {
      setError('Failed to sync market data');
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
    if (activeSymbol === sym && newList.length > 0) {
      setActiveSymbol(newList[0]);
    }
  };

  // Convert standard symbols to TradingView equivalents for the chart
  const getTVSymbol = (sym: string) => {
    if (sym === 'GC=F') return 'COMEX:GC1!';
    if (sym === 'CL=F') return 'NYMEX:CL1!';
    if (sym.includes('=')) return `FX:${sym.replace('=X', '')}`;
    if (sym.includes('-')) return `CRYPTO:${sym.replace('-', '')}`;
    return sym;
  };

  const activeQuote = quotes[activeSymbol];

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="h-10 border-b border-border bg-surface flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 md:gap-6 relative">
          
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors"
            onClick={() => setIsSearchOpen(true)}
          >
            <span className="text-sm font-bold text-text-primary">{activeSymbol}</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </div>

          {isSearchOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-64 bg-surface-highlight border border-border rounded shadow-xl z-50 p-2">
                <form onSubmit={handleAddSymbol} className="flex items-center gap-2 bg-background border border-border px-2 rounded">
                  <Search size={14} className="text-text-tertiary" />
                  <input 
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Enter ticker (e.g. AAPL, BTC-USD)"
                    className="flex-1 bg-transparent border-none outline-none text-xs py-1.5 text-text-primary"
                  />
                </form>
              </div>
            </>
          )}
          
          <div className="h-4 w-[1px] bg-border" />
          
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {TIMEFRAMES.map(tf => (
              <button 
                key={tf.value}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap
                  ${timeframe.value === tf.value ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:text-text-primary'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading && <Loader2 size={14} className="animate-spin text-text-tertiary" />}
          {error && <AlertCircle size={14} className="text-negative" title={error} />}
          <button className="p-1.5 text-text-tertiary hover:text-text-primary" title="Layout Settings (Coming Soon)"><Layout size={16} /></button>
          <button className="p-1.5 text-text-tertiary hover:text-text-primary" title="Chart Settings (Coming Soon)"><Settings size={16} /></button>
          <button className="p-1.5 text-text-tertiary hover:text-text-primary" title="Fullscreen" onClick={() => document.documentElement.requestFullscreen()}><Maximize2 size={16} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Watchlist Sidebar */}
        <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Watchlist</span>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-1 hover:bg-white/5 rounded text-text-tertiary hover:text-text-primary"
              title="Add Symbol"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {watchlist.map(sym => {
              const data = quotes[sym];
              const isPositive = data?.change >= 0;

              return (
                <div 
                  key={sym}
                  onClick={() => setActiveSymbol(sym)}
                  className={`p-3 border-b border-border/50 flex items-center justify-between cursor-pointer transition-colors group
                    ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-text-primary">{sym}</span>
                      <button 
                        onClick={(e) => handleRemoveSymbol(e, sym)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-text-tertiary hover:text-negative transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <span className="text-[9px] text-text-tertiary truncate max-w-[80px]">{data?.name || '---'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    {loading && !data ? (
                      <Loader2 size={10} className="animate-spin text-text-tertiary" />
                    ) : (
                      <>
                        <span className="text-xs font-mono font-bold text-text-primary">
                          {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                        </span>
                        <span className={`text-[10px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                          {data ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--'}
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
        <div className="flex-1 bg-black relative">
          <TradingViewChart symbol={getTVSymbol(activeSymbol)} interval={timeframe.value} />
          
          {/* Floating Info Overlay */}
          <div className="absolute top-4 left-4 p-3 bg-surface/80 backdrop-blur border border-border rounded-sm pointer-events-none flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-text-primary">{activeSymbol}</span>
              {activeQuote && (
                <span className={`text-xs font-mono ${activeQuote.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {activeQuote.change >= 0 ? '+' : ''}{activeQuote.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase font-bold">
              <Clock size={10} />
              <span>{timeframe.label} Interval</span>
              {loading && <span className="text-accent animate-pulse">Syncing...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChartsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>}>
      <ChartsContent />
    </Suspense>
  );
}