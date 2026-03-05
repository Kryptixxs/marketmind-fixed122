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
  AlertCircle
} from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { searchSymbols } from '@/app/actions/searchSymbols';

const DEFAULT_WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'AAPL', 'NVDA', 'BTCUSD'];

const TIMEFRAMES = [
  { label: '1M', yf: '1m' },
  { label: '5M', yf: '5m' },
  { label: '15M', yf: '15m' },
  { label: '1H', yf: '60m' },
  { label: '4H', yf: '60m' }, // Note: Yahoo Finance doesn't support native 4H, using 1H as base
  { label: '1D', yf: '1d' },
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
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);

  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    } else {
      localStorage.setItem('vantage_charts_watchlist_v4', JSON.stringify(DEFAULT_WATCHLIST));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vantage_charts_watchlist_v4', JSON.stringify(watchlist));
  }, [watchlist]);

  const { data: marketData, error: streamError } = useMarketData(watchlist, timeframe.yf);
  const activeQuote = marketData[activeSymbol];
  const loading = Object.keys(marketData).length === 0 && !streamError;

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
      <div className="h-auto min-h-[40px] py-2 border-b border-border bg-surface flex flex-wrap items-center px-4 justify-between shrink-0 z-20 gap-2">
        <div className="flex items-center gap-4 md:gap-6 relative flex-wrap">

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
              <div className="absolute top-full left-0 mt-1 w-72 bg-surface-highlight border border-border rounded shadow-2xl z-50 p-1 flex flex-col">
                <form onSubmit={handleAddSymbol} className="flex items-center gap-2 bg-background border border-border px-2 rounded">
                  <Search size={14} className="text-text-tertiary" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search company name or ticker..."
                    className="flex-1 bg-transparent border-none outline-none text-xs py-2 text-text-primary uppercase"
                  />
                  {isSearching && <Loader2 size={12} className="animate-spin text-accent" />}
                </form>
                
                {searchResults.length > 0 && (
                  <div className="flex flex-col mt-1 bg-background rounded overflow-hidden">
                    {searchResults.map(res => (
                      <button
                        key={res.symbol}
                        onClick={() => addResolvedSymbol(res.symbol)}
                        className="flex items-center justify-between p-2 hover:bg-surface-highlight text-left border-b border-border/50 last:border-0"
                      >
                        <div className="flex flex-col overflow-hidden pr-2">
                          <span className="text-xs font-bold text-text-primary">{res.symbol}</span>
                          <span className="text-[10px] text-text-tertiary truncate">{res.name}</span>
                        </div>
                        <span className="text-[9px] text-text-secondary bg-surface px-1.5 py-0.5 rounded font-mono shrink-0">{res.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="hidden sm:block h-4 w-[1px] bg-border" />

          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar max-w-full">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap
                  ${timeframe.label === tf.label ? 'bg-accent/10 text-accent border border-accent/30' : 'text-text-tertiary hover:text-text-primary'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {loading && <Loader2 size={14} className="animate-spin text-text-tertiary" />}
          {streamError && <span title={streamError}><AlertCircle size={14} className="text-negative" /></span>}
          <button className="hidden sm:block p-1.5 text-text-tertiary hover:text-text-primary" title="Layout Settings (Coming Soon)"><Layout size={16} /></button>
          <button className="p-1.5 text-text-tertiary hover:text-text-primary" title="Fullscreen" onClick={() => document.documentElement.requestFullscreen()}><Maximize2 size={16} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0">

        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border bg-surface flex flex-col shrink-0 h-[200px] md:h-full min-h-[200px]">
          <div className="p-3 border-b border-border flex items-center justify-between shrink-0 bg-surface-highlight">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Watchlist</span>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-white/5 rounded text-text-tertiary hover:text-text-primary">
              <Plus size={14} />
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
                  className={`p-2 border-b border-border/50 flex items-center justify-between cursor-pointer transition-colors group
                    ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-text-primary">{sym}</span>
                      <button onClick={(e) => handleRemoveSymbol(e, sym)} className="opacity-0 group-hover:opacity-100 p-0.5 text-text-tertiary hover:text-negative transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                    <span className="text-[8px] text-text-tertiary truncate max-w-[70px] uppercase">{getLabel(sym)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    {!data && !streamError ? (
                      <Loader2 size={10} className="animate-spin text-text-tertiary" />
                    ) : (
                      <>
                        <span className="text-[11px] font-mono font-bold text-text-primary">
                          {data && data.price != null ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                        </span>
                        <span className={`text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
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

        <div className="flex-1 bg-black relative min-h-[400px] md:min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-border">
          {chartData.length > 0 ? (
             <TradingChart data={chartData} symbol={activeSymbol} />
          ) : (
             <div className="flex items-center justify-center h-full text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Rendering Engine...</div>
          )}
        </div>

        <div className="w-full md:w-80 bg-surface flex flex-col shrink-0 h-auto min-h-[400px] md:h-full">
          <TradeSetupPanel tick={activeQuote} timeframeLabel={timeframe.label} />
        </div>

      </div>
    </div>
  );
}