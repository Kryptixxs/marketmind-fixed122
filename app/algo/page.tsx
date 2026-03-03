'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, Sparkles } from 'lucide-react';
import { runBacktest, StrategyResult, StrategyParams } from '@/lib/backtest';
import { Widget } from '@/components/Widget';
import { TradingChart } from '@/components/TradingChart';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { useSettings } from '@/context/SettingsContext';

export default function AlgoPage() {
  const { settings } = useSettings();
  const [params, setParams] = useState<StrategyParams>({
    fastMa: 9,
    slowMa: 21,
    stopLossPct: 2.0,
    takeProfitPct: 5.0
  });
  
  const [targetSymbol, setTargetSymbol] = useState('SPY');
  const [realData, setRealData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);

  const fetchRealHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMarketData(targetSymbol, '1d');
      if (data && data.history) {
        setRealData(data.history);
        setResult(runBacktest(data.history, params));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealHistory();
  }, []);

  const run = () => {
    if (realData.length > 0) {
      setResult(runBacktest(realData, params));
    } else {
      fetchRealHistory();
    }
  };

  const applyProfilePresets = () => {
    let f = 9, s = 21, sl = 2.0, tp = 5.0;
    
    if (settings.strategy === 'Scalper') { f = 5; s = 15; sl = 0.5; tp = 1.5; }
    else if (settings.strategy === 'Swing') { f = 10; s = 30; sl = 2.0; tp = 6.0; }
    else if (settings.strategy === 'Macro') { f = 50; s = 200; sl = 5.0; tp = 15.0; }
    
    if (settings.riskTolerance === 'Aggressive') { sl *= 1.5; tp *= 1.5; }
    else if (settings.riskTolerance === 'Conservative') { sl *= 0.5; tp *= 0.5; }

    setParams({
      fastMa: f,
      slowMa: s,
      stopLossPct: Number(sl.toFixed(2)),
      takeProfitPct: Number(tp.toFixed(2))
    });
  };

  return (
    <div className="h-full w-full bg-background p-2 flex flex-col lg:grid lg:grid-cols-12 gap-2 overflow-y-auto lg:overflow-hidden custom-scrollbar min-h-0">
      {/* Sidebar: Config */}
      <div className="lg:col-span-3 flex flex-col gap-2 shrink-0">
        <Widget title="Strategy Parameters">
          <div className="p-4 flex flex-col gap-4">
            
            <button 
              onClick={applyProfilePresets}
              className="w-full py-2 bg-accent/10 border border-accent/30 text-accent text-xs font-bold rounded flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors"
            >
              <Sparkles size={14} />
              Auto-Tune to {settings.strategy} Profile
            </button>

            <div className="h-[1px] bg-border my-1" />

            <div>
              <label className="text-xs font-bold text-text-secondary">Target Asset</label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="text" 
                  value={targetSymbol} 
                  onChange={e => setTargetSymbol(e.target.value.toUpperCase())}
                  className="flex-1 bg-surface border border-border rounded p-2 text-sm text-text-primary uppercase"
                />
                <button onClick={fetchRealHistory} className="px-3 bg-surface-highlight border border-border rounded text-xs font-bold hover:bg-white/10">Fetch</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Fast MA Period</label>
              <input 
                type="number" 
                value={params.fastMa} 
                onChange={e => setParams({...params, fastMa: parseInt(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1 text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Slow MA Period</label>
              <input 
                type="number" 
                value={params.slowMa} 
                onChange={e => setParams({...params, slowMa: parseInt(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1 text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Stop Loss %</label>
              <input 
                type="number" step="0.1"
                value={params.stopLossPct} 
                onChange={e => setParams({...params, stopLossPct: parseFloat(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1 text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Take Profit %</label>
              <input 
                type="number" step="0.1"
                value={params.takeProfitPct} 
                onChange={e => setParams({...params, takeProfitPct: parseFloat(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1 text-text-primary"
              />
            </div>
            
            <button 
              onClick={run}
              disabled={isLoading}
              className="mt-4 bg-accent text-accent-text font-bold py-2 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />} 
              {isLoading ? 'Fetching Reality...' : 'Run Backtest'}
            </button>
          </div>
        </Widget>
      </div>

      {/* Main: Results */}
      <div className="lg:col-span-9 flex flex-col gap-2 shrink-0 min-h-[600px] lg:h-full">
        <div className="h-1/2 min-h-[300px]">
           <Widget title={`Equity Curve: ${targetSymbol} (${realData.length} Real Bars)`}>
             {result ? (
               <TradingChart data={result.equityCurve.map(p => ({
                 time: p.time / 1000,
                 open: p.value, high: p.value, low: p.value, close: p.value
               }))} />
             ) : (
               <div className="flex items-center justify-center h-full text-text-tertiary">
                 Press Run to backtest strategy
               </div>
             )}
           </Widget>
        </div>
        <div className="h-1/2 min-h-[300px]">
           <Widget title="Performance Metrics (Real Data)">
             {result ? (
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 h-full content-center">
                  <MetricCard label="Net Profit" value={`${result.netProfit.toFixed(2)}%`} color={result.netProfit > 0 ? 'text-positive' : 'text-negative'} />
                  <MetricCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} />
                  <MetricCard label="Max Drawdown" value={`-${result.maxDrawdown.toFixed(2)}%`} color="text-negative" />
                  <MetricCard label="Total Trades" value={result.totalTrades.toString()} />
               </div>
             ) : null}
           </Widget>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = 'text-text-primary' }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-surface border border-border rounded p-4 text-center flex flex-col justify-center">
      <div className="text-[10px] text-text-tertiary uppercase font-bold mb-2 tracking-wider">{label}</div>
      <div className={`text-2xl lg:text-3xl font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}