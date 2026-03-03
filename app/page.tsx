'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, Terminal as TerminalIcon, Layers, Target, Search, Zap, ShieldAlert } from 'lucide-react';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { NarrativeTracker } from '@/components/macro/NarrativeTracker';
import { SetupScanner } from '@/components/macro/SetupScanner';
import { MarketPositioning } from '@/components/macro/MarketPositioning';

const SYMBOL_MAP: Record<string, { tv: string, label: string }> = {
  '^NDX': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  '^GSPC': { tv: 'BLACKBULL:SPX500', label: 'S&P 500' },
  '^DJI': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  '^RUT': { tv: 'IG:RUSSELL', label: 'Russell 2000' },
  'CL=F': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GC=F': { tv: 'PEPPERSTONE:XAUUSD', label: 'Gold' },
  'EURUSD=X': { tv: 'PEPPERSTONE:EURUSD', label: 'EUR/USD' },
};

const WATCHLIST_SYMBOLS = Object.keys(SYMBOL_MAP);

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<string>('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;

  return (
    <div className="h-full w-full bg-background p-0.5 overflow-hidden flex flex-col">
      {/* Top Status Bar */}
      <div className="h-6 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-accent">
            <TerminalIcon size={10} />
            <span>VANTAGE TERMINAL v4.0 // SECURE_FEED_ACTIVE</span>
          </div>
          <div className="h-3 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
            <span className="text-positive animate-pulse">● LIVE</span>
            <span>NY: {time}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-text-tertiary">
          <span>CPU: 12%</span>
          <div className="h-3 w-[1px] bg-border" />
          <span>LATENCY: 42ms</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-0.5 w-full min-h-0">
        
        {/* --- COLUMN 1: MARKET WATCH & POSITIONING --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="flex-1 min-h-0">
            <Widget title="Market Watch // Institutional">
              <div className="flex flex-col">
                {WATCHLIST_SYMBOLS.map(sym => {
                  const data = marketData[sym];
                  const info = SYMBOL_MAP[sym];
                  const isPositive = data?.change >= 0;
                  
                  return (
                    <div 
                      key={sym} 
                      onClick={() => setActiveSymbol(sym)}
                      className={`flex justify-between items-center px-2 py-1.5 border-b border-border/20 cursor-pointer hover:bg-surface-highlight transition-colors ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-text-primary">{sym}</span>
                        <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{info.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono font-bold text-text-primary">
                          {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                        </span>
                        <div className={`flex items-center gap-1 text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                          <span>{data ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Widget>
          </div>
          
          <div className="h-[40%] min-h-0">
            <Widget title="Market Positioning // CFTC & Options">
              <MarketPositioning />
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 2: MACRO & SETUP SCANNER --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-[45%] min-h-0">
            <Widget title="Macro Narrative Tracker">
              <NarrativeTracker activeSymbol={activeSymbol} price={activeQuote?.price} />
            </Widget>
          </div>
          
          <div className="flex-1 min-h-0">
            <Widget title="Pre-Event Setup Scanner">
              <SetupScanner activeSymbol={activeSymbol} />
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 3: MAIN CHART & WIRE --- */}
        <div className="col-span-6 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="flex-1 min-h-0 relative">
            <Widget 
              title={`${activeSymbol} • ${SYMBOL_MAP[activeSymbol]?.label || ''}`} 
              actions={
                <div className="flex items-center gap-2 text-[8px]">
                  <span className="text-positive flex items-center gap-1"><Wifi size={8}/> Live</span>
                  <span className="px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase font-mono">{activeQuote?.marketState || 'REGULAR'}</span>
                </div>
              }
            >
              <div className="w-full h-full bg-black">
                <TradingViewChart symbol={activeTV} />
              </div>
            </Widget>
          </div>

          <div className="h-[35%] grid grid-cols-2 gap-0.5 min-h-0">
            <Widget title="Scenario Tree // Probabilistic">
              <div className="p-2 flex flex-col gap-2 h-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase">Next High Impact: CPI (Feb)</span>
                  <span className="text-[8px] text-accent font-mono">T-MINUS: 4D 02H</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Hot (>Forecast)', prob: 35, reaction: 'Bonds ↓, DXY ↑, Nasdaq ↓', bias: 'BEARISH' },
                    { label: 'In-Line', prob: 40, reaction: 'Chop, Range Expansion', bias: 'NEUTRAL' },
                    { label: 'Cool (<Forecast)', prob: 25, reaction: 'Bonds ↑, DXY ↓, Risk-on', bias: 'BULLISH' }
                  ].map(s => (
                    <div key={s.label} className="bg-surface-highlight/50 border border-border/50 p-1.5 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-text-primary">{s.label}</span>
                        <span className="text-[10px] font-mono text-accent">{s.prob}%</span>
                      </div>
                      <p className="text-[9px] text-text-secondary leading-tight">{s.reaction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Widget>
            <Widget title="Intelligence Wire">
              <NewsFeed />
            </Widget>
          </div>
        </div>

      </div>
    </div>
  );
}