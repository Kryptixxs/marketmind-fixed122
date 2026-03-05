'use client';

import { useState, useMemo } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { ArrowUpDown, Clock, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';

// Simulated order/trade history
const TRADE_HISTORY = [
    { id: 'TRD-0847', time: '14:32:18', symbol: 'NAS100', side: 'BUY', qty: 5, price: 18642.50, status: 'FILLED', fillPrice: 18643.20, slippage: 0.70 },
    { id: 'TRD-0846', time: '14:28:05', symbol: 'GOLD', side: 'BUY', qty: 25, price: 2045.80, status: 'FILLED', fillPrice: 2045.80, slippage: 0.00 },
    { id: 'TRD-0845', time: '13:55:42', symbol: 'CRUDE', side: 'SELL', qty: 50, price: 78.92, status: 'FILLED', fillPrice: 78.88, slippage: -0.04 },
    { id: 'TRD-0844', time: '13:12:30', symbol: 'EURUSD', side: 'SELL', qty: 50000, price: 1.0862, status: 'FILLED', fillPrice: 1.0862, slippage: 0.00 },
    { id: 'TRD-0843', time: '12:45:11', symbol: 'SPX500', side: 'BUY', qty: 3, price: 5152.00, status: 'FILLED', fillPrice: 5152.40, slippage: 0.40 },
    { id: 'TRD-0842', time: '11:30:22', symbol: 'BTCUSD', side: 'BUY', qty: 1, price: 63450.00, status: 'CANCELLED', fillPrice: 0, slippage: 0 },
    { id: 'TRD-0841', time: '10:15:08', symbol: 'NAS100', side: 'BUY', qty: 5, price: 18590.00, status: 'FILLED', fillPrice: 18591.50, slippage: 1.50 },
    { id: 'TRD-0840', time: '09:31:45', symbol: 'GOLD', side: 'SELL', qty: 25, price: 2038.50, status: 'FILLED', fillPrice: 2038.20, slippage: -0.30 },
];

const PENDING_ORDERS = [
    { id: 'ORD-1024', symbol: 'NAS100', side: 'BUY', type: 'LIMIT', qty: 10, price: 18400.00, status: 'PENDING' },
    { id: 'ORD-1025', symbol: 'GOLD', side: 'SELL', type: 'STOP', qty: 50, price: 2010.00, status: 'PENDING' },
];

export default function ExecutionPage() {
    const [orderSymbol, setOrderSymbol] = useState('NAS100');
    const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
    const [orderQty, setOrderQty] = useState('1');
    const [orderPrice, setOrderPrice] = useState('');
    const [activeTab, setActiveTab] = useState<'blotter' | 'pending' | 'analytics'>('blotter');

    const { data: marketData } = useMarketData([orderSymbol]);
    const currentPrice = marketData[orderSymbol]?.price;

    const executionStats = useMemo(() => {
        const filled = TRADE_HISTORY.filter(t => t.status === 'FILLED');
        const totalSlippage = filled.reduce((s, t) => s + Math.abs(t.slippage), 0);
        const avgSlippage = filled.length > 0 ? totalSlippage / filled.length : 0;
        const fillRate = (filled.length / TRADE_HISTORY.length) * 100;
        const buys = filled.filter(t => t.side === 'BUY').length;
        const sells = filled.filter(t => t.side === 'SELL').length;

        return { totalFills: filled.length, avgSlippage, fillRate, buys, sells, totalOrders: TRADE_HISTORY.length };
    }, []);

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            <TerminalCommandBar />

            {/* Header */}
            <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
                <ArrowUpDown size={16} className="text-accent" />
                <h1 className="text-[11px] font-bold uppercase tracking-widest">Execution Management System</h1>
                <div className="h-4 w-px bg-border" />
                <span className="bb-status-live">LIVE MARKET</span>
                <div className="ml-auto flex items-center gap-6 text-[10px] font-mono tabular-nums">
                    <div><span className="text-text-tertiary mr-1">Fills</span><span className="text-positive font-bold">{executionStats.totalFills}</span></div>
                    <div><span className="text-text-tertiary mr-1">Avg Slip</span><span className="font-bold">{executionStats.avgSlippage.toFixed(2)}</span></div>
                    <div><span className="text-text-tertiary mr-1">Fill Rate</span><span className="font-bold">{executionStats.fillRate.toFixed(0)}%</span></div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Order Ticket */}
                <div className="w-72 border-r border-border bg-surface shrink-0 flex flex-col">
                    <div className="p-3 border-b border-border">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-accent mb-3">Order Ticket</div>

                        {/* Symbol */}
                        <div className="mb-2">
                            <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Symbol</label>
                            <input
                                value={orderSymbol}
                                onChange={e => setOrderSymbol(e.target.value.toUpperCase())}
                                className="w-full bg-background border border-border px-2 py-1.5 text-[11px] font-mono text-accent uppercase outline-none focus:border-accent"
                            />
                        </div>

                        {/* Current Price */}
                        {currentPrice && (
                            <div className="flex justify-between text-[10px] mb-3 px-1">
                                <span className="text-text-tertiary">LAST</span>
                                <span className="font-bold tabular-nums">{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        {/* Side */}
                        <div className="flex gap-1 mb-2">
                            <button onClick={() => setOrderSide('BUY')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${orderSide === 'BUY' ? 'bg-positive text-background' : 'bg-surface-highlight text-text-tertiary hover:text-positive'
                                    }`}>BUY</button>
                            <button onClick={() => setOrderSide('SELL')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${orderSide === 'SELL' ? 'bg-negative text-background' : 'bg-surface-highlight text-text-tertiary hover:text-negative'
                                    }`}>SELL</button>
                        </div>

                        {/* Type */}
                        <div className="flex gap-1 mb-3">
                            {(['MARKET', 'LIMIT', 'STOP'] as const).map(t => (
                                <button key={t} onClick={() => setOrderType(t)}
                                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors ${orderType === t ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-background text-text-tertiary border border-border'
                                        }`}>{t}</button>
                            ))}
                        </div>

                        {/* Quantity */}
                        <div className="mb-2">
                            <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Quantity</label>
                            <input type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)}
                                className="w-full bg-background border border-border px-2 py-1.5 text-[11px] font-mono outline-none focus:border-accent tabular-nums"
                            />
                        </div>

                        {/* Price (for limit/stop) */}
                        {orderType !== 'MARKET' && (
                            <div className="mb-3">
                                <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">
                                    {orderType === 'LIMIT' ? 'Limit Price' : 'Stop Price'}
                                </label>
                                <input type="number" value={orderPrice} onChange={e => setOrderPrice(e.target.value)}
                                    className="w-full bg-background border border-border px-2 py-1.5 text-[11px] font-mono outline-none focus:border-accent tabular-nums"
                                />
                            </div>
                        )}

                        {/* Submit */}
                        <button className={`w-full py-2.5 text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors ${orderSide === 'BUY' ? 'bg-positive hover:bg-positive/80 text-background' : 'bg-negative hover:bg-negative/80 text-background'
                            }`}>
                            <Send size={12} />
                            {orderSide} {orderQty} {orderSymbol} @ {orderType}
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="p-3">
                        <div className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider mb-2">Session Stats</div>
                        <div className="space-y-1.5 text-[10px]">
                            <div className="flex justify-between"><span className="text-text-tertiary">Total Orders</span><span className="tabular-nums">{executionStats.totalOrders}</span></div>
                            <div className="flex justify-between"><span className="text-text-tertiary">Buys</span><span className="tabular-nums text-positive">{executionStats.buys}</span></div>
                            <div className="flex justify-between"><span className="text-text-tertiary">Sells</span><span className="tabular-nums text-negative">{executionStats.sells}</span></div>
                            <div className="flex justify-between"><span className="text-text-tertiary">Cancelled</span><span className="tabular-nums">{executionStats.totalOrders - executionStats.totalFills}</span></div>
                        </div>
                    </div>
                </div>

                {/* Right: Blotter / Analytics */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tab bar */}
                    <div className="h-8 border-b border-border bg-surface flex items-center px-2 gap-1 shrink-0">
                        {(['blotter', 'pending', 'analytics'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-accent bg-accent/5 border-b border-accent' : 'text-text-tertiary hover:text-text-primary'
                                    }`}
                            >
                                {tab === 'blotter' ? `Trade Blotter (${executionStats.totalFills})` : tab === 'pending' ? `Pending (${PENDING_ORDERS.length})` : 'Execution Analytics'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === 'blotter' && (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Time</th>
                                        <th>Symbol</th>
                                        <th>Side</th>
                                        <th className="text-right">Qty</th>
                                        <th className="text-right">Order Price</th>
                                        <th className="text-right">Fill Price</th>
                                        <th className="text-right">Slippage</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TRADE_HISTORY.map(trade => (
                                        <tr key={trade.id}>
                                            <td className="font-mono text-text-tertiary">{trade.id}</td>
                                            <td className="font-mono tabular-nums">{trade.time}</td>
                                            <td className="font-bold text-accent">{trade.symbol}</td>
                                            <td>
                                                <span className={`px-1.5 py-0.5 text-[8px] font-bold ${trade.side === 'BUY' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                                                    {trade.side}
                                                </span>
                                            </td>
                                            <td className="text-right tabular-nums">{trade.qty.toLocaleString()}</td>
                                            <td className="text-right tabular-nums">{trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="text-right tabular-nums">{trade.fillPrice > 0 ? trade.fillPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}</td>
                                            <td className={`text-right tabular-nums ${trade.slippage > 0 ? 'text-negative' : trade.slippage < 0 ? 'text-positive' : 'text-text-tertiary'}`}>
                                                {trade.status === 'FILLED' ? (trade.slippage >= 0 ? '+' : '') + trade.slippage.toFixed(2) : '—'}
                                            </td>
                                            <td>
                                                <span className={`flex items-center gap-1 text-[9px] font-bold ${trade.status === 'FILLED' ? 'text-positive' : 'text-text-tertiary'
                                                    }`}>
                                                    {trade.status === 'FILLED' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                    {trade.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'pending' && (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Symbol</th>
                                        <th>Side</th>
                                        <th>Type</th>
                                        <th className="text-right">Qty</th>
                                        <th className="text-right">Price</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PENDING_ORDERS.map(order => (
                                        <tr key={order.id}>
                                            <td className="font-mono text-text-tertiary">{order.id}</td>
                                            <td className="font-bold text-accent">{order.symbol}</td>
                                            <td>
                                                <span className={`px-1.5 py-0.5 text-[8px] font-bold ${order.side === 'BUY' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                                                    {order.side}
                                                </span>
                                            </td>
                                            <td className="text-[9px] uppercase text-text-secondary">{order.type}</td>
                                            <td className="text-right tabular-nums">{order.qty.toLocaleString()}</td>
                                            <td className="text-right tabular-nums">{order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td><span className="flex items-center gap-1 text-[9px] text-warning font-bold"><AlertCircle size={10} /> {order.status}</span></td>
                                            <td>
                                                <button className="text-[9px] font-bold text-negative hover:text-negative/70 uppercase">Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <TerminalPanel title="Execution Quality">
                                    <div className="p-4 space-y-2">
                                        <div className="flex justify-between text-[10px]"><span className="text-text-tertiary">Avg Slippage</span><span className="font-bold tabular-nums">{executionStats.avgSlippage.toFixed(3)} pts</span></div>
                                        <div className="flex justify-between text-[10px]"><span className="text-text-tertiary">Fill Rate</span><span className="font-bold tabular-nums text-positive">{executionStats.fillRate.toFixed(0)}%</span></div>
                                        <div className="flex justify-between text-[10px]"><span className="text-text-tertiary">Avg Fill Time</span><span className="font-bold tabular-nums">23ms</span></div>
                                        <div className="flex justify-between text-[10px]"><span className="text-text-tertiary">Market Impact</span><span className="font-bold tabular-nums">0.02 bps</span></div>
                                        <div className="flex justify-between text-[10px]"><span className="text-text-tertiary">VWAP Deviation</span><span className="font-bold tabular-nums">+0.03%</span></div>
                                    </div>
                                </TerminalPanel>
                                <TerminalPanel title="Venue Distribution">
                                    <div className="p-4 space-y-3">
                                        {[
                                            { venue: 'Direct Market Access', pct: 65 },
                                            { venue: 'Dark Pool', pct: 20 },
                                            { venue: 'Internalized', pct: 10 },
                                            { venue: 'Block Cross', pct: 5 },
                                        ].map(v => (
                                            <div key={v.venue}>
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-text-secondary font-bold uppercase">{v.venue}</span>
                                                    <span className="tabular-nums">{v.pct}%</span>
                                                </div>
                                                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent/50" style={{ width: `${v.pct}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TerminalPanel>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
