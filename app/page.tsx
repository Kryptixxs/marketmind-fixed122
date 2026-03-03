'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Widget } from '@/components/Widget';
import { TradingChart } from '@/components/TradingChart';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { 
  Activity, Wifi, Loader2, TrendingUp, TrendingDown, 
  Brain, AlertCircle, Plus, X, Search, LineChart, Zap,
  Target, ShieldAlert, ArrowRight, Clock, MousePointer2
} from 'lucide-react';
import { analyzeMarket, MarketAnalysis } from '@/app/actions/analyzeMarket';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { formatPrice, formatPercent, formatInt } from '@/lib/format';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { fetchHistoricalBars, Bar } from '@/app/actions/fetchHistoricalBars';
import { getInstrument, resolveYahooSymbol } from '@/lib/instruments';
import { fetchGlobalVitals, GlobalVitals } from '@/app/actions/fetchGlobalVitals';

const TIMEFRAMES = [
  { label: '1M', value: '1m' },
  { label: '5M', value: '5m' },
  { label: '15M', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
];

export default function TerminalPage() {
  const { symbols, activeSymbol, setActiveSymbol, addSymbol } = useWatchlistStore();
  const [aiAnalysis, setAiAnalysis] = useState<MarketAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  
  const [chartMode, setChartMode] = useState<'standard' | 'advanced'>('standard');
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('1d');
  const [historicalData, setHistoricalData] = useState<Bar[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [vitals, setVitals] = useState<GlobalVitals | null>(null);
  
  const allRequiredYahooSymbols = symbols.map(id => resolveYahooSymbol(id));
  const { data: marketData } = useMarketData(allRequiredYahooSymbols);
  const lastAnalyzedRef = useRef<string | null>(null);

  const loadVitals = useCallback(async () => {
    const data = await fetchGlobalVitals();
    setVitals(data);
  }, []);

  useEffect(() => {
    loadVitals();
    const intervalId = setInterval(loadVitals, 30000);
    return () => clearInterval(intervalId);
  }, [loadVitals]);

  useEffect(() => {
    if (!activeSymbol && symbols.length > 0) {
      setActiveSymbol(symbols[0]);
    }
  }, [activeSymbol, symbols, setActiveSymbol]);

  const loadHistory = useCallback(async (id: string, int: any) => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const bars = await fetchHistoricalBars(id, '1y', int);
      setHistoricalData(bars);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(activeSymbol, interval);
  }, [activeSymbol, interval, loadHistory]);

  useEffect(() => {
    const yahooSym = resolveYahooSymbol(activeSymbol);
    const data = marketData[yahooSym];
    if (!data || historicalData.length < 20) return;

    const analysisKey = `${activeSymbol}-${data.price}-${interval}`;
    if (lastAnalyzedRef.current === analysisKey) return;

    const runAnalysis = async () => {
      setAnalyzing(true);
      setError(null);
      try {
        const closes = historicalData.map(b => b.close);
        const last20 = closes.slice(-20);
        let gains = 0, losses = 0;
        for (let i = closes.length - 14; i < closes.length; i++) {
          const diff = closes[i] - closes[i-1];
          if (diff >= 0) gains += diff; else losses -= diff;
        }
        const rsi = 100 - (100 / (1 + (gains / 14) / (losses / 14 || 1)));
        const ma20 = last20.reduce((a, b) => a + b, 0) / 20;
        const prevMa20 = closes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
        const maSlope = (ma20 - prevMa20) / prevMa20;
        const trs = historicalData.slice(-14).map((b, i, arr) => {
          if (i === 0) return b.high - b.low;
          return Math.max(b.high - b.low, Math.abs(b.high - arr[i-1].close), Math.abs(b.low - arr[i-1].close));
        });
        const volatility = trs.reduce((a, b) => a + b, 0) / 14;

        const inst = getInstrument(activeSymbol);
        const result = await analyzeMarket(activeSymbol, inst?.label || activeSymbol, data.price, data.changePercent, {
          rsi, maSlope, volatility, high52w: Math.max(...closes), low52w: Math.min(...closes)
        });
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
  }, [activeSymbol, marketData, historicalData, interval]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol) {
      addSymbol(newSymbol.toUpperCase());
      setActiveSymbol(newSymbol.toUpperCase());
      setNewSymbol('');
      setIsAdding(false);
    }
  };

  const activeInstrument = getInstrument(activeSymbol);
  const activeQuote = marketData[resolveYahooSymbol(activeSymbol)];

  return (
    <div className="h-full w-full bg-background p-0.5 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-12 gap-0.5 h-full w-full">
        
        {/* --- COLUMN 1: MARKET WATCH & AI --- */}
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="flex-1 min-h-[200px]">
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
                {symbols.map(id => {
                  const inst = getInstrument(id);
                  const data = marketData[resolveYahooSymbol(id)];
                  const isPositive = data?.change >= 0;
                  const isStale = data && (Date.now() - data.timestamp > 300000);
                  
                  return (
                    <div 
                      key={id} 
                      onClick={() => setActiveSymbol(id)}
                      className={`flex justify-between items-center px-2 py-1.5 border-b border-border/30 cursor-pointer hover:bg-surface-highlight transition-colors group ${activeSymbol === id ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[10px] text-text-primary">{id}</span>
                          {isStale && <span className="text-[7px] font-bold bg-warning/10 text-warning px-1 rounded border border-warning/20">DELAYED</span>}
                        </div>
                        <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{inst?.label || id}</span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] font-mono font-bold text-text-primary">
                          {data ? formatPrice(data.price, inst?.assetType.toLowerCase() as any, inst?.decimals) : '---'}
                        </span>
                        <span className={`text-[9px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>
                          {data ? formatPercent(data.changePercent) : '--'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Widget>
          </div>
          
          <div className="h-1/2 min-h-[300px]">
            <Widget title="Market Intelligence // AI">
              <div className="p-3 text-[10px] text-text-secondary leading-tight h-full flex flex-col overflow-y-auto custom-scrollbar">
                {!activeSymbol ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-surface-highlight flex items-center justify-center text-text-tertiary">
                      <MousePointer2 size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Select Instrument</p>
                      <p className="text-[9px] text-text-tertiary">Choose an asset from the watchlist to begin AI synthesis.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                      {symbols.slice(0, 4).map(s => (
                        <button key={s} onClick={() => setActiveSymbol(s)} className="px-2 py-1 bg-surface-highlight border border-border rounded text-[9px] font-bold hover:border-accent/50 transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                ) : analyzing ? (
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
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${aiAnalysis.bias === 'Bullish' ? 'bg-positive' : aiAnalysis.bias === 'Bearish' ? 'bg-negative' : 'bg-warning'}`} />
                        <span className="font-bold text-text-primary uppercase tracking-tight">{aiAnalysis.bias} Bias</span>
                      </div>
                      <span className="text-accent font-bold">{aiAnalysis.confidence}% CONF</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-accent" />
                        <span className="font-bold text-text-primary uppercase tracking-tighter">{aiAnalysis.regime} Regime</span>
                      </div>
                      <p className="text-text-primary leading-relaxed italic">"{aiAnalysis.thesis}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-highlight/50 p-2 rounded border border-border">
                        <span className="text-[8px] font-bold text-text-tertiary uppercase block mb-1">Resistance</span>
                        {aiAnalysis.levels.resistance.map(l => <div key={l} className="font-mono text-negative font-bold">{formatPrice(l)}</div>)}
                      </div>
                      <div className="bg-surface-highlight/50 p-2 rounded border border-border">
                        <span className="text-[8px] font-bold text-text-tertiary uppercase block mb-1">Support</span>
                        {aiAnalysis.levels.support.map(l => <div key={l} className="font-mono text-positive font-bold">{formatPrice(l)}</div>)}
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-negative">
                        <ShieldAlert size={12} />
                        <span className="font-bold uppercase tracking-tighter">Invalidation</span>
                      </div>
                      <p className="text-text-secondary">{aiAnalysis.invalidation}</p>
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
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5 min-h-0">
          <div className="h-1/4 min-h-[120px]">
            <Widget title="Global Vitals">
              <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-2 h-full content-start">
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">VIX Index</div>
                  <div className={`text-sm font-bold mono-num ${vitals?.vix ? (vitals.vix > 25 ? 'text-negative' : 'text-positive') : 'text-text-primary'}`}>
                    {vitals?.vix ? vitals.vix.toFixed(2) : '---'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">DXY Dollar</div>
                  <div className="text-sm font-bold mono-num text-text-primary">{vitals?.dxy ? vitals.dxy.toFixed(2) : '---'}</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">10Y Yield</div>
                  <div className="text-sm font-bold mono-num text-text-primary">{vitals?.us10y ? `${vitals.us10y.toFixed(2)}%` : '---'}</div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">Liquidity</div>
                  <div className={`text-sm font-bold ${vitals?.liquidityLabel === 'High' ? 'text-positive' : vitals?.liquidityLabel === 'Normal' ? 'text-warning' : 'text-negative'}`}>
                    {vitals?.liquidityLabel || '---'}
                  </div>
                </div>
              </div>
            </Widget>
          </div>
          <div className="flex-1 min-h-[300px]">
            <Widget title="Intelligence Wire">
              <NewsFeed />
            </Widget>
          </div>
        </div>

        {/* --- COLUMN 3: MAIN CHART --- */}
        <div className="col-span-6 row-span-12 overflow-hidden relative min-h-0">
          <Widget 
            title={`${activeSymbol} • ${activeInstrument?.label || 'Select Asset'}`} 
            actions={
              <div className="flex items-center gap-3">
                <div className="flex bg-surface border border-border rounded p-0.5">
                  {TIMEFRAMES.map(tf => (
                    <button key={tf.value} onClick={() => setInterval(tf.value as any)} className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-colors ${interval === tf.value ? 'bg-accent/20 text-accent' : 'text-text-tertiary hover:text-text-primary'}`}>{tf.label}</button>
                  ))}
                </div>
                <div className="flex bg-surface border border-border rounded p-0.5">
                  <button onClick={() => setChartMode('standard')} className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-colors ${chartMode === 'standard' ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary'}`}>Standard</button>
                  {activeInstrument?.tradingViewSymbol && <button onClick={() => setChartMode('advanced')} className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-colors ${chartMode === 'advanced' ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary'}`}>Advanced</button>}
                </div>
              </div>
            }
          >
            <div className="w-full h-full bg-black relative">
              {activeSymbol && activeQuote && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-border/50 px-2 py-1 rounded-sm pointer-events-none">
                  <span className="text-xs font-bold text-text-primary">{formatPrice(activeQuote.price, activeInstrument?.assetType.toLowerCase() as any, activeInstrument?.decimals)}</span>
                  <span className={`text-[10px] font-mono ${activeQuote.change >= 0 ? 'text-positive' : 'text-negative'}`}>{formatPercent(activeQuote.changePercent)}</span>
                </div>
              )}
              {chartMode === 'standard' ? (
                loadingHistory ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10 gap-3">
                    <Loader2 size={24} className="animate-spin text-accent" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Syncing OHLC Data...</span>
                  </div>
                ) : historicalData.length > 0 ? (
                  <TradingChart data={historicalData} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-30">
                    <LineChart size={32} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Data Available</span>
                  </div>
                )
              ) : (
                <TradingViewChart instrumentId={activeSymbol} />
              )}
            </div>
          </Widget>
        </div>

      </div>
    </div>
  );
}