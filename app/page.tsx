'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { 
  Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, 
  Terminal as TerminalIcon, Layers, Target, Search, Zap, ShieldAlert, 
  BarChart3, Globe, Cpu, Clock
} from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { analyzeMarketState, getMacroRegime } from '@/lib/market-intelligence';
import { useSearchParams } from 'next/navigation';

const SYMBOL_MAP: Record<string, { tv: string, label: string, category: string }> = {
  '^NDX': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100', category: 'indices' },
  '^GSPC': { tv: 'BLACKBULL:SPX500', label: 'S&P 500', category: 'indices' },
  '^DJI': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones', category: 'indices' },
  '^RUT': { tv: 'IG:RUSSELL', label: 'Russell 2000', category: 'indices' },
  'CL=F': { tv: 'TVC:USOIL', label: 'Crude Oil', category: 'commodities' },
  'GC=F': { tv: 'PEPPERSTONE:XAUUSD', label: 'Gold', category: 'commodities' },
  'EURUSD=X': { tv: 'PEPPERSTONE:EURUSD', label: 'EUR/USD', category: 'forex' },
  'BTC-USD': { tv: 'BINANCE:BTCUSDT', label: 'Bitcoin', category: 'crypto' },
  'ETH-USD': { tv: 'BINANCE:ETHUSDT', label: 'Ethereum', category: 'crypto' },
};

const WATCHLIST_SYMBOLS = Object.keys(SYMBOL_MAP);

export default function TerminalPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'indices';
  
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  const [time, setTime] = useState<string>('--:--:--');
  
  const { data: marketData, error: streamError } = useMarketData(WATCHLIST_SYMBOLS);
  const loading = Object.keys(marketData).length === 0 && !streamError;

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;
  
  // Deterministic Analysis
  const insight = activeQuote ? analyzeMarketState(activeQuote) : null;
  const macro = getMacroRegime(14.5, 104.2); // Mocked VIX/DXY for now

  const filteredSymbols = WATCHLIST_SYMBOLS.filter(sym => {
    if (tab === 'indices') return SYMBOL_MAP[sym].category === 'indices';
    if (tab === 'crypto') return SYMBOL_MAP[sym].category === 'crypto';
    if (tab === 'forex') return SYMBOL_MAP[sym].category === 'forex';
    return true;
  });

  return (
    <div className="h-full w-full bg-background p-0.5 overflow-hidden flex flex-col">
      {/* Top Status Bar */}
      <div className="h-6 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-accent">
            <TerminalIcon size={10} />
            <span>VANTAGE TERMINAL v4.0 // DETERMINISTIC_INTEL_ENGINE</span>
          </div>
          <div className="h-3 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
            <span className="text-positive animate-pulse">● LIVE_FEED</span>
            <span>NY: {time}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-text-tertiary">
          <span className="text-accent">ENGINE: ACTIVE</span>
          <div className="h-3 w-[1px] bg-border" />
          <span className="text-text-secondary">SECURE_FEED: ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-0.5 w-full min-h-0">
        
        {/* --- COLUMN 1: MARKET WATCH & INTEL --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="flex-1 min-h-0">
            <Widget title={`Market Watch // ${tab.toUpperCase()}`}>
              <div className="flex flex-col">
                {filteredSymbols.map(sym => {
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
          
          <div className="h-[30%] min-h-0">
            <Widget title="Technical Intelligence">
              <div className="p-2 text-[10px] text-text-secondary leading-tight h-full flex flex-col">
                {insight ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-accent">
                        <Zap size={12} />
                        <span className="font-bold uppercase tracking-tight">{insight.sentiment} // {insight.structure}</span>
                      </div>
                      <span className={insight.strength > 50 ? 'text-positive' : 'text-negative'}>{insight.strength}%</span>
                    </div>
                    <p className="text-[10px] text-text-primary leading-snug font-medium">
                      {insight.analysis}
                    </p>
                    <div className="w-full h-0.5 bg-surface-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${insight.strength}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                )}
              </div>
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 2: MACRO ENGINE --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-[25%] min-h-0">
            <Widget title="Market Positioning">
              <div className="p-2 grid grid-cols-2 gap-2">
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">DXY Bias</div>
                  <div className="text-xs font-mono font-bold text-positive">BULLISH</div>
                </div>
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">VIX Regime</div>
                  <div className="text-xs font-mono font-bold text-text-secondary">STABLE</div>
                </div>
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Liquidity</div>
                  <div className="text-xs font-mono font-bold text-positive">HIGH</div>
                </div>
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Gamma</div>
                  <div className="text-xs font-mono font-bold text-accent">POSITIVE</div>
                </div>
              </div>
            </Widget>
          </div>
          
          <div className="h-[25%] min-h-0">
            <Widget title="Technical Levels">
              <div className="p-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Resistance 1</span>
                  <span className="text-[10px] font-mono text-negative">{insight?.levels.resistance[0].toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Resistance 2</span>
                  <span className="text-[10px] font-mono text-negative">{insight?.levels.resistance[1].toFixed(2)}</span>
                </div>
                <div className="h-[1px] bg-border/50" />
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Support 1</span>
                  <span className="text-[10px] font-mono text-positive">{insight?.levels.support[0].toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Support 2</span>
                  <span className="text-[10px] font-mono text-positive">{insight?.levels.support[1].toFixed(2)}</span>
                </div>
              </div>
            </Widget>
          </div>

          <div className="h-[25%] min-h-0">
            <Widget title="Setup Scanner">
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Structure</span>
                  <span className="text-[10px] font-mono text-accent">{insight?.structure === 'BOS' ? 'BULLISH_BOS' : insight?.structure === 'MSS' ? 'BEARISH_MSS' : 'RANGING'}</span>
                </div>
                <div className="bg-accent/5 p-2 border border-accent/10 rounded-sm">
                  <div className="text-[8px] text-accent font-bold uppercase mb-1">Current Setup</div>
                  <p className="text-[9px] text-text-secondary leading-tight italic">
                    "Price action suggests a high-probability retest of the 15m FVG before further expansion."
                  </p>
                </div>
              </div>
            </Widget>
          </div>

          <div className="flex-1 min-h-0">
            <Widget title="Macro Narrative">
              <div className="p-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Regime</span>
                  <span className="text-[10px] font-mono text-positive">{macro.regime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Narrative</span>
                  <span className="text-[10px] font-mono text-accent">{macro.narrative}</span>
                </div>
                <div className="mt-2 p-2 bg-surface-highlight/50 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary font-bold uppercase mb-1">Market Bias</div>
                  <div className="text-[10px] font-mono font-bold text-positive">RISK_ON_EXPANSION</div>
                </div>
              </div>
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 3: MAIN CHART --- */}
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
            <Widget title="Asset Sensitivity">
              <div className="p-2 space-y-1.5">
                {['DXY', 'GOLD', 'US10Y', 'ES_FUT'].map(asset => (
                  <div key={asset} className="flex justify-between items-center p-1.5 bg-surface-highlight/30 border border-border/30 rounded-sm">
                    <span className="text-[10px] font-bold text-text-primary">{asset}</span>
                    <span className="text-[8px] font-bold text-accent uppercase">High Sensitivity</span>
                  </div>
                ))}
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