'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { TradeSetupPanel } from '@/features/Terminal/components/widgets/TradeSetupPanel';
import {
  Plus, Search, Loader2, X, Clock, Activity, Wifi,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Maximize2, ChevronDown,
} from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { searchSymbols } from '@/app/actions/searchSymbols';
import { useTunnel } from '@/features/Terminal/context/TunnelContext';

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
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', US30: 'Dow Jones', CRUDE: 'Crude Oil',
  GOLD: 'Gold', EURUSD: 'EUR/USD', BTCUSD: 'Bitcoin', AAPL: 'Apple',
  TSLA: 'Tesla', NVDA: 'NVIDIA', MSFT: 'Microsoft', GOOGL: 'Alphabet',
  AMZN: 'Amazon', META: 'Meta', AMD: 'AMD',
};

export default function ChartsPage() {
  const { push } = useTunnel();
  const [activeSymbol, setActiveSymbol] = useState('NAS100');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WATCHLIST;
    try {
      const saved = localStorage.getItem('vantage_charts_watchlist_v4');
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchSymbols(q);
      setSearchResults(res);
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('vantage_charts_watchlist_v4', JSON.stringify(watchlist));
  }, [watchlist]);

  const { data: marketData, error: streamError } = useMarketData(watchlist, timeframe.yf);
  const activeQuote = marketData[activeSymbol];
  const sessionStats = useMemo(() => {
    const bars = activeQuote?.history ?? [];
    if (!bars.length) return { high: null as number | null, low: null as number | null, volume: null as number | null };
    return {
      high: Math.max(...bars.map((b) => b.high)),
      low: Math.min(...bars.map((b) => b.low)),
      volume: bars.reduce((sum, b) => sum + (b.volume ?? 0), 0),
    };
  }, [activeQuote]);
  const loading = Object.keys(marketData).length === 0 && !streamError;

  useEffect(() => {
    const handleSymbolChange = (e: any) => {
      const newSym = e.detail;
      if (!watchlist.includes(newSym)) setWatchlist(prev => [newSym, ...prev]);
      setActiveSymbol(newSym);
    };
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, [watchlist]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  const addResolvedSymbol = (sym: string) => {
    if (!watchlist.includes(sym)) setWatchlist(prev => [sym, ...prev]);
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
    if (searchResults.length > 0) symToAdd = searchResults[0].symbol;
    else {
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

  const chartData = useMemo(() => {
    if (!activeQuote?.history) return [];
    return activeQuote.history.map(h => ({
      time: Math.floor(h.timestamp / 1000),
      open: h.open, high: h.high, low: h.low, close: h.close,
    }));
  }, [activeQuote]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-10 border-b border-border bg-surface flex items-center px-3 justify-between shrink-0 z-20 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Symbol Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 bg-background border border-border hover:border-accent/40 px-3 py-1 rounded transition-all group"
            >
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-text-primary tracking-tight">{activeSymbol}</span>
                  {activeQuote && (
                    <span className={`text-[10px] font-mono font-bold ${activeQuote.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {activeQuote.changePercent >= 0 ? '+' : ''}{activeQuote.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-[8px] text-text-tertiary uppercase font-bold tracking-wider">
                  {LABEL_MAP[activeSymbol] || activeSymbol}
                </span>
              </div>
              <ChevronDown size={12} className="text-text-tertiary group-hover:text-accent" />
            </button>

            {isSearchOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-80 bg-surface border border-border rounded shadow-2xl z-50 overflow-hidden">
                  <form onSubmit={handleAddSymbol} className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search size={13} className="text-text-tertiary shrink-0" />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search ticker or company..."
                      className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary uppercase font-mono"
                    />
                    {isSearching && <Loader2 size={12} className="animate-spin text-accent" />}
                  </form>
                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {searchResults.map(res => (
                        <button
                          key={res.symbol}
                          onClick={() => addResolvedSymbol(res.symbol)}
                          className="flex items-center justify-between w-full p-2.5 hover:bg-surface-highlight text-left border-b border-border/30 last:border-0 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold text-text-primary">{res.symbol}</span>
                            <span className="text-[9px] text-text-tertiary truncate">{res.name}</span>
                          </div>
                          <span className="badge badge-accent shrink-0">{res.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-border shrink-0" />

          {/* Timeframes */}
          <div className="flex items-center bg-background border border-border rounded overflow-hidden">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-tight transition-all ${
                  timeframe.label === tf.label
                    ? 'bg-accent text-white'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-highlight'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-[9px] text-text-tertiary">
            <Wifi size={10} className="text-positive" />
            <span className="font-bold uppercase tracking-wider">Live</span>
          </div>
          {loading && <Loader2 size={14} className="animate-spin text-accent" />}
          <button className="p-1 text-text-tertiary hover:text-text-primary transition-colors" title="Fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}>
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Watchlist */}
        <div className="w-56 border-r border-border bg-surface flex flex-col shrink-0 hidden md:flex">
          <div className="h-8 border-b border-border flex items-center justify-between px-3 bg-surface shrink-0">
            <div className="flex items-center gap-1.5">
              <Activity size={11} className="text-cyan" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Watchlist</span>
            </div>
            <button onClick={() => setIsSearchOpen(true)} className="p-0.5 hover:bg-surface-highlight rounded text-text-tertiary hover:text-accent transition-colors">
              <Plus size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {watchlist.map(sym => {
              const tick = marketData[sym];
              const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
              const isActive = sym === activeSymbol;
              return (
                <div
                  key={sym}
                  onClick={() => {
                    setActiveSymbol(sym);
                    push({ type: 'SYMBOL', symbol: sym, label: sym });
                  }}
                  className={`px-3 py-2 border-b border-border/30 flex items-center justify-between cursor-pointer transition-all group ${
                    isActive ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold ${isActive ? 'text-accent' : 'text-text-primary'}`}>{sym}</span>
                      <button onClick={(e) => handleRemoveSymbol(e, sym)} className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative transition-opacity p-0.5">
                        <X size={9} />
                      </button>
                    </div>
                    <span className="text-[8px] text-text-tertiary truncate">{LABEL_MAP[sym] || sym}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    {!tick && !streamError ? (
                      <Loader2 size={10} className="animate-spin text-text-tertiary" />
                    ) : (
                      <>
                        <span className="text-[10px] font-mono font-bold text-text-primary">
                          {tick?.price != null ? tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                        </span>
                        <span className={`text-[9px] font-mono font-bold flex items-center gap-0.5 ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                          {tick?.changePercent != null ? `${isPos ? '+' : ''}${tick.changePercent.toFixed(2)}%` : '--'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart + Data Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Compact horizontal chart - fixed height */}
          <div className="h-[220px] shrink-0 border-b border-border bg-surface">
            {chartData.length > 0 ? (
              <TradingChart key={`${activeSymbol}-${timeframe.yf}`} data={chartData} symbol={activeSymbol} height={220} compact />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin text-accent" />
                <span className="text-[9px] uppercase font-bold tracking-widest text-text-tertiary">Loading Chart...</span>
              </div>
            )}
          </div>

          {/* Data panel - fills remaining space */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
            {activeQuote && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-surface border border-border rounded px-3 py-2">
                  <div className="text-[8px] uppercase font-bold tracking-widest text-text-tertiary mb-0.5">Open</div>
                  <div className="text-xs font-mono font-bold text-text-primary">
                    {activeQuote.history?.[0]?.open != null ? activeQuote.history[0].open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded px-3 py-2">
                  <div className="text-[8px] uppercase font-bold tracking-widest text-text-tertiary mb-0.5">High</div>
                  <div className="text-xs font-mono font-bold text-positive">
                    {sessionStats.high != null ? sessionStats.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded px-3 py-2">
                  <div className="text-[8px] uppercase font-bold tracking-widest text-text-tertiary mb-0.5">Low</div>
                  <div className="text-xs font-mono font-bold text-negative">
                    {sessionStats.low != null ? sessionStats.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded px-3 py-2">
                  <div className="text-[8px] uppercase font-bold tracking-widest text-text-tertiary mb-0.5">Last</div>
                  <div className="text-xs font-mono font-bold text-text-primary">
                    {activeQuote.price != null ? activeQuote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded px-3 py-2">
                  <div className="text-[8px] uppercase font-bold tracking-widest text-text-tertiary mb-0.5">Chg %</div>
                  <div className={`text-xs font-mono font-bold flex items-center gap-0.5 ${(activeQuote.changePercent ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {(activeQuote.changePercent ?? 0) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {(activeQuote.changePercent ?? 0) >= 0 ? '+' : ''}{(activeQuote.changePercent ?? 0).toFixed(2)}%
                  </div>
                </div>
                <div className="bg-surface border border-border rounded px-3 py-2">
                  <div className="text-[8px] uppercase font-bold tracking-widest text-text-tertiary mb-0.5">Volume</div>
                  <div className="text-xs font-mono font-bold text-text-primary">
                    {sessionStats.volume != null ? `${(sessionStats.volume / 1e6).toFixed(2)}M` : '—'}
                  </div>
                </div>
              </div>
            )}
            {activeQuote?.history && activeQuote.history.length > 1 && (
              <div className="mt-4">
                <div className="text-[9px] uppercase font-bold tracking-widest text-text-tertiary mb-2">Session range</div>
                <div className="bg-surface border border-border rounded p-3 text-[10px] font-mono text-text-secondary">
                  {(() => {
                    const bars = activeQuote.history;
                    const sessionHigh = Math.max(...bars.map((b: any) => b.high));
                    const sessionLow = Math.min(...bars.map((b: any) => b.low));
                    const range = sessionHigh - sessionLow;
                    const rangePct = sessionLow > 0 ? ((range / sessionLow) * 100).toFixed(2) : '—';
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <span>High: <span className="text-positive font-bold">{sessionHigh.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                        <span>Low: <span className="text-negative font-bold">{sessionLow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                        <span>Range: <span className="text-text-primary font-bold">{rangePct}%</span></span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Trade Setup */}
        <div className="w-72 border-l border-border bg-surface flex-col shrink-0 hidden lg:flex">
          <TradeSetupPanel tick={activeQuote} timeframeLabel={timeframe.label} />
        </div>
      </div>
    </div>
  );
}
