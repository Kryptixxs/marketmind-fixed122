'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Widget } from '@/components/Widget';
import { TradingChart } from '@/components/TradingChart';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { 
  Activity, Wifi, Loader2, TrendingUp, TrendingDown, 
  Brain, AlertCircle, Plus, X, Search, LineChart, Zap,
  Target, ShieldAlert, ArrowRight
} from 'lucide-react';
import { analyzeMarket, MarketAnalysis } from '@/app/actions/analyzeMarket';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { formatPrice, formatPercent, formatInt } from '@/lib/format';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { fetchHistoricalBars, Bar } from '@/app/actions/fetchHistoricalBars';

const SYMBOL_METADATA: Record<string, { label: string, type: any }> = {
  '^NDX': { label: 'Nasdaq 100', type: 'index' },
  '^GSPC': { label: 'S&P 500', type: 'index' },
  '^DJI': { label: 'Dow Jones', type: 'index' },
  '^RUT': { label: 'Russell 2000', type: 'index' },
  'CL=F': { label: 'Crude Oil', type: 'commodity' },
  'GC=F': { label: 'Gold', type: 'commodity' },
  'EURUSD=X': { label: 'EUR/USD', type: 'fx' },
  'BTC-USD': { label: 'Bitcoin', type: 'crypto' },
};

const VITALS_SYMBOLS = ['^VIX', 'DX-Y.NYB', '^TNX'];

export default function TerminalPage() {
  const { symbols, activeSymbol, setActiveSymbol, addSymbol, removeSymbol } = useWatchlistStore();
  const [aiAnalysis, setAiAnalysis] = useState<MarketAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  
  const [chartMode, setChartMode] = useState<'standard' | 'advanced'>('standard');
  const [timeframe, setTimeframe] = useState('6m');
  const [historicalData, setHistoricalData] = useState<Bar[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const allRequiredSymbols = [...symbols, ...VITALS_SYMBOLS];
  const { data: marketData } = useMarketData(allRequiredSymbols);
  
  const lastAnalyzedRef = useRef<string | null>(null);

  const loadHistory = useCallback(async (sym: string, range: string) => {
    if (!sym) return;
    setLoadingHistory(true);
    try {
      const bars = await fetchHistoricalBars(sym, range);
      setHistoricalData(bars);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(activeSymbol, timeframe);
  }, [activeSymbol, timeframe, loadHistory]);

  // Calculate technicals for AI grounding
  const calculateTechnicals = (bars: Bar[]) => {
    if (bars.length < 20) return null;
    
    const closes = bars.map(b => b.close);
    const last20 = closes.slice(-20);
    
    // Simple RSI (14)
    let gains = 0, losses = 0;
    for (let i = closes.length - 14; i < closes.length; i++) {
      const diff = closes[i] - closes[i-1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rsi = 100 - (100 / (1 + (gains / 14) / (losses / 14 || 1)));
    
    // MA Slope (20d)
    const ma20 = last20.reduce((a, b) => a + b, 0) / 20;
    const prevMa20 = closes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    const maSlope = (ma20 - prevMa20) / prevMa20;
    
    // Volatility (ATR Proxy)
    const trs = bars.slice(-14).map((b, i, arr) => {
      if (i === 0) return b.high - b.low;
      return Math.max(b.high - b.low, Math.abs(b.high - arr[i-1].close), Math.abs(b.low - arr[i-1].close));
    });
    const volatility = trs.reduce((a, b) => a + b, 0) / 14;

    return {
      rsi,
      maSlope,
      volatility,
      high52w: Math.max(...closes),
      low52w: Math.min(...closes)
    };
  };

  useEffect(() => {
    const data = marketData[activeSymbol];
    if (!data || historicalData.length < 20) return;

    const analysisKey = `${activeSymbol}-${data.price}`;
    if (lastAnalyzedRef.current === analysisKey) return;

    const runAnalysis = async () => {
      setAnalyzing(true);
      setError(null);
      try {
        const technicals = calculateTechnicals(historicalData);
        if (!technicals) return;

        const label = SYMBOL_METADATA[activeSymbol]?.label || activeSymbol;
        const result = await analyzeMarket(activeSymbol, label, data.price, data.changePercent, technicals);
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
  }, [activeSymbol, marketData[activeSymbol]?.price, historicalData]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol) {
      addSymbol(newSymbol);
      setActiveSymbol(newSymbol);
      setNewSymbol('');
      setIsAdding(false);
    }
  };

  const vix = marketData['^VIX'];
  const dxy = marketData['DX-Y.NYB'];
  const tnx = marketData['^TNX'];

  const getLiquidity = (v: number) => {
    if (v < 15) return { label: 'High', color: 'text-positive' };
    if (v <= 25) return { label: 'Normal', color: 'text-warning' };
    return { label: 'Risk-off', color: 'text-negative' };
  };
  const liquidity = vix ? getLiquidity(vix.price) : { label: '---', color: 'text-text-tertiary' };

  return (
    <div className="h-full w-full bg-background p-0.5 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-0.5 h-full w-full">
        
        {/* --- COLUMN 1: MARKET WATCH & AI --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5">
          <div className="flex-1 min-h-0">
            <Widget 
              title="Market Watch // Institutional"
              actions={
                <button onClick={() => setIsAdding(!isAdding)} className="text-text-tertiary hover:text-accent transition-colors">
                  <Plus size={12} />
                </button>
              }
            >
              <div className="flex flex-col">
                {isAdding && (
                  <form onSubmit={handleAdd} className="p-2 border-b border-border bg-surface-highlight flex gap-2">
                    <input 
                      autoFocus
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Enter Ticker..."
                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-[10px] outline-none focus:border-accent"
                    />
                    <button type="submit" className="text-accent"><Plus size={14}/></button>
                  </form>
                )}
                {symbols.map(sym => {
                  const data = marketData[sym];
                  const meta = SYMBOL_METADATA[sym] || { label: sym, type: sym.includes('=') ? 'fx' : 'equity' };
                  const isPositive = data?.change >= 0;
                  return (
                    <div 
                      key={sym} 
                      onClick={() => setActiveSymbol(sym)}
                      className={`flex justify-between items-center px-2 py-1.5 border-b border-border/30 cursor-pointer hover:bg-surface-highlight transition-colors group ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-text-primary">{sym}</span>
                        <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{meta.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono font-bold text-text-primary mono-num">
                          {data ? formatPrice(data.price, meta.type) : '---'}
                        </span>
                        <div className={`flex items-center gap-1 text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                          <span>{data ? `${isPositive ? '+' : ''}${formatPercent(data.changePercent)}` : '--'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Widget>
          </div>
          
          <div className="h-1/2 min-h-0">
            <Widget title="Market Intelligence // AI">
              <div className="p-3 text-[10px] text-text-secondary leading-tight h-full flex flex-col overflow-y-auto custom-scrollbar">
                {analyzing ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
                    <Loader2 size={16} className="animate-spin text-accent" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Synthesizing Intelligence...</span>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 text-negative opacity-80">
                    <AlertCircle size={14} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{error}</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-4 animate-in">
                    {/* Header Metrics */}
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${aiAnalysis.bias === 'Bullish' ? 'bg-positive' : aiAnalysis.bias === 'Bearish' ? 'bg-negative' : 'bg-warning'}`} />
                        <span className="font-bold text-text-primary uppercase tracking-tight">{aiAnalysis.bias} Bias</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary uppercase font-bold">Conf:</span>
                        <span className="text-accent font-bold">{aiAnalysis.confidence}%</span>
                      </div>
                    </div>

                    {/* Regime & Thesis */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-accent" />
                        <span className="font-bold text-text-primary uppercase tracking-tighter">{aiAnalysis.regime} Regime</span>
                      </div>
                      <p className="text-text-primary leading-relaxed italic">"{aiAnalysis.thesis}"</p>
                    </div>

                    {/* Levels */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-highlight/50 p-2 rounded border border-border">
                        <span className="text-[8px] font-bold text-text-tertiary uppercase block mb-1">Resistance</span>
                        <div className="space-y-1">
                          {aiAnalysis.levels.resistance.map(l => <div key={l} className="font-mono text-negative font-bold">{formatPrice(l)}</div>)}
                        </div>
                      </div>
                      <div className="bg-surface-highlight/50 p-2 rounded border border-border">
                        <span className="text-[8px] font-bold text-text-tertiary uppercase block mb-1">Support</span>
                        <div className="space-y-1">
                          {aiAnalysis.levels.support.map(l => <div key={l} className="font-mono text-positive font-bold">{formatPrice(l)}</div>)}
                        </div>
                      </div>
                    </div>

                    {/* Risk & Invalidation */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-negative">
                        <ShieldAlert size={12} />
                        <span className="font-bold uppercase tracking-tighter">Invalidation</span>
                      </div>
                      <p className="text-text-secondary">{aiAnalysis.invalidation}</p>
                    </div>

                    {/* Next Steps */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-bold text-text-tertiary uppercase block">Tactical Steps</span>
                      {aiAnalysis.nextSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-text-primary">
                          <ArrowRight size={10} className="mt-0.5 text-accent shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                    <Activity size={16} />
                    <span className="text-[8px] mt-2 uppercase font-bold">Awaiting Data</span>
                  </div>
                )}
              </div>
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 2: VITALS & NEWS --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5">
          <div className="h-1/4 min-h-0">
            <Widget title="Global Vitals">
              <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-2 h-full content-start">
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">VIX Index</div>
                  <div className={`text-sm font-bold mono-num ${vix ? (vix.change >= 0 ? 'text-negative' : 'text-positive') : 'text-text-primary'}`}>
                    {vix ? formatPrice(vix.price, 'index') : '---'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">DXY Dollar</div>
                  <div className={`text-sm font-bold mono-num ${dxy ? (dxy.change >= 0 ? 'text-positive' : 'text-negative') : 'text-text-primary'}`}>
                    {dxy ? formatPrice(dxy.price, 'index') : '---'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">10Y Yield</div>
                  <div className={`text-sm font-bold mono-num ${tnx ? (tnx.change >= 0 ? 'text-negative' : 'text-positive') : 'text-text-primary'}`}>
                    {tnx ? `${formatPrice(tnx.price / 10, 'index')}%` : '---'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">Liquidity</div>
                  <div className={`text-sm font-bold ${liquidity.color}`}>
                    {liquidity.label}
                  </div>
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
        <div className="col-span-6 row-span-12 overflow-hidden relative">
          <Widget 
            title={`${activeSymbol} • ${SYMBOL_METADATA[activeSymbol]?.label || ''}`} 
            actions={
              <div className="flex items-center gap-3">
                <div className="flex bg-surface border border-border rounded p-0.5">
                  {['1m', '6m', '1y', '5y'].map(tf => (
                    <button 
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-colors ${timeframe === tf ? 'bg-accent/20 text-accent' : 'text-text-tertiary hover:text-text-primary'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <div className="flex bg-surface border border-border rounded p-0.5">
                  <button 
                    onClick={() => setChartMode('standard')}
                    className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-colors ${chartMode === 'standard' ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary'}`}
                  >
                    Standard
                  </button>
                  <button 
                    onClick={() => setChartMode('advanced')}
                    className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-colors ${chartMode === 'advanced' ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary'}`}
                  >
                    Advanced
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[8px]">
                  <span className="text-positive flex items-center gap-1"><Wifi size={8}/> Live</span>
                  <span className="px-1 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase">{marketData[activeSymbol]?.marketState || 'REGULAR'}</span>
                </div>
              </div>
            }
          >
            <div className="w-full h-full bg-black relative">
              {chartMode === 'standard' ? (
                loadingHistory ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 size={24} className="animate-spin text-accent" />
                  </div>
                ) : historicalData.length > 0 ? (
                  <TradingChart data={historicalData} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-30">
                    <LineChart size={32} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Select Asset to Load Chart</span>
                  </div>
                )
              ) : (
                <TradingViewChart symbol={activeSymbol} />
              )}
            </div>
          </Widget>
        </div>

      </div>
    </div>
  );
}