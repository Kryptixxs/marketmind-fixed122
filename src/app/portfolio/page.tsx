'use client';

import { useState, useMemo } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { Briefcase, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';

// Simulated portfolio holdings
const HOLDINGS = [
    { symbol: 'NAS100', name: 'Nasdaq 100', sector: 'Index — Tech-Heavy', quantity: 10, avgCost: 18500, weight: 25 },
    { symbol: 'SPX500', name: 'S&P 500', sector: 'Index — Broad Market', quantity: 5, avgCost: 5150, weight: 20 },
    { symbol: 'GOLD', name: 'Gold Futures', sector: 'Commodities — Precious', quantity: 50, avgCost: 2050, weight: 15 },
    { symbol: 'CRUDE', name: 'Crude Oil WTI', sector: 'Commodities — Energy', quantity: 100, avgCost: 78.50, weight: 10 },
    { symbol: 'EURUSD', name: 'Euro / US Dollar', sector: 'Forex — Majors', quantity: 100000, avgCost: 1.085, weight: 15 },
    { symbol: 'BTCUSD', name: 'Bitcoin', sector: 'Digital Assets', quantity: 2, avgCost: 62000, weight: 15 },
];

const PERFORMANCE_METRICS = {
    sharpeRatio: 1.87,
    sortinoRatio: 2.34,
    maxDrawdown: -4.2,
    calmarRatio: 3.12,
    winRate: 67.3,
    avgWin: 2.4,
    avgLoss: -1.1,
    profitFactor: 2.18,
    beta: 0.72,
    alpha: 8.3,
    treynorRatio: 11.5,
    informationRatio: 0.94,
};

const MONTHLY_RETURNS = [
    { month: 'Jul', return: 3.2 }, { month: 'Aug', return: -1.4 }, { month: 'Sep', return: 2.8 },
    { month: 'Oct', return: -0.7 }, { month: 'Nov', return: 4.1 }, { month: 'Dec', return: 1.9 },
    { month: 'Jan', return: 2.5 }, { month: 'Feb', return: 3.7 }, { month: 'Mar', return: -0.3 },
];

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
            <span className={`text-[11px] font-bold tabular-nums ${color || 'text-text-primary'}`}>{value}</span>
        </div>
    );
}

export default function PortfolioPage() {
    const symbols = HOLDINGS.map(h => h.symbol);
    const { data: marketData } = useMarketData(symbols);
    const [view, setView] = useState<'holdings' | 'performance'>('holdings');

    const portfolioData = useMemo(() => {
        let totalValue = 0;
        let totalCost = 0;

        const enriched = HOLDINGS.map(h => {
            const tick = marketData[h.symbol];
            const currentPrice = tick?.price || h.avgCost;
            const marketValue = currentPrice * h.quantity;
            const costBasis = h.avgCost * h.quantity;
            const pnl = marketValue - costBasis;
            const pnlPct = ((currentPrice - h.avgCost) / h.avgCost) * 100;
            const dayChange = tick?.changePercent || 0;

            totalValue += marketValue;
            totalCost += costBasis;

            return { ...h, currentPrice, marketValue, costBasis, pnl, pnlPct, dayChange };
        });

        const totalPnl = totalValue - totalCost;
        const totalPnlPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
        const dayPnl = enriched.reduce((s, h) => s + (h.marketValue * h.dayChange / 100), 0);

        // Sector allocation
        const sectors = new Map<string, number>();
        enriched.forEach(h => {
            const sector = h.sector.split(' — ')[0];
            sectors.set(sector, (sectors.get(sector) || 0) + h.weight);
        });

        return { holdings: enriched, totalValue, totalCost, totalPnl, totalPnlPct, dayPnl, sectors };
    }, [marketData]);

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            <TerminalCommandBar />

            {/* Header */}
            <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
                <Briefcase size={16} className="text-accent" />
                <h1 className="text-[11px] font-bold uppercase tracking-widest">Portfolio Analytics</h1>
                <div className="h-4 w-px bg-border" />
                <div className="flex gap-1">
                    {(['holdings', 'performance'] as const).map(v => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${view === v ? 'bg-accent text-background' : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'
                                }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-6 text-[10px] tabular-nums">
                    <div>
                        <span className="text-text-tertiary mr-2">NAV</span>
                        <span className="font-bold">${(portfolioData.totalValue / 1000000).toFixed(2)}M</span>
                    </div>
                    <div>
                        <span className="text-text-tertiary mr-2">Day</span>
                        <span className={`font-bold ${portfolioData.dayPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {portfolioData.dayPnl >= 0 ? '+' : ''}${(portfolioData.dayPnl / 1000).toFixed(0)}K
                        </span>
                    </div>
                    <div>
                        <span className="text-text-tertiary mr-2">Total</span>
                        <span className={`font-bold ${portfolioData.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {portfolioData.totalPnlPct >= 0 ? '+' : ''}{portfolioData.totalPnlPct.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {view === 'holdings' ? (
                    <>
                        {/* Holdings Table */}
                        <TerminalPanel title="Holdings" fnKey="F1">
                            <div className="overflow-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Symbol</th>
                                            <th>Name</th>
                                            <th>Sector</th>
                                            <th className="text-right">Qty</th>
                                            <th className="text-right">Avg Cost</th>
                                            <th className="text-right">Current</th>
                                            <th className="text-right">Mkt Value</th>
                                            <th className="text-right">P&L</th>
                                            <th className="text-right">Return</th>
                                            <th className="text-right">Day</th>
                                            <th className="text-right">Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolioData.holdings.map(h => (
                                            <tr key={h.symbol}>
                                                <td className="font-bold text-accent">{h.symbol}</td>
                                                <td className="text-text-secondary text-[10px]">{h.name}</td>
                                                <td className="text-text-tertiary text-[10px]">{h.sector}</td>
                                                <td className="text-right tabular-nums">{h.quantity.toLocaleString()}</td>
                                                <td className="text-right tabular-nums">{h.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="text-right tabular-nums">{h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="text-right tabular-nums">${(h.marketValue / 1000).toFixed(0)}K</td>
                                                <td className={`text-right tabular-nums font-bold ${h.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {h.pnl >= 0 ? '+' : ''}${(h.pnl / 1000).toFixed(1)}K
                                                </td>
                                                <td className={`text-right tabular-nums font-bold ${h.pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                                                </td>
                                                <td className={`text-right tabular-nums ${h.dayChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {h.dayChange >= 0 ? '+' : ''}{h.dayChange.toFixed(2)}%
                                                </td>
                                                <td className="text-right tabular-nums">{h.weight}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TerminalPanel>

                        {/* Allocation */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <TerminalPanel title="Sector Allocation" fnKey="F2">
                                <div className="p-4 space-y-2">
                                    {[...portfolioData.sectors.entries()].map(([sector, weight]) => (
                                        <div key={sector}>
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="font-bold text-text-secondary uppercase">{sector}</span>
                                                <span className="tabular-nums text-text-primary">{weight}%</span>
                                            </div>
                                            <div className="h-2 bg-background rounded-full overflow-hidden">
                                                <div className="h-full bg-accent/60 transition-all" style={{ width: `${weight}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TerminalPanel>

                            <TerminalPanel title="Monthly Returns" fnKey="F3">
                                <div className="p-4 flex items-end gap-2 h-full">
                                    {MONTHLY_RETURNS.map(m => (
                                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                            <span className={`text-[9px] font-bold tabular-nums ${m.return >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                {m.return >= 0 ? '+' : ''}{m.return}%
                                            </span>
                                            <div className="w-full relative" style={{ height: '80px' }}>
                                                <div
                                                    className={`absolute bottom-0 w-full ${m.return >= 0 ? 'bg-positive/30' : 'bg-negative/30'}`}
                                                    style={{ height: `${Math.abs(m.return) * 15}px` }}
                                                />
                                            </div>
                                            <span className="text-[8px] text-text-muted uppercase">{m.month}</span>
                                        </div>
                                    ))}
                                </div>
                            </TerminalPanel>
                        </div>
                    </>
                ) : (
                    /* Performance View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <TerminalPanel title="Risk-Adjusted Returns">
                            <div className="p-4">
                                <StatBlock label="Sharpe Ratio" value={PERFORMANCE_METRICS.sharpeRatio.toFixed(2)} color="text-positive" />
                                <StatBlock label="Sortino Ratio" value={PERFORMANCE_METRICS.sortinoRatio.toFixed(2)} color="text-positive" />
                                <StatBlock label="Calmar Ratio" value={PERFORMANCE_METRICS.calmarRatio.toFixed(2)} color="text-positive" />
                                <StatBlock label="Treynor Ratio" value={PERFORMANCE_METRICS.treynorRatio.toFixed(1)} />
                                <StatBlock label="Information Ratio" value={PERFORMANCE_METRICS.informationRatio.toFixed(2)} />
                            </div>
                        </TerminalPanel>

                        <TerminalPanel title="Trade Statistics">
                            <div className="p-4">
                                <StatBlock label="Win Rate" value={`${PERFORMANCE_METRICS.winRate}%`} color="text-positive" />
                                <StatBlock label="Avg Win" value={`+${PERFORMANCE_METRICS.avgWin}%`} color="text-positive" />
                                <StatBlock label="Avg Loss" value={`${PERFORMANCE_METRICS.avgLoss}%`} color="text-negative" />
                                <StatBlock label="Profit Factor" value={PERFORMANCE_METRICS.profitFactor.toFixed(2)} />
                                <StatBlock label="Max Drawdown" value={`${PERFORMANCE_METRICS.maxDrawdown}%`} color="text-negative" />
                            </div>
                        </TerminalPanel>

                        <TerminalPanel title="Market Exposure">
                            <div className="p-4">
                                <StatBlock label="Beta" value={PERFORMANCE_METRICS.beta.toFixed(2)} />
                                <StatBlock label="Alpha (ann.)" value={`+${PERFORMANCE_METRICS.alpha}%`} color="text-positive" />
                                <StatBlock label="Long Exposure" value="55%" />
                                <StatBlock label="Short Exposure" value="25%" />
                                <StatBlock label="Net Exposure" value="30%" />
                            </div>
                        </TerminalPanel>
                    </div>
                )}
            </div>
        </div>
    );
}
