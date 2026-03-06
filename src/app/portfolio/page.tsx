'use client';

import { useState, useMemo } from 'react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import {
  Briefcase, Plus, X, TrendingUp, TrendingDown, AlertTriangle,
  PieChart, BarChart3, Shield, Loader2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
}

const DEFAULT_PORTFOLIO: Position[] = [
  { symbol: 'AAPL', shares: 50, avgCost: 178.50 },
  { symbol: 'NVDA', shares: 30, avgCost: 120.00 },
  { symbol: 'MSFT', shares: 25, avgCost: 415.00 },
  { symbol: 'GOOGL', shares: 20, avgCost: 165.00 },
  { symbol: 'AMZN', shares: 15, avgCost: 185.00 },
  { symbol: 'BTCUSD', shares: 0.5, avgCost: 62000.00 },
  { symbol: 'GOLD', shares: 10, avgCost: 2450.00 },
];

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>(DEFAULT_PORTFOLIO);
  const [showAdd, setShowAdd] = useState(false);
  const [newSym, setNewSym] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newCost, setNewCost] = useState('');

  const symbols = positions.map(p => p.symbol);
  const { data: marketData } = useMarketData(symbols);
  const loaded = Object.keys(marketData).length > 0;

  const analytics = useMemo(() => {
    if (!loaded) return null;

    let totalValue = 0;
    let totalCost = 0;
    let dayPnl = 0;
    const positionData: Array<Position & {
      price: number; value: number; cost: number; pnl: number; pnlPct: number;
      dayChange: number; weight: number;
    }> = [];

    for (const pos of positions) {
      const tick = marketData[pos.symbol];
      if (!tick) continue;
      const price = tick.price;
      const value = price * pos.shares;
      const cost = pos.avgCost * pos.shares;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      const dayChange = tick.change * pos.shares;
      totalValue += value;
      totalCost += cost;
      dayPnl += dayChange;
      positionData.push({ ...pos, price, value, cost, pnl, pnlPct, dayChange, weight: 0 });
    }

    positionData.forEach(p => { p.weight = totalValue > 0 ? (p.value / totalValue) * 100 : 0; });
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const dayPnlPct = totalCost > 0 ? (dayPnl / totalCost) * 100 : 0;

    const returns = positionData.map(p => p.pnlPct);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? avgReturn / stdDev : 0;
    const maxDrawdownPos = positionData.reduce((min, p) => p.pnlPct < min ? p.pnlPct : min, 0);

    const weights = positionData.map(p => p.weight);
    const hhi = weights.reduce((s, w) => s + (w / 100) ** 2, 0);
    const concentration = hhi;

    const var95 = totalValue * (stdDev / 100) * 1.65;

    return {
      positions: positionData,
      totalValue, totalCost, totalPnl, totalPnlPct,
      dayPnl, dayPnlPct,
      sharpe, stdDev, maxDrawdownPos, var95, concentration,
    };
  }, [marketData, positions, loaded]);

  const addPosition = () => {
    if (!newSym || !newShares || !newCost) return;
    setPositions(prev => [...prev, { symbol: newSym.toUpperCase(), shares: parseFloat(newShares), avgCost: parseFloat(newCost) }]);
    setNewSym(''); setNewShares(''); setNewCost(''); setShowAdd(false);
  };

  const removePosition = (sym: string) => {
    setPositions(prev => prev.filter(p => p.symbol !== sym));
  };

  if (!loaded || !analytics) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 size={24} className="animate-spin text-accent" />
        <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Loading Portfolio...</span>
      </div>
    );
  }

  const isPos = analytics.totalPnl >= 0;
  const isDayPos = analytics.dayPnl >= 0;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-surface p-3 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Briefcase size={14} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Portfolio Analytics</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Summary Cards */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <div className="text-[8px] text-text-tertiary font-bold uppercase">Total Value</div>
                <div className="text-sm font-mono font-bold text-text-primary">
                  ${analytics.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-text-tertiary font-bold uppercase">Total P&L</div>
                <div className={`text-sm font-mono font-bold flex items-center gap-0.5 ${isPos ? 'text-positive' : 'text-negative'}`}>
                  {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  ${Math.abs(analytics.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  <span className="text-[9px] opacity-70">({isPos ? '+' : ''}{analytics.totalPnlPct.toFixed(2)}%)</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-text-tertiary font-bold uppercase">Day P&L</div>
                <div className={`text-sm font-mono font-bold ${isDayPos ? 'text-positive' : 'text-negative'}`}>
                  {isDayPos ? '+' : ''}{analytics.dayPnlPct.toFixed(2)}%
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase rounded hover:bg-accent/20 transition-colors"
            >
              <Plus size={12} /> Add Position
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-3">
        {/* Risk Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { label: 'Sharpe Ratio', value: analytics.sharpe.toFixed(2), icon: TrendingUp, color: analytics.sharpe > 1 ? 'text-positive' : analytics.sharpe > 0 ? 'text-warning' : 'text-negative' },
            { label: 'Volatility', value: `${analytics.stdDev.toFixed(1)}%`, icon: BarChart3, color: 'text-cyan' },
            { label: 'VaR (95%)', value: `$${analytics.var95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Shield, color: 'text-warning' },
            { label: 'Max DD', value: `${analytics.maxDrawdownPos.toFixed(1)}%`, icon: AlertTriangle, color: 'text-negative' },
            { label: 'Positions', value: analytics.positions.length.toString(), icon: PieChart, color: 'text-accent' },
            { label: 'HHI Concentration', value: analytics.concentration.toFixed(3), icon: BarChart3, color: analytics.concentration > 0.25 ? 'text-warning' : 'text-positive' },
          ].map(m => (
            <div key={m.label} className="bg-surface border border-border rounded p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <m.icon size={11} className={m.color} />
                <span className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary">{m.label}</span>
              </div>
              <div className={`text-lg font-mono font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Allocation Bar */}
        <div className="bg-surface border border-border rounded p-3">
          <div className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Portfolio Allocation</div>
          <div className="flex h-5 rounded overflow-hidden gap-px">
            {analytics.positions.map((p, i) => {
              const colors = ['bg-accent', 'bg-cyan', 'bg-positive', 'bg-warning', 'bg-negative', 'bg-accent-bright', 'bg-cyan-muted'];
              return (
                <div
                  key={p.symbol}
                  className={`${colors[i % colors.length]} transition-all relative group`}
                  style={{ width: `${p.weight}%` }}
                  title={`${p.symbol}: ${p.weight.toFixed(1)}%`}
                >
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface-elevated border border-border rounded px-2 py-1 text-[9px] font-mono text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {p.symbol}: {p.weight.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {analytics.positions.map((p, i) => {
              const colors = ['bg-accent', 'bg-cyan', 'bg-positive', 'bg-warning', 'bg-negative', 'bg-accent-bright', 'bg-cyan-muted'];
              return (
                <div key={p.symbol} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${colors[i % colors.length]}`} />
                  <span className="text-[9px] font-bold text-text-secondary">{p.symbol}</span>
                  <span className="text-[9px] font-mono text-text-tertiary">{p.weight.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="text-right">Shares</th>
                <th className="text-right">Avg Cost</th>
                <th className="text-right">Price</th>
                <th className="text-right">Value</th>
                <th className="text-right">P&L</th>
                <th className="text-right">P&L %</th>
                <th className="text-right">Weight</th>
                <th className="text-center w-8"></th>
              </tr>
            </thead>
            <tbody>
              {analytics.positions.map(pos => {
                const pPos = pos.pnl >= 0;
                return (
                  <tr key={pos.symbol}>
                    <td>
                      <span className="font-bold text-text-primary">{pos.symbol}</span>
                    </td>
                    <td className="text-right font-mono text-text-secondary">{pos.shares}</td>
                    <td className="text-right font-mono text-text-secondary">${pos.avgCost.toFixed(2)}</td>
                    <td className="text-right font-mono font-bold text-text-primary">${pos.price.toFixed(2)}</td>
                    <td className="text-right font-mono text-text-primary">
                      ${pos.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right">
                      <span className={`font-mono font-bold ${pPos ? 'text-positive' : 'text-negative'}`}>
                        {pPos ? '+' : ''}${pos.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`badge ${pPos ? 'badge-positive' : 'badge-negative'}`}>
                        {pPos ? '+' : ''}{pos.pnlPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right font-mono text-text-tertiary">{pos.weight.toFixed(1)}%</td>
                    <td className="text-center">
                      <button
                        onClick={() => removePosition(pos.symbol)}
                        className="p-0.5 text-text-tertiary hover:text-negative transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Position Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary uppercase mb-4">Add Position</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Symbol</label>
                <input
                  value={newSym} onChange={e => setNewSym(e.target.value)}
                  placeholder="AAPL"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary uppercase font-mono mt-1 focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Shares</label>
                <input
                  type="number" value={newShares} onChange={e => setNewShares(e.target.value)}
                  placeholder="100"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary font-mono mt-1 focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Avg Cost ($)</label>
                <input
                  type="number" step="0.01" value={newCost} onChange={e => setNewCost(e.target.value)}
                  placeholder="150.00"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-text-primary font-mono mt-1 focus:border-accent outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={addPosition} className="flex-1 py-2 bg-accent text-white text-xs font-bold uppercase rounded hover:bg-accent-muted transition-colors">
                  Add
                </button>
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-surface-highlight text-text-secondary text-xs font-bold uppercase rounded border border-border hover:text-text-primary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
