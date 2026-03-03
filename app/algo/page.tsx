'use client';

import { useState, useEffect } from 'react';
import { Play, RotateCcw, Save, Settings, Activity } from 'lucide-react';
import { runBacktest, StrategyResult, StrategyParams } from '@/lib/backtest';
import { Widget } from '@/components/Widget';
import { TradingChart } from '@/components/TradingChart';

// Generate dummy price data for backtest
const MOCK_DATA = Array.from({ length: 500 }, (_, i) => {
  const time = Math.floor(Date.now() / 1000) - (500 - i) * 86400;
  return {
    time,
    open: 100 + Math.sin(i/20) * 10 + Math.random() * 2,
    high: 0, low: 0, close: 0, volume: 1000 // Filled below
  };
}).map(b => ({
  ...b,
  high: b.open + Math.random() * 2,
  low: b.open - Math.random() * 2,
  close: b.open + (Math.random() - 0.5) * 2
}));

export default function AlgoPage() {
  const [params, setParams] = useState<StrategyParams>({
    fastMa: 9,
    slowMa: 21,
    stopLossPct: 2.0,
    takeProfitPct: 5.0
  });
  
  const [result, setResult] = useState<StrategyResult | null>(null);

  const run = () => {
    const res = runBacktest(MOCK_DATA, params);
    setResult(res);
  };

  return (
    <div className="h-full w-full bg-background p-2 grid grid-cols-12 gap-2">
      {/* Sidebar: Config */}
      <div className="col-span-3 flex flex-col gap-2 h-full">
        <Widget title="Strategy Parameters">
          <div className="p-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary">Fast MA Period</label>
              <input 
                type="number" 
                value={params.fastMa} 
                onChange={e => setParams({...params, fastMa: parseInt(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Slow MA Period</label>
              <input 
                type="number" 
                value={params.slowMa} 
                onChange={e => setParams({...params, slowMa: parseInt(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Stop Loss %</label>
              <input 
                type="number" step="0.1"
                value={params.stopLossPct} 
                onChange={e => setParams({...params, stopLossPct: parseFloat(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Take Profit %</label>
              <input 
                type="number" step="0.1"
                value={params.takeProfitPct} 
                onChange={e => setParams({...params, takeProfitPct: parseFloat(e.target.value)})}
                className="w-full bg-surface border border-border rounded p-2 text-sm mt-1"
              />
            </div>
            
            <button 
              onClick={run}
              className="mt-4 bg-accent text-accent-text font-bold py-2 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Play size={16} fill="currentColor" /> Run Backtest
            </button>
          </div>
        </Widget>
      </div>

      {/* Main: Results */}
      <div className="col-span-9 flex flex-col gap-2 h-full">
        <div className="h-1/2">
           <Widget title="Equity Curve">
             {result ? (
               <TradingChart data={result.equityCurve.map(p => ({
                 time: p.time,
                 open: p.value, high: p.value, low: p.value, close: p.value
               }))} />
             ) : (
               <div className="flex items-center justify-center h-full text-text-tertiary">
                 Press Run to backtest strategy
               </div>
             )}
           </Widget>
        </div>
        <div className="h-1/2">
           <Widget title="Performance Metrics">
             {result ? (
               <div className="grid grid-cols-4 gap-4 p-4 h-full content-center">
                  <MetricCard label="Net Profit" value={`${result.netProfit.toFixed(2)}%`} color={result.netProfit > 0 ? 'text-positive' : 'text-negative'} />
                  <MetricCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} />
                  <MetricCard label="Max Drawdown" value={`-${result.maxDrawdown.toFixed(2)}%`} color="text-negative" />
                  <MetricCard label="Total Trades" value={result.totalTrades.toString()} />
                  <MetricCard label="Sharpe Ratio" value={result.sharpeRatio.toString()} />
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
    <div className="bg-surface border border-border rounded p-4 text-center">
      <div className="text-xs text-text-tertiary uppercase font-bold mb-2">{label}</div>
      <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}