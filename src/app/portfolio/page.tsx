'use client';

import { useMemo } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { useTradingStore } from '@/services/store/use-trading-store';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

export default function PortfolioPage() {
    const { positions, balance, initialBalance } = useTradingStore();
    const symbols = Object.keys(positions);
    const { data: marketData } = useMarketData(symbols);

    const portfolioData = useMemo(() => {
        let totalMarketValue = 0;
        let totalCost = 0;

        const holdings = symbols.map(sym => {
            const pos = positions[sym];
            const tick = marketData[sym];
            const currentPrice = tick?.price || pos.avgPrice;
            const marketValue = currentPrice * pos.quantity;
            const costBasis = pos.avgPrice * pos.quantity;
            const pnl = (currentPrice - pos.avgPrice) * pos.quantity * (pos.side === 'LONG' ? 1 : -1);
            const pnlPct = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100 * (pos.side === 'LONG' ? 1 : -1);

            totalMarketValue += marketValue;
            totalCost += costBasis;

            return { ...pos, currentPrice, marketValue, pnl, pnlPct };
        });

        const totalPnl = totalMarketValue - totalCost;
        const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

        return { holdings, totalMarketValue, totalPnl, totalPnlPct };
    }, [marketData, positions]);

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            <TerminalCommandBar />
            <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
                <Briefcase size={16} className="text-accent" />
                <h1 className="text-[11px] font-bold uppercase tracking-widest">Portfolio Analytics</h1>
                <div className="ml-auto flex items-center gap-6 text-[10px] tabular-nums">
                    <div><span className="text-text-tertiary mr-2 uppercase">Cash</span><span className="font-bold">${balance.toLocaleString()}</span></div>
                    <div><span className="text-text-tertiary mr-2 uppercase">Total P&L</span><span className={`font-bold ${portfolioData.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>${portfolioData.totalPnl.toLocaleString()} ({portfolioData.totalPnlPct.toFixed(2)}%)</span></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <TerminalPanel title="Active Holdings" fnKey="F1">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Side</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Avg Cost</th>
                                <th className="text-right">Current</th>
                                <th className="text-right">P&L</th>
                                <th className="text-right">Return</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolioData.holdings.map(h => (
                                <tr key={h.symbol}>
                                    <td className="font-bold text-accent">{h.symbol}</td>
                                    <td><span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${h.side === 'LONG' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>{h.side}</span></td>
                                    <td className="text-right tabular-nums">{h.quantity}</td>
                                    <td className="text-right tabular-nums">${h.avgPrice.toLocaleString()}</td>
                                    <td className="text-right tabular-nums">${h.currentPrice.toLocaleString()}</td>
                                    <td className={`text-right tabular-nums font-bold ${h.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>${h.pnl.toLocaleString()}</td>
                                    <td className={`text-right tabular-nums font-bold ${h.pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>{h.pnlPct.toFixed(2)}%</td>
                                </tr>
                            ))}
                            {portfolioData.holdings.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-8 text-text-tertiary uppercase text-[10px] tracking-widest">No open positions</td></tr>
                            )}
                        </tbody>
                    </table>
                </TerminalPanel>
            </div>
        </div>
    );
}