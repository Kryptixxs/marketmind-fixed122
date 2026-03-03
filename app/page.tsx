'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { 
  Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, 
  Terminal as TerminalIcon, Layers, Target, Search, Zap, ShieldAlert, 
  BarChart3, Globe, Cpu, Clock, ArrowUpRight, ArrowDownRight, Gauge
} from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { analyzeMarketState, getMacroRegime } from '@/lib/market-intelligence';

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
const MACRO_SYMBOLS = ['^VIX', 'DX-Y.NYB', '^TNX'];
const ALL_SYMBOLS = [...WATCHLIST_SYMBOLS, ...MACRO_SYMBOLS];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  const [time, setTime] = useState<string>('--:--:--');
  
  const { data: marketData, error: streamError } = useMarketData(ALL_SYMBOLS);
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
  
  // Advanced Deterministic Analysis
  const insight = activeQuote ? analyzeMarketState(activeQuote, marketData) : null;
  const macro = getMacroRegime(
    marketData['^VIX']?.price || 15,
    marketData['DX-Y.NYB']?.price || 104,
    marketData['^TNX']?.price || 4.3
  );

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
        
        {/* --- COLUMN 1: MARKET WATCH & TECHNICALS --- */}
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
            <Widget title="Technical Indicators">
              <div className="p-2 space-y-3 h-full overflow-y-auto custom-scrollbar">
                {insight ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                        <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">RSI (14)</div>
                        <div className={`text-xs font-mono font-bold ${insight.indicators.rsi > 70 ? 'text-negative' : insight.indicators.rsi < 30 ? 'text-positive' : 'text-text-primary'}`}>
                          {insight.indicators.rsi.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                        <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">ATR Volatility</div>
                        <div className="text-xs font-mono font-bold text-warning">{insight.indicators.atr.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-text-tertiary uppercase font-bold">EMA 9</span>
                        <span className="font-mono text-text-secondary">{insight.indicators.ema9.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-text-tertiary uppercase font-bold">EMA 21</span>
                        <span className="font-mono text-text-secondary">{insight.indicators.ema21.toFixed(2)}</span>
                      </div>
                      <div className="h-1 w-full bg-surface-highlight rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${insight.sentiment === 'Bullish' ? 'bg-positive' : 'bg-negative'} transition-all duration-1000`} style={{ width: `${insight.strength}%` }} />
                      </div>
                    </div>

                    <div className="bg-accent/5 p-2 border border-accent/10 rounded-sm">
                      <div className="flex items-center gap-1.5 text-accent mb-1">
                        <Gauge size={10} />
                        <span className="text-[8px] font-bold uppercase">Trend Strength: {insight.strength}%</span>
                      </div>
                      <p className="text-[9px] text-text-secondary leading-tight italic">
                        {insight.analysis}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-30"><Loader2 className="animate-spin" size={16} /></div>
                )}
              </div>
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 2: MACRO & SMC ENGINE --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-[25%] min-h-0">
            <Widget title="Institutional Positioning">
              <div className="p-2 grid grid-cols-2 gap-2">
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">DXY Bias</div>
                  <div className="text-xs font-mono font-bold text-positive">BULLISH</div>
                </div>
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">VIX Regime</div>
                  <div className="text-xs font-mono font-bold text-positive">STABLE</div>
                </div>
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">10Y Yield</div>
                  <div className="text-xs font-mono font-bold text-accent">4.31%</div>
                </div>
                <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">Gamma</div>
                  <div className="text-xs font-mono font-bold text-accent">POSITIVE</div>
                </div>
              </div>
            </Widget>
          </div>
          
          <div className="h-[35%] min-h-0">
            <Widget title="SMC / ICT Levels">
              <div className="p-2 space-y-3 h-full overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold">Order Blocks</div>
                  {insight?.levels.orderBlocks.map((ob, i) => (
                    <div key={i} className={`flex justify-between items-center p-1 rounded-sm border ${ob.type === 'Bullish' ? 'bg-positive/5 border-positive/20 text-positive' : 'bg-negative/5 border-negative/20 text-negative'}`}>
                      <span className="text-[9px] font-bold">{ob.type} OB</span>
                      <span className="text-[10px] font-mono">{ob.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold">Fair Value Gaps</div>
                  {insight?.levels.fvgs.map((fvg, i) => (
                    <div key={i} className="flex justify-between items-center p-1 rounded-sm border bg-warning/5 border-warning/20 text-warning">
                      <span className="text-[9px] font-bold">FVG (15m)</span>
                      <span className="text-[10px] font-mono">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Widget>
          </div>

          <div className="h-[20%] min-h-0">
            <Widget title="Asset Correlations">
              <div className="p-2 space-y-1.5">
                {insight?.correlations.map(c => (
                  <div key={c.asset} className="flex justify-between items-center p-1.5 bg-surface-highlight/30 border border-border/30 rounded-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-text-primary">{c.asset}</span>
                      <span className="text-[8px] text-text-tertiary font-mono">({c.coefficient})</span>
                    </div>
                    <span className={`text-[8px] font-bold uppercase ${c.impact === 'Positive' ? 'text-positive' : 'text-negative'}`}>
                      {c.impact} Impact
                    </span>
                  </div>
                ))}
              </div>
            </Widget>
          </div>

          <div className="flex-1 min-h-0">
            <Widget title="Macro Regime">
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
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] text-text-tertiary font-bold uppercase">Sentiment Score</span>
                    <span className="text-[10px] font-mono font-bold text-accent">{macro.score}/100</span>
                  </div>
                  <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${macro.score}%` }} />
                  </div>
                </div>
              </div>
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
            <Widget title="Volume Profile & Liquidity">
              <div className="p-2 h-full flex flex-col">
                <div className="flex-1 space-y-1.5">
                  {insight?.indicators.volumeProfile.map((vp, i) => (
                    <div key={i} className="relative h-4 bg-surface-highlight/20 border border-border/10 rounded-sm overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-accent/10 transition-all duration-1000" style={{ width: `${(vp.volume / 1000) * 100}%` }} />
                      <div className="absolute inset-0 flex justify-between items-center px-2 text-[8px] font-mono">
                        <span className="text-text-secondary">{vp.price.toFixed(2)}</span>
                        <span className="text-text-tertiary">{vp.volume.toFixed(0)} lots</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center">
                  <span className="text-[8px] text-text-tertiary uppercase font-bold">Point of Control (POC)</span>
                  <span className="text-[10px] font-mono text-accent">{activeQuote?.price.toFixed(2)}</span>
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