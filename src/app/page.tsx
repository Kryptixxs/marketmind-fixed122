'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/ui/Widget';
import TradingViewChart from '@/features/MarketData/components/TradingViewChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { ConfluenceScanner } from '@/features/Terminal/components/widgets/ConfluenceScanner';
import { ICTPanel } from '@/features/Terminal/components/widgets/ICTPanel';
import { MiniCalendar } from '@/features/Terminal/components/widgets/MiniCalendar';
import { Wifi, TrendingUp, TrendingDown, Plus, Search, X } from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

// Clean UI Symbols
const DEFAULT_WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'EURUSD', 'BTCUSD'];
const MACRO_SYMBOLS = ['VIX', 'DXY'];

// Map the clean symbols to the preferred TradingView sources
const TV_WIDGET_MAP: Record<string, { tv: string, label: string }> = {
  'NAS100': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  'SPX500': { tv: 'PEPPERSTONE:US500', label: 'S&P 500' },
  'US30': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  'CRUDE': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GOLD': { tv: 'TVC:GOLD', label: 'Gold' },
  'EURUSD': { tv: 'FX:EURUSD', label: 'EUR/USD' },
  'BTCUSD': { tv: 'BINANCE:BTCUSDT', label: 'Bitcoin' },
  'ETHUSD': { tv: 'BINANCE:ETHUSDT', label: 'Ethereum' },
  'VIX': { tv: 'CBOE:VIX', label: 'Volatility Index' },
  'DXY': { tv: 'TVC:DXY', label: 'US Dollar Index' },
  'AAPL': { tv: 'NASDAQ:AAPL', label: 'Apple Inc.' },
  'TSLA': { tv: 'NASDAQ:TSLA', label: 'Tesla Inc.' },
  'NVDA': { tv: 'NASDAQ:NVDA', label: 'Nvidia Corp.' },
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
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const getTVSymbol = (sym: string) => TV_WIDGET_MAP[sym]?.tv || sym;
  const getLabel = (sym: string) => TV_WIDGET_MAP[sym]?.label || 'Equities/Crypto';

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
                        <div className="absolute top-full left-0 mt-1 w-48 bg-surface-highlight border border-border rounded shadow-xl z-50 p-1">
                          <form onSubmit={handleAddSymbol} className="flex items-center gap-2 bg-background border border-border px-2 rounded">
                            <Search size={10} className="text-text-tertiary" />
                            <input
                              ref={searchInputRef}
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="Add ticker (e.g. NAS100)"
                              className="flex-1 bg-transparent border-none outline-none text-[10px] py-1.5 text-text-primary uppercase"
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
                            <button onClick={(e) => handleRemoveSymbol(e, sym)} className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative"><X size={10} /></button>
                          </div>
                          <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{getLabel(sym)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono font-bold text-text-primary">
                            {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                          </span>
                          <div className={`flex items-center gap-1 text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                            {isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            <span>{data ? `${Math.abs(data.changePercent).toFixed(2)}%` : '--'}</span>
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
                        <span className="text-positive flex items-center gap-1 text-[8px] whitespace-nowrap"><Wifi size={8} /> Polygon Feed</span>
                      </div>
                    }
                  >
                    <div className="w-full h-full bg-black">
                      <TradingViewChart symbol={getTVSymbol(activeSymbol)} interval={timeframe.tv} />
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