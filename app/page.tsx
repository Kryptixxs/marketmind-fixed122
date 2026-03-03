'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { CorrelationMatrix } from '@/components/widgets/CorrelationMatrix';
import { 
  Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, 
  Terminal as TerminalIcon, Layers, Target, Search, Zap, ShieldAlert, 
  BarChart3, Globe, Cpu, Clock, ArrowUpRight, ArrowDownRight, Gauge
} from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { analyzeMarketState } from '@/lib/market-intelligence';
import { analyzeYieldCurve, getCreditStress } from '@/lib/macro-intelligence';
import { analyzeNewsSentiment } from '@/app/actions/analyzeNewsSentiment';

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
const MACRO_SYMBOLS = ['^VIX', 'DX-Y.NYB', '^TNX', '^IRX'];
const ALL_SYMBOLS = [...WATCHLIST_SYMBOLS, ...MACRO_SYMBOLS];

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("^NDX");
  const [newsSentiment, setNewsSentiment] = useState<any>(null);
  
  const { data: marketData, error: streamError } = useMarketData(ALL_SYMBOLS);
  const loading = Object.keys(marketData).length === 0 && !streamError;

  useEffect(() => {
    const handleSymbolChange = (e: any) => {
      const newSym = e.detail;
      if (SYMBOL_MAP[newSym] || newSym.length < 10) {
        setActiveSymbol(newSym);
      }
    };
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  // News Sentiment Synthesis
  useEffect(() => {
    const runSentiment = async () => {
      // In a real app, we'd pass actual headlines from the NewsFeed state
      // For now, we'll trigger it periodically
      const result = await analyzeNewsSentiment([
        "Fed officials signal caution on rate cuts",
        "Tech earnings beat expectations across the board",
        "Geopolitical tensions ease in Middle East",
        "US Treasury yields hit 4-month highs"
      ]);
      setNewsSentiment(result);
    };
    runSentiment();
    const interval = setInterval(runSentiment, 300000); // Every 5 mins
    return () => clearInterval(interval);
  }, []);

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;
  const insight = activeQuote ? analyzeMarketState(activeQuote) : null;
  
  const yieldCurve = analyzeYieldCurve(
    marketData['^TNX']?.price || 4.3,
    marketData['^IRX']?.price || 5.2
  );

  const credit = getCreditStress(marketData['^VIX']?.price || 15);

  return (
    <div className="h-full w-full bg-background overflow-hidden flex flex-col">
      <TerminalCommandBar />

      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-0.5 w-full min-h-0 p-0.5">
        
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
            <Widget title="Technical Confluence">
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
                        <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">ATR Vol</div>
                        <div className="text-xs font-mono font-bold text-warning">{insight.indicators.atr.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-accent/5 p-2 border border-accent/10 rounded-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold uppercase text-accent">Trend Strength</span>
                        <span className="text-[10px] font-mono font-bold text-accent">{insight.strength}%</span>
                      </div>
                      <div className="h-1 w-full bg-surface-highlight rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${insight.strength}%` }} />
                      </div>
                      <p className="text-[9px] text-text-secondary leading-tight italic mt-2">
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

        {/* --- COLUMN 2: MACRO & CORRELATION --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-[30%] min-h-0">
            <Widget title="Yield Curve & Rates">
              <div className="p-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                    <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">10Y Yield</div>
                    <div className="text-xs font-mono font-bold text-text-primary">{yieldCurve.tenYear.toFixed(3)}%</div>
                  </div>
                  <div className="bg-surface-highlight/50 p-2 border border-border/50 rounded-sm">
                    <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">3M T-Bill</div>
                    <div className="text-xs font-mono font-bold text-text-primary">{yieldCurve.twoYear.toFixed(3)}%</div>
                  </div>
                </div>
                
                <div className="p-2 bg-background border border-border rounded-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-text-tertiary uppercase font-bold">3M/10Y Spread</span>
                    <span className={`text-[10px] font-mono font-bold ${yieldCurve.spread < 0 ? 'text-negative' : 'text-positive'}`}>
                      {(yieldCurve.spread * 100).toFixed(1)} bps
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-text-tertiary uppercase font-bold">Regime</span>
                    <span className="text-[9px] font-bold text-accent uppercase">{yieldCurve.regime}</span>
                  </div>
                </div>
              </div>
            </Widget>
          </div>
          
          <div className="h-[35%] min-h-0">
            <Widget title="Cross-Asset Correlation">
              {activeQuote ? (
                <CorrelationMatrix activeTick={activeQuote} marketData={marketData} />
              ) : (
                <div className="flex items-center justify-center h-full opacity-30"><Loader2 className="animate-spin" size={16} /></div>
              )}
            </Widget>
          </div>

          <div className="flex-1 min-h-0">
            <Widget title="Credit & Risk Stress">
              <div className="p-2 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-tertiary uppercase font-bold">Systemic Stress</span>
                  <span className={`text-[10px] font-mono font-bold ${credit.status === 'STABLE' ? 'text-positive' : 'text-negative'}`}>{credit.status}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-text-tertiary uppercase font-bold">
                    <span>Stress Index</span>
                    <span>{credit.score}/100</span>
                  </div>
                  <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
                    <div className={`h-full ${credit.score > 50 ? 'bg-negative' : 'bg-positive'} transition-all duration-1000`} style={{ width: `${credit.score}%` }} />
                  </div>
                </div>
                <div className="bg-surface-highlight/30 p-2 border border-border/50 rounded-sm">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold mb-1">News Sentiment</div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase ${newsSentiment?.score > 0 ? 'text-positive' : 'text-negative'}`}>
                      {newsSentiment?.label || 'Analyzing...'}
                    </span>
                    <span className="text-[10px] font-mono text-text-primary">{newsSentiment?.score || 0}</span>
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
            <Widget title="SMC / ICT Levels">
              <div className="p-2 space-y-3 h-full overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold">Order Blocks (Live)</div>
                  {insight?.levels.orderBlocks.length ? insight.levels.orderBlocks.map((ob, i) => (
                    <div key={i} className={`flex justify-between items-center p-1 rounded-sm border ${ob.type === 'Bullish' ? 'bg-positive/5 border-positive/20 text-positive' : 'bg-negative/5 border-negative/20 text-negative'}`}>
                      <span className="text-[9px] font-bold">{ob.type} OB</span>
                      <span className="text-[10px] font-mono">{ob.price.toFixed(2)}</span>
                    </div>
                  )) : <div className="text-[8px] text-text-tertiary italic">Scanning for OBs...</div>}
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] text-text-tertiary uppercase font-bold">Fair Value Gaps (Live)</div>
                  {insight?.levels.fvgs.length ? insight.levels.fvgs.map((fvg, i) => (
                    <div key={i} className="flex justify-between items-center p-1 rounded-sm border bg-warning/5 border-warning/20 text-warning">
                      <span className="text-[9px] font-bold">FVG (30D)</span>
                      <span className="text-[10px] font-mono">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
                    </div>
                  )) : <div className="text-[8px] text-text-tertiary italic">Scanning for FVGs...</div>}
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