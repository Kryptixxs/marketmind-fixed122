'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, Terminal as TerminalIcon } from 'lucide-react';
import { analyzeMarket } from '@/app/actions/analyzeMarket';
import { useMarketData } from '@/lib/marketdata/useMarketData';

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
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: marketData, error: streamError } = useMarketData(WATCHLIST_SYMBOLS);
  const loading = Object.keys(marketData).length === 0 && !streamError;

  const lastAnalyzedRef = useRef<string | null>(null);

  useEffect(() => {
    const data = marketData[activeSymbol];
    if (!data) return;

    const analysisKey = `${activeSymbol}-${data.price}`;
    if (lastAnalyzedRef.current === analysisKey) return;

    const runAnalysis = async () => {
      setAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeMarket(activeSymbol, SYMBOL_MAP[activeSymbol].label, data.price, data.changePercent);
        if (result) {
          setAiAnalysis(result);
          lastAnalyzedRef.current = analysisKey;
        }
      } catch (err) {
        setError("AI Offline.");
      } finally {
        setAnalyzing(false);
      }
    };

    runAnalysis();
  }, [activeSymbol, marketData[activeSymbol]?.price]);

  const activeQuote = marketData[activeSymbol];
  const activeTV = SYMBOL_MAP[activeSymbol]?.tv || activeSymbol;

  return (
    <div className="h-full w-full bg-background p-0.5 overflow-hidden flex flex-col">
      {/* Top Status Bar */}
      <div className="h-6 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-accent">
            <TerminalIcon size={10} />
            <span>VANTAGE TERMINAL v4.0</span>
          </div>
          <div className="h-3 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
            <span className="text-positive">● LIVE</span>
            <span>NY: {new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-text-tertiary">
          <span>CPU: 12%</span>
          <span>MEM: 1.2GB</span>
          <span className="text-accent">LATENCY: 42ms</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-0.5 w-full min-h-0">
        
        {/* --- COLUMN 1: MARKET WATCH & AI --- */}
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
                      className={`flex justify-between items-center px-2 py-1 border-b border-border/20 cursor-pointer hover:bg-surface-highlight transition-colors ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
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
          
          <div className="h-1/3 min-h-0">
            <Widget title="AI Intelligence // Sentiment">
              <div className="p-2 text-[10px] text-text-secondary leading-tight h-full flex flex-col">
                {analyzing ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-50">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Synthesizing...</span>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 text-negative opacity-80">
                    <AlertCircle size={14} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{error}</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-accent">
                        <Brain size={12} />
                        <span className="font-bold uppercase tracking-tight">{aiAnalysis.sentiment}</span>
                      </div>
                      <span className={aiAnalysis.strength > 50 ? 'text-positive' : 'text-negative'}>{aiAnalysis.strength}%</span>
                    </div>
                    <p className="text-[10px] text-text-primary leading-snug line-clamp-4 font-medium">
                      {aiAnalysis.analysis}
                    </p>
                    <div className="w-full h-0.5 bg-surface-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${aiAnalysis.strength}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                    <Activity size={16} />
                  </div>
                )}
              </div>
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 2: VITALS & NEWS --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-1/4 min-h-0">
            <Widget title="Global Vitals">
              <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-2 h-full content-start">
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">VIX Index</div>
                  <div className="text-sm font-bold text-warning font-mono">14.52</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">DXY Dollar</div>
                  <div className="text-sm font-bold text-text-primary font-mono">104.20</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">10Y Yield</div>
                  <div className="text-sm font-bold text-negative font-mono">4.31%</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">Liquidity</div>
                  <div className="text-sm font-bold text-positive uppercase">High</div>
                </div>
              </div>
            </Widget>
          </div>
          
          <div className="flex-1 min-h-0">
            <Widget title="Intelligence Wire">
              <NewsFeed />
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 3: MAIN CHART --- */}
        <div className="col-span-6 row-span-12 overflow-hidden relative min-h-0">
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

      </div>
    </div>
  );
}