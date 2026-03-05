'use client';

import { useState, useEffect, useMemo } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { Shield, TrendingDown, AlertTriangle, Activity, BarChart3 } from 'lucide-react';

// Simulated portfolio positions for risk analysis
const POSITIONS = [
    { symbol: 'NAS100', side: 'LONG', quantity: 10, avgEntry: 18500, allocation: 0.25 },
    { symbol: 'SPX500', side: 'LONG', quantity: 5, avgEntry: 5150, allocation: 0.20 },
    { symbol: 'GOLD', side: 'LONG', quantity: 50, avgEntry: 2050, allocation: 0.15 },
    { symbol: 'CRUDE', side: 'SHORT', quantity: 100, avgEntry: 78.50, allocation: 0.10 },
    { symbol: 'EURUSD', side: 'SHORT', quantity: 100000, avgEntry: 1.0850, allocation: 0.15 },
    { symbol: 'BTCUSD', side: 'LONG', quantity: 2, avgEntry: 62000, allocation: 0.15 },
];

const RISK_LIMITS = { maxDrawdown: 5, maxVaR: 2.5, maxExposure: 100, maxConcentration: 30 };

function MetricCard({ label, value, subValue, color = 'text-text-primary', icon: Icon }: { label: string; value: string; subValue?: string; color?: string; icon?: any }) {
    return (
        <div className="p-4 bg-surface border border-border">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
                {Icon && <Icon size={14} className="text-text-muted" />}
            </div>
            <div className={`text-xl font-black tabular-nums tracking-tight ${color}`}>{value}</div>
            {subValue && <div className="text-[10px] text-text-tertiary mt-1 tabular-nums">{subValue}</div>}
        </div>
    );
}

function RiskGauge({ label, value, limit, unit = '%' }: { label: string; value: number; limit: number; unit?: string }) {
    const pct = Math.min((value / limit) * 100, 100);
    const isBreached = value > limit;
    const color = isBreached ? 'bg-negative' : pct > 75 ? 'bg-warning' : 'bg-positive';

    return (
        <div className="p-3 bg-surface border border-border">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
                <span className={`text-[10px] font-bold tabular-nums ${isBreached ? 'text-negative' : 'text-text-primary'}`}>
                    {value.toFixed(2)}{unit} / {limit}{unit}
                </span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            {isBreached && (
                <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-negative uppercase">
                    <AlertTriangle size={10} /> LIMIT BREACHED
                </div>
            )}
        </div>
    );
}

export default function RiskPage() {
    const symbols = POSITIONS.map(p => p.symbol);
    const { data: marketData } = useMarketData(symbols);

    // Calculate real-time P&L and risk metrics
    const riskMetrics = useMemo(() => {
        let totalPnl = 0;
        let totalExposure = 0;
        let maxLoss = 0;

        const positionPnls = POSITIONS.map(pos => {
            const tick = marketData[pos.symbol];
            if (!tick) return { ...pos, pnl: 0, pnlPct: 0, currentPrice: pos.avgEntry, exposure: 0 };

            const direction = pos.side === 'LONG' ? 1 : -1;
            const pnl = (tick.price - pos.avgEntry) * pos.quantity * direction;
            const pnlPct = ((tick.price - pos.avgEntry) / pos.avgEntry) * 100 * direction;
            const exposure = tick.price * pos.quantity;

            totalPnl += pnl;
            totalExposure += Math.abs(exposure);
            maxLoss += Math.abs(pnl) * 0.5; // Simplified VaR proxy

            return { ...pos, pnl, pnlPct, currentPrice: tick.price, exposure };
        });

        // Correlation risk (simplified)
        const longExposure = positionPnls.filter(p => p.side === 'LONG').reduce((s, p) => s + Math.abs(p.exposure), 0);
        const shortExposure = positionPnls.filter(p => p.side === 'SHORT').reduce((s, p) => s + Math.abs(p.exposure), 0);
        const netExposure = longExposure - shortExposure;
        const grossExposure = longExposure + shortExposure;

        // Max concentration
        const maxConcentration = Math.max(...POSITIONS.map(p => p.allocation * 100));

        // Simulated drawdown (from peak)
        const drawdown = totalPnl < 0 ? Math.abs(totalPnl / grossExposure) * 100 : 0;

        // 1-day VaR (95%) — simplified historical simulation
        const var95 = grossExposure * 0.018; // ~1.8% daily VaR proxy
        const varPct = (var95 / grossExposure) * 100;

        return { totalPnl, grossExposure, netExposure, longExposure, shortExposure, drawdown, var95, varPct, maxConcentration, positionPnls };
    }, [marketData]);

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            <TerminalCommandBar />

            {/* Header */}
            <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
                <Shield size={16} className="text-accent" />
                <h1 className="text-[11px] font-bold uppercase tracking-widest text-text-primary">Risk Management Console</h1>
                <div className="h-4 w-px bg-border" />
                <span className="bb-status-live">REAL-TIME</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Top Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    <MetricCard
                        label="Total P&L"
                        value={`${riskMetrics.totalPnl >= 0 ? '+' : ''}$${riskMetrics.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        color={riskMetrics.totalPnl >= 0 ? 'text-positive' : 'text-negative'}
                        icon={TrendingDown}
                    />
                    <MetricCard
                        label="Gross Exposure"
                        value={`$${(riskMetrics.grossExposure / 1000000).toFixed(1)}M`}
                        subValue={`Net: $${(riskMetrics.netExposure / 1000000).toFixed(1)}M`}
                        icon={BarChart3}
                    />
                    <MetricCard
                        label="Long Exposure"
                        value={`$${(riskMetrics.longExposure / 1000000).toFixed(1)}M`}
                        color="text-positive"
                    />
                    <MetricCard
                        label="Short Exposure"
                        value={`$${(riskMetrics.shortExposure / 1000000).toFixed(1)}M`}
                        color="text-negative"
                    />
                    <MetricCard
                        label="1D VaR (95%)"
                        value={`$${(riskMetrics.var95 / 1000).toFixed(0)}K`}
                        subValue={`${riskMetrics.varPct.toFixed(2)}% of Gross`}
                        color="text-warning"
                        icon={AlertTriangle}
                    />
                    <MetricCard
                        label="Drawdown"
                        value={`${riskMetrics.drawdown.toFixed(2)}%`}
                        subValue={`Limit: ${RISK_LIMITS.maxDrawdown}%`}
                        color={riskMetrics.drawdown > RISK_LIMITS.maxDrawdown ? 'text-negative' : 'text-text-primary'}
                    />
                </div>

                {/* Risk Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <RiskGauge label="Max Drawdown" value={riskMetrics.drawdown} limit={RISK_LIMITS.maxDrawdown} />
                    <RiskGauge label="Value at Risk" value={riskMetrics.varPct} limit={RISK_LIMITS.maxVaR} />
                    <RiskGauge label="Gross Exposure %" value={100} limit={RISK_LIMITS.maxExposure} />
                    <RiskGauge label="Max Concentration" value={riskMetrics.maxConcentration} limit={RISK_LIMITS.maxConcentration} />
                </div>

                {/* Position-Level Risk */}
                <TerminalPanel title="Position Risk Matrix" fnKey="F1">
                    <div className="overflow-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Side</th>
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Avg Entry</th>
                                    <th className="text-right">Current</th>
                                    <th className="text-right">P&L</th>
                                    <th className="text-right">P&L %</th>
                                    <th className="text-right">Exposure</th>
                                    <th className="text-right">Alloc %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskMetrics.positionPnls.map(pos => (
                                    <tr key={pos.symbol}>
                                        <td className="font-bold text-accent">{pos.symbol}</td>
                                        <td>
                                            <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${pos.side === 'LONG' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                                                {pos.side}
                                            </span>
                                        </td>
                                        <td className="text-right tabular-nums">{pos.quantity.toLocaleString()}</td>
                                        <td className="text-right tabular-nums">{pos.avgEntry.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="text-right tabular-nums">{pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className={`text-right tabular-nums font-bold ${pos.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                                            {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className={`text-right tabular-nums font-bold ${pos.pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                                            {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                                        </td>
                                        <td className="text-right tabular-nums">${(Math.abs(pos.exposure) / 1000).toFixed(0)}K</td>
                                        <td className="text-right tabular-nums">{(pos.allocation * 100).toFixed(0)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TerminalPanel>

                {/* Correlation Heatmap */}
                <TerminalPanel title="Asset Correlation Matrix" fnKey="F2">
                    <div className="p-3">
                        <div className="overflow-auto">
                            <table className="w-full text-[9px] font-mono">
                                <thead>
                                    <tr>
                                        <th className="p-1.5 text-left text-text-tertiary"></th>
                                        {symbols.map(s => <th key={s} className="p-1.5 text-center text-text-tertiary font-bold">{s}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {symbols.map((row, ri) => (
                                        <tr key={row}>
                                            <td className="p-1.5 font-bold text-text-secondary">{row}</td>
                                            {symbols.map((col, ci) => {
                                                // Simulated correlation values
                                                const corr = ri === ci ? 1.0 :
                                                    (ri + ci) % 3 === 0 ? 0.85 :
                                                        (ri + ci) % 2 === 0 ? 0.42 :
                                                            -0.31 + (ri * 0.1);
                                                const absCorr = Math.abs(corr);
                                                const bg = corr === 1 ? 'bg-accent/20' :
                                                    corr > 0.7 ? 'bg-negative/20' :
                                                        corr > 0.3 ? 'bg-warning/10' :
                                                            corr < -0.3 ? 'bg-positive/10' : 'bg-transparent';
                                                return (
                                                    <td key={col} className={`p-1.5 text-center tabular-nums ${bg} ${corr === 1 ? 'text-accent font-bold' : 'text-text-secondary'}`}>
                                                        {corr.toFixed(2)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-[8px] text-text-muted uppercase tracking-wider">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-negative/30" /> High Corr (&gt;0.7)</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-warning/20" /> Moderate</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-positive/20" /> Negative Corr</span>
                        </div>
                    </div>
                </TerminalPanel>
            </div>
        </div>
    );
}
