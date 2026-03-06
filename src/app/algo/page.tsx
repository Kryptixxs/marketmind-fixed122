'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, Sparkles, Cpu, BarChart3, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { runBacktest, StrategyResult, StrategyParams } from '@/lib/backtest';
import { Widget } from '@/components/ui/Widget';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { useSettings } from '@/services/context/SettingsContext';

export default function AlgoPage() {
  const { settings } = useSettings();
  const [params, setParams] = useState<StrategyParams>({
    fastMa: 9, slowMa: 21, stopLossPct: 2.0, takeProfitPct: 5.0,
  });
  const [targetSymbol, setTargetSymbol] = useState('SPY');
  const [realData, setRealData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);

  const fetchRealHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMarketData(targetSymbol, '1d');
      if (data?.history?.length) {
        const bars = data.history
          .map(h => ({ time: h.timestamp, open: h.open, high: h.high, low: h.low, close: h.close, volume: h.volume }))
          .sort((a, b) => a.time - b.time)
          .filter((b, i, a) => i === 0 || b.time > a[i - 1].time);
        setRealData(bars);
        setResult(runBacktest(bars, params));
      } else {
        setRealData([]);
        setResult(null);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchRealHistory(); }, []);

  const run = () => {
    if (realData.length > 0) setResult(runBacktest(realData, params));
    else fetchRealHistory();
  };

  const applyProfilePresets = () => {
    let f = 9, s = 21, sl = 2.0, tp = 5.0;
    if (settings.strategy === 'Scalper') { f = 5; s = 15; sl = 0.5; tp = 1.5; }
    else if (settings.strategy === 'Swing') { f = 10; s = 30; sl = 2.0; tp = 6.0; }
    else if (settings.strategy === 'Macro') { f = 50; s = 200; sl = 5.0; tp = 15.0; }
    if (settings.riskTolerance === 'Aggressive') { sl *= 1.5; tp *= 1.5; }
    else if (settings.riskTolerance === 'Conservative') { sl *= 0.5; tp *= 0.5; }
    setParams({ fastMa: f, slowMa: s, stopLossPct: Number(sl.toFixed(2)), takeProfitPct: Number(tp.toFixed(2)) });
  };

  return (
    <div className="h-full w-full bg-background flex flex-col lg:flex-row gap-0 overflow-hidden">
      {/* Sidebar Config */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border bg-surface flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
        <div className="panel-header shrink-0 flex items-center gap-2">
          <Cpu size={12} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Strategy Config</span>
        </div>
        <div className="p-3 flex flex-col gap-3">
          <button
            onClick={applyProfilePresets}
            className="w-full py-2 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold rounded flex items-center justify-center gap-1.5 hover:bg-accent/20 transition-colors"
          >
            <Sparkles size={12} /> Auto-Tune to {settings.strategy} Profile
          </button>

          <div className="h-px bg-border" />

          <div>
            <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Target Asset</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text" value={targetSymbol}
                onChange={e => setTargetSymbol(e.target.value.toUpperCase())}
                className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-text-primary uppercase font-mono focus:border-accent outline-none"
              />
              <button onClick={fetchRealHistory} className="px-3 bg-surface-highlight border border-border rounded text-[10px] font-bold hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors">
                Fetch
              </button>
            </div>
          </div>

          {[
            { label: 'Fast MA Period', key: 'fastMa', type: 'number' },
            { label: 'Slow MA Period', key: 'slowMa', type: 'number' },
            { label: 'Stop Loss %', key: 'stopLossPct', type: 'number', step: '0.1' },
            { label: 'Take Profit %', key: 'takeProfitPct', type: 'number', step: '0.1' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">{field.label}</label>
              <input
                type={field.type}
                step={field.step}
                value={(params as any)[field.key]}
                onChange={e => setParams({ ...params, [field.key]: field.type === 'number' ? (field.step ? parseFloat(e.target.value) : parseInt(e.target.value)) : e.target.value })}
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono mt-1 focus:border-accent outline-none"
              />
            </div>
          ))}

          <button
            onClick={run}
            disabled={isLoading}
            className="mt-2 bg-accent text-white font-bold py-2 rounded flex items-center justify-center gap-2 text-xs hover:bg-accent-muted transition-colors disabled:opacity-50 uppercase tracking-wider"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            {isLoading ? 'Loading...' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Equity Curve */}
        <div className="flex-1 min-h-[250px]">
          <Widget title={`Equity Curve — ${targetSymbol} (${realData.length} bars)`} accent="blue">
            {result && result.equityCurve.length > 0 ? (
              <TradingChart data={result.equityCurve.map(p => ({
                time: Math.floor(p.time / 1000),
                open: p.value, high: p.value, low: p.value, close: p.value,
              }))} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary text-[10px] uppercase tracking-widest">
                {isLoading ? 'Downloading Historical Data...' : 'Press Run to backtest strategy'}
              </div>
            )}
          </Widget>
        </div>

        {/* Metrics */}
        {result && (
          <div className="border-t border-border bg-surface p-3 shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Net Profit', value: `${result.netProfit.toFixed(2)}%`, icon: TrendingUp, color: result.netProfit > 0 ? 'text-positive' : 'text-negative' },
                { label: 'Win Rate', value: `${result.winRate.toFixed(1)}%`, icon: Target, color: result.winRate > 50 ? 'text-positive' : 'text-warning' },
                { label: 'Max Drawdown', value: `-${result.maxDrawdown.toFixed(2)}%`, icon: AlertTriangle, color: 'text-negative' },
                { label: 'Total Trades', value: result.totalTrades.toString(), icon: BarChart3, color: 'text-cyan' },
              ].map(m => (
                <div key={m.label} className="bg-background border border-border rounded p-3 flex items-center gap-3">
                  <m.icon size={16} className={m.color} />
                  <div>
                    <div className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider">{m.label}</div>
                    <div className={`text-lg font-mono font-bold ${m.color}`}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
