'use client';

import { useState, useMemo } from 'react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { useTradingStore } from '@/services/store/use-trading-store';
import { ArrowUpDown, CheckCircle2, XCircle, AlertCircle, Send, Trash2 } from 'lucide-react';

export default function ExecutionPage() {
    const { orders, trades, submitOrder, cancelOrder, balance } = useTradingStore();
    const [orderSymbol, setOrderSymbol] = useState('NAS100');
    const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
    const [orderQty, setOrderQty] = useState('1');
    const [orderPrice, setOrderPrice] = useState('');
    const [activeTab, setActiveTab] = useState<'blotter' | 'pending'>('blotter');

    const { data: marketData } = useMarketData([orderSymbol]);
    const currentPrice = marketData[orderSymbol]?.price || 0;

    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPrice && orderType === 'MARKET') return alert('Waiting for market data...');
        
        submitOrder({
            symbol: orderSymbol,
            side: orderSide,
            type: orderType,
            quantity: parseFloat(orderQty),
            price: orderType === 'MARKET' ? undefined : parseFloat(orderPrice)
        }, currentPrice);
    };

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            <TerminalCommandBar />

            <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
                <ArrowUpDown size={16} className="text-accent" />
                <h1 className="text-[11px] font-bold uppercase tracking-widest">Execution Management System</h1>
                <div className="h-4 w-px bg-border" />
                <span className="text-[10px] font-mono text-text-secondary uppercase">Buying Power: ${balance.toLocaleString()}</span>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Order Ticket */}
                <div className="w-72 border-r border-border bg-surface shrink-0 flex flex-col">
                    <form onSubmit={handleOrderSubmit} className="p-3 border-b border-border">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-accent mb-3">Order Ticket</div>

                        <div className="mb-2">
                            <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Symbol</label>
                            <input
                                value={orderSymbol}
                                onChange={e => setOrderSymbol(e.target.value.toUpperCase())}
                                className="w-full bg-background border border-border px-2 py-1.5 text-[11px] font-mono text-accent uppercase outline-none focus:border-accent"
                            />
                        </div>

                        <div className="flex justify-between text-[10px] mb-3 px-1">
                            <span className="text-text-tertiary uppercase">Mark</span>
                            <span className="font-bold tabular-nums text-text-primary">{currentPrice ? currentPrice.toLocaleString() : '---'}</span>
                        </div>

                        <div className="flex gap-1 mb-2">
                            <button type="button" onClick={() => setOrderSide('BUY')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${orderSide === 'BUY' ? 'bg-positive text-background' : 'bg-surface-highlight text-text-tertiary hover:text-positive'}`}>BUY</button>
                            <button type="button" onClick={() => setOrderSide('SELL')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${orderSide === 'SELL' ? 'bg-negative text-background' : 'bg-surface-highlight text-text-tertiary hover:text-negative'}`}>SELL</button>
                        </div>

                        <div className="flex gap-1 mb-3">
                            {(['MARKET', 'LIMIT', 'STOP'] as const).map(t => (
                                <button type="button" key={t} onClick={() => setOrderType(t)}
                                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors ${orderType === t ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-background text-text-tertiary border border-border'}`}>{t}</button>
                            ))}
                        </div>

                        <div className="mb-2">
                            <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Quantity</label>
                            <input type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)}
                                className="w-full bg-background border border-border px-2 py-1.5 text-[11px] font-mono outline-none focus:border-accent tabular-nums"
                            />
                        </div>

                        {orderType !== 'MARKET' && (
                            <div className="mb-3">
                                <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Price</label>
                                <input type="number" value={orderPrice} onChange={e => setOrderPrice(e.target.value)}
                                    className="w-full bg-background border border-border px-2 py-1.5 text-[11px] font-mono outline-none focus:border-accent tabular-nums"
                                />
                            </div>
                        )}

                        <button type="submit" className={`w-full py-2.5 text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors ${orderSide === 'BUY' ? 'bg-positive hover:bg-positive/80 text-background' : 'bg-negative hover:bg-negative/80 text-background'}`}>
                            <Send size={12} />
                            {orderSide} {orderQty} {orderSymbol}
                        </button>
                    </form>
                </div>

                {/* Right: Blotter */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-8 border-b border-border bg-surface flex items-center px-2 gap-1 shrink-0">
                        <button onClick={() => setActiveTab('blotter')} className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'blotter' ? 'text-accent bg-accent/5 border-b border-accent' : 'text-text-tertiary hover:text-text-primary'}`}>Trade Blotter</button>
                        <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'pending' ? 'text-accent bg-accent/5 border-b border-accent' : 'text-text-tertiary hover:text-text-primary'}`}>Pending Orders</button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === 'blotter' ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Symbol</th>
                                        <th>Side</th>
                                        <th className="text-right">Qty</th>
                                        <th className="text-right">Price</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.filter(o => o.status === 'FILLED').map(order => (
                                        <tr key={order.id}>
                                            <td className="font-mono text-[10px] text-text-tertiary">{new Date(order.timestamp).toLocaleTimeString()}</td>
                                            <td className="font-bold text-accent">{order.symbol}</td>
                                            <td><span className={`px-1.5 py-0.5 text-[8px] font-bold ${order.side === 'BUY' ? 'text-positive' : 'text-negative'}`}>{order.side}</span></td>
                                            <td className="text-right tabular-nums">{order.quantity}</td>
                                            <td className="text-right tabular-nums">${order.price?.toLocaleString()}</td>
                                            <td><span className="flex items-center gap-1 text-[9px] text-positive font-bold uppercase"><CheckCircle2 size={10} /> FILLED</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th>Side</th>
                                        <th>Type</th>
                                        <th className="text-right">Qty</th>
                                        <th className="text-right">Price</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.filter(o => o.status === 'PENDING').map(order => (
                                        <tr key={order.id}>
                                            <td className="font-bold text-accent">{order.symbol}</td>
                                            <td><span className={`px-1.5 py-0.5 text-[8px] font-bold ${order.side === 'BUY' ? 'text-positive' : 'text-negative'}`}>{order.side}</span></td>
                                            <td className="text-[9px] uppercase text-text-secondary">{order.type}</td>
                                            <td className="text-right tabular-nums">{order.quantity}</td>
                                            <td className="text-right tabular-nums">${order.price?.toLocaleString()}</td>
                                            <td><button onClick={() => cancelOrder(order.id)} className="text-negative hover:underline text-[9px] font-bold uppercase">Cancel</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}