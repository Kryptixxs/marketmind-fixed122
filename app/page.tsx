'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi, Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, Plus, X, Search } from 'lucide-react';
import { analyzeMarket } from '@/app/actions/analyzeMarket';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { formatPrice, formatPercent, formatInt } from '@/lib/format';
import { useWatchlistStore } from '@/store/useWatchlistStore';

// Metadata lookup for common symbols
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
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  
  const allRequiredSymbols = [...symbols, ...VITALS_SYMBOLS];
  const { data: marketData } = useMarketData(allRequiredSymbols);
  
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
        const label = SYMBOL_METADATA[activeSymbol]?.label || activeSymbol;
        const result = await analyzeMarket(activeSymbol, label, data.price, data.changePercent);
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol) {
      addSymbol(newSymbol);
      setNewSymbol('');
      setIsAdding(false);
    }
  };

  // Vitals Data
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
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-text-tertiary hover:text-accent transition-colors"
                >
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
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (confirm(`Remove ${sym} from watchlist?`)) removeSymbol(sym);
                      }}
                      className={`flex justify-between items-center px-2 py-1.5 border-b border-border/30 cursor-pointer hover:bg-surface-highlight transition-colors group ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-text-primary">{sym}</span>
                        <span className="text-[8px] text-text-tertiary uppercase tracking-tighter">{meta.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono font-bold text-text-primary">
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
          
          <div className="h-1/3 min-h-0">
            <Widget title="AI Intelligence">
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
                      <span className={aiAnalysis.strength > 50 ? 'text-positive' : 'text-negative'}>{formatInt(aiAnalysis.strength)}%</span>
                    </div>
                    <p className="text-text-primary leading-snug line-clamp-4">
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
        <div className="col-span-3 row-span-12 flex flex-col gap-0.5">
          <div className="h-1/4 min-h-0">
            <Widget title="Global Vitals">
              <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-2 h-full content-start">
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">VIX Index</div>
                  <div className={`text-sm font-bold ${vix ? (vix.change >= 0 ? 'text-negative' : 'text-positive') : 'text-text-primary'}`}>
                    {vix ? formatPrice(vix.price, 'index') : '---'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">DXY Dollar</div>
                  <div className={`text-sm font-bold ${dxy ? (dxy.change >= 0 ? 'text-positive' : 'text-negative') : 'text-text-primary'}`}>
                    {dxy ? formatPrice(dxy.price, 'index') : '---'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-text-tertiary uppercase mb-0.5">10Y Yield</div>
                  <div className={`text-sm font-bold ${tnx ? (tnx.change >= 0 ? 'text-negative' : 'text-positive') : 'text-text-primary'}`}>
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
              <div className="flex items-center gap-2 text-[8px]">
                <span className="text-positive flex items-center gap-1"><Wifi size={8}/> Live</span>
                <span className="px-1 py-0.5 bg-surface border border-border rounded text-text-secondary uppercase">{marketData[activeSymbol]?.marketState || 'REGULAR'}</span>
              </div>
            }
          >
            <div className="w-full h-full bg-black">
              <TradingViewChart symbol={activeSymbol} />
            </div>
          </Widget>
        </div>

      </div>
    </div>
  );
}