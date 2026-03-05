'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Widget } from '@/components/ui/Widget';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { ConfluenceScanner } from '@/features/Terminal/components/widgets/ConfluenceScanner';
import { ICTPanel } from '@/features/Terminal/components/widgets/ICTPanel';
import { MiniCalendar } from '@/features/Terminal/components/widgets/MiniCalendar';
import { Wifi, TrendingUp, TrendingDown, Plus, Search, X, Loader2 } from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { searchSymbols } from '@/app/actions/searchSymbols';

// Clean UI Symbols
const DEFAULT_WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'EURUSD', 'BTCUSD'];
const MACRO_SYMBOLS = ['VIX', 'DXY'];

// Map the clean symbols to the preferred labels
const LABEL_MAP: Record<string, string> = {
  'NAS100': 'Nasdaq 100',
  'SPX500': 'S&P 500',
  'US30': 'Dow Jones',
  'CRUDE': 'Crude Oil',
  'GOLD': 'Gold',
  'EURUSD': 'EUR/USD',
  'BTCUSD': 'Bitcoin',
  'ETHUSD': 'Ethereum',
  'VIX': 'Volatility Index',
  'DXY': 'US Dollar Index',
  'AAPL': 'Apple Inc.',
  'TSLA': 'Tesla Inc.',
  'NVDA': 'Nvidia Corp.',
};

const TIMEFRAMES = [
  { label: '1M', yf: '1m', tv: '1' },
  { label: '5M', yf: '5m', tv: '5' },
  { label: '15M', yf: '15m', tv: '15' },
  { label: '1H', yf: '60m', tv: '60' },
  { label: '1D', yf: '1d', tv: 'D' },
];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
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
    const saved = localStorage.getItem('vantage_main_watchlist_v4');
    if (saved) {
      try { setWatchlist(JSON.parse(saved)); } catch (e) { }
    } else {
      localStorage.setItem('vantage_main_watchlist_v4', JSON.stringify(DEFAULT_WATCHLIST));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vantage_main_watchlist_v4', JSON.stringify(watchlist));
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

  const activeQuote = marketData[activeSymbol];
  const getLabel = (sym: string) => LABEL_MAP[sym] || 'Equities/Crypto';

  const chartData = useMemo(() => {
    if (!activeQuote || !activeQuote.history) return [];
    return activeQuote.history.map(h => ({
      time: Math.floor(h.timestamp / 1000), // Convert ms to seconds for lightweight-charts
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close
    }));
  }, [activeQuote?.history]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden min-h-0">
      <TerminalCommandBar />

      <div className="flex-1 w-full flex overflow-hidden">
        <PanelGroup orientation="horizontal" className="w-full h-full">

          {/* --- LEFT COLUMN --- */}
          <Panel defaultSize={20} minSize={15} id="left-panel">
            <div className="h-full w-full p-px bg-background">
              <Widget
                title="Market Watch // Institutional"
                actions={
                  <div className="relative">
                    <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-white/10 rounded transition-colors text-text-tertiary hover:text-text-primary" title="Add Ticker">
                      <Plus size={12} />
                    </button>
                    {isSearchOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                        <div className="absolute top-full left-0 mt-1 w-64 bg-surface-highlight border border-border rounded shadow-2xl z-50 p-1 flex flex-col">
                          <form onSubmit={handleAddSymbol} className="flex items-center gap-2 bg-background border border-border px-2 rounded">
                            <Search size={12} className="text-text-tertiary" />
                            <input
                              ref={searchInputRef}
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="Type company name or ticker..."
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
                  </div>
                }
              >
                <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                  {watchlist.map(sym => {
                    const data = marketData[sym];
                    const isPositive = data?.changePercent != null ? data.changePercent >= 0 : true;

                    return (
                      <div
                        key={sym}
                        onClick={() => setActiveSymbol(sym)}
                        className={`flex justify-between items-center px-3 py-2 border-b border-border/20 cursor-pointer group transition-colors ${activeSymbol === sym ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'}`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-[10px] text-text-primary">{sym}</span>
                            <button onClick={(e) => handleRemoveSymbol(e, sym)} className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative"><X size={10} /></button>
                          </div>
                          <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{getLabel(sym)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono font-bold text-text-primary">
                            {data && data.price != null ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                          </span>
                          <div className={`flex items-center gap-1 text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                            {isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            <span>{data && data.changePercent != null ? `${Math.abs(data.changePercent).toFixed(2)}%` : '--'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Widget>
            </div>
          </Panel>

          <PanelResizeHandle className="w-0.5 h-full bg-border/50 hover:bg-accent transition-colors" />

          {/* --- CENTER COLUMN --- */}
          <Panel defaultSize={60} minSize={40} id="center-panel">
            <PanelGroup orientation="vertical">
              <Panel defaultSize={70} minSize={40} id="chart">
                <div className="h-full w-full p-px bg-background">
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
                        <span className="text-positive flex items-center gap-1 text-[8px] whitespace-nowrap"><Wifi size={8} /> Live Feed</span>
                      </div>
                    }
                  >
                    <div className="w-full h-full bg-black relative">
                      {chartData.length > 0 ? (
                         <TradingChart data={chartData} symbol={activeSymbol} />
                      ) : (
                         <div className="flex items-center justify-center h-full text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Rendering Engine...</div>
                      )}
                    </div>
                  </Widget>
                </div>
              </Panel>

              <PanelResizeHandle className="h-0.5 w-full bg-border/50 hover:bg-accent transition-colors" />

              <Panel defaultSize={30} minSize={20} id="bottom-modules">
                <PanelGroup orientation="horizontal">
                  <Panel defaultSize={50} minSize={30} id="ict-panel">
                    <div className="h-full w-full p-px bg-background">
                      <Widget title="ICT Structure Engine">
                        <ICTPanel tick={activeQuote} timeframeLabel={timeframe.label} />
                      </Widget>
                    </div>
                  </Panel>
                  <PanelResizeHandle className="w-0.5 h-full bg-border/50 hover:bg-accent transition-colors" />
                  <Panel defaultSize={50} minSize={30} id="confluences">
                    <div className="h-full w-full p-px bg-background">
                      <Widget title="Terminal Confluences">
                        <ConfluenceScanner symbol={activeSymbol} timeframeLabel={timeframe.label} />
                      </Widget>
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-0.5 h-full bg-border/50 hover:bg-accent transition-colors" />

          {/* --- RIGHT COLUMN --- */}
          <Panel defaultSize={20} minSize={15} id="right-panel">
            <PanelGroup orientation="vertical">
              <Panel defaultSize={40} minSize={20} id="calendar">
                <div className="h-full w-full p-px bg-background">
                  <Widget title="Filtered Economic Calendar">
                    <MiniCalendar />
                  </Widget>
                </div>
              </Panel>

              <PanelResizeHandle className="h-0.5 w-full bg-border/50 hover:bg-accent transition-colors" />

              <Panel defaultSize={60} minSize={30} id="news">
                <div className="h-full w-full p-px bg-background">
                  <Widget title="Live Intelligence Wire">
                    <NewsFeed activeSymbol={activeSymbol} />
                  </Widget>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}