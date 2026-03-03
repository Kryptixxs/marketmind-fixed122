'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Search, Table, TrendingUp, Activity, Loader2, ChevronDown } from 'lucide-react';
import { runBacktest, StrategyResult, StrategyParams, Bar } from '@/lib/backtest';
import { Widget } from '@/components/Widget';
import { TradingChart } from '@/components/TradingChart';
import { fetchHistoricalBars } from '@/app/actions/fetchHistoricalBars';

interface SweepResult {
  fast: number;
  slow: number;
  profit: number;
  sharpe: number;
}

export default function AlgoPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [params, setParams] = useState<StrategyParams>({
    fastMa: 9,
    slowMa: 21,
    stopLossPct: 2.0,
    takeProfitPct: 5.0
  });
  
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [sweepResults, setSweepResults] = useState<SweepResult[]>([]);
  const [isSweeping, setIsSweeping] = useState(false);

  const loadData = useCallback(async (sym: string) => {
    setLoading(true);
    const data = await fetchHistoricalBars(sym, '1y');
    setBars(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(symbol);
  }, [symbol, loadData]);

  const run = () => {
    if (bars.length === 0) return;
    const res = runBacktest(bars, params);
    setResult(res);
  };

  const runSweep = () => {
    if (bars.length === 0) return;
    setIsSweeping(true);
    const results: SweepResult[] = [];
    
    // Grid search: Fast (5-20), Slow (25-60)
    for (let f = 5; f <= 20; f += 5) {
      for (let s = 25; s <= 60; s += 10) {
        const res = runBacktest(bars, { ...params, fastMa: f, slowMa: s });
        results.push({ fast: f, slow: s, profit: res.netProfit, sharpe: res.sharpeRatio });
      }
    }
    
    setSweepResults(results.sort((a, b) => b.profit - a.profit));
    setIsSweeping(false);
  };

  return (
    <div className="h-full w-full bg-background p-1 grid grid-cols-12 gap-1 overflow-hidden">
      {/* Sidebar: Config */}
      <div className="col-span-3 flex flex-col gap-1 h-full overflow-y-auto custom-scrollbar">
        <Widget title="Strategy Config">
          <div className="p-3 flex flex-col gap-4">
            <div className="relative">
              <label className="text-[9px] font-bold text-text-tertiary uppercase">Asset Symbol</label>
              <div 
                className="flex items-center justify-between bg-surface border border-border rounded p-2 mt-1 cursor-pointer hover:border-accent/50"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <span className="text-sm font-bold text-text-primary">{symbol}</span>
                <ChevronDown size={14} className="text-text-tertiary" />
              </div>
              {isSearchOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface-highlight border border-border rounded shadow-2xl z-50 p-2">
                  <div className="flex items-center gap-2 bg-background border border-border px-2 rounded mb-2">
                    <Search size={12} className="text-text-tertiary" />
                    <input 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setSymbol(searchQuery.toUpperCase());
                          setIsSearchOpen(false);
                        }
                      }}
                      placeholder="Ticker..."
                      className="flex-1 bg-transparent border-none outline-none text-xs py-1.5 text-text-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase">Fast MA</label>
                <input type="number" value={params.fastMa} onChange={e => setParams({...params, fastMa: parseInt(e.target.value)})} className="w-full bg-surface border border-border rounded p-1.5 text-xs mt-1" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase">Slow MA</label>
                <input type="number" value={params.slowMa} onChange={e => setParams({...params, slowMa: parseInt(e.target.value)})} className="w-full bg-surface border border-border rounded p-1.5 text-xs mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase">Stop Loss %</label>
                <input type="number" step="0.1" value={params.stopLossPct} onChange={e => setParams({...params, stopLossPct: parseFloat(e.target.value)})} className="w-full bg-surface border border-border rounded p-1.5 text-xs mt-1" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase">Take Profit %</label>
                <input type="number" step="0.1" value={params.takeProfitPct} onChange={e => setParams({...params, takeProfitPct: parseFloat(e.target.value)})} className="w-full bg-surface border border-border rounded p-1.5 text-xs mt-1" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={run}
                disabled={loading}
                className="bg-accent text-accent-text font-bold py-2 rounded text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />} Run Backtest
              </button>
              <button 
                onClick={runSweep}
                disabled={loading || isSweeping}
                className="bg-surface-highlight border border-border text-text-primary font-bold py-2 rounded text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5"
              >
                {isSweeping ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />} Parameter Sweep
              </button>
            </div>
          </div>
        </Widget>

        {sweepResults.length > 0 && (
          <Widget title="Optimization Results">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-surface-highlight text-text-tertiary uppercase font-bold">
                  <tr>
                    <th className="p-2">MA (F/S)</th>
                    <th className="p-2">Profit</th>
                    <th className="p-2">Sharpe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sweepResults.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-white/5 cursor-pointer" onClick={() => setParams({...params, fastMa: r.fast, slowMa: r.slow})}>
                      <td className="p-2 font-mono">{r.fast}/{r.slow}</td>
                      <td className={`p-2 font-mono ${r.profit > 0 ? 'text-positive' : 'text-negative'}`}>{r.profit.toFixed(1)}%</td>
                      <td className="p-2 font-mono">{r.sharpe.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Widget>
        )}
      </div>

      {/* Main: Results */}
      <div className="col-span-9 flex flex-col gap-1 h-full overflow-hidden">
        <div className="h-[40%] shrink-0">
           <Widget title={`Equity Curve // ${symbol}`}>
             {result ? (
               <TradingChart data={result.equityCurve.map(p => ({
                 time: p.time,
                 open: p.value, high: p.value, low: p.value, close: p.value
               }))} />
             ) : (
               <div className="flex items-center justify-center h-full text-text-tertiary uppercase text-[10px] tracking-widest">
                 {loading ? <Loader2 size={24} className="animate-spin" /> : "Select asset and run backtest"}
               </div>
             )}
           </Widget>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-1 min-h-0">
          <div className="col-span-4 h-full">
            <Widget title="Performance Metrics">
              {result ? (
                <div className="flex flex-col gap-1 p-2 h-full overflow-y-auto">
                  <MetricCard label="Net Profit" value={`${result.netProfit.toFixed(2)}%`} color={result.netProfit > 0 ? 'text-positive' : 'text-negative'} />
                  <MetricCard label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} color={result.sharpeRatio > 1 ? 'text-accent' : 'text-text-primary'} />
                  <MetricCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} />
                  <MetricCard label="Max Drawdown" value={`-${result.maxDrawdown.toFixed(2)}%`} color="text-negative" />
                  <MetricCard label="Total Trades" value={result.totalTrades.toString()} />
                </div>
              ) : null}
            </Widget>
          </div>
          
          <div className="col-span-8 h-full">
            <Widget title="Trade Ledger">
              {result ? (
                <div className="h-full overflow-auto custom-scrollbar">
                  <table className="w-full text-[9px] text-left">
                    <thead className="bg-surface-highlight text-text-tertiary uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2">Entry</th>
                        <th className="p-2">Exit</th>
                        <th className="p-2">Price (In/Out)</th>
                        <th className="p-2 text-right">PnL %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.trades.map((t, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-2 text-text-secondary">{new Date(t.entryTime * 1000).toLocaleDateString()}</td>
                          <td className="p-2 text-text-secondary">{new Date(t.exitTime * 1000).toLocaleDateString()}</td>
                          <td className="p-2 font-mono">{t.entryPrice.toFixed(2)} → {t.exitPrice.toFixed(2)}</td>
                          <td className={`p-2 text-right font-mono font-bold ${t.pnlPercent > 0 ? 'text-positive' : 'text-negative'}`}>
                            {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-text-tertiary uppercase text-[8px]">No trades executed</div>
              )}
            </Widget>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = 'text-text-primary' }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-surface border border-border rounded p-2 flex justify-between items-center">
      <div className="text-[9px] text-text-tertiary uppercase font-bold">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}