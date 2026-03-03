'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, List } from 'lucide-react';
import { TradingChart } from '@/components/TradingChart';

// Mock watchlist for the sidebar
const WATCHLIST = [
  { symbol: 'BTCUSDT', price: '64,230.50', change: '+1.2%' },
  { symbol: 'ETHUSDT', price: '3,450.20', change: '-0.5%' },
  { symbol: 'SOLUSDT', price: '145.80', change: '+3.4%' },
  { symbol: 'ES1!', price: '5,240.00', change: '+0.1%' },
];

export default function Charts() {
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate some mock candle data
  useEffect(() => {
    const data = [];
    let time = Math.floor(Date.now() / 1000) - 86400 * 100;
    let price = 60000;
    for (let i = 0; i < 2000; i++) {
      const vol = Math.random() * 100;
      const open = price + (Math.random() - 0.5) * vol;
      const high = open + Math.random() * vol;
      const low = open - Math.random() * vol;
      const close = (open + high + low) / 3;
      data.push({ time, open, high, low, close });
      price = close;
      time += 3600;
    }
    setChartData(data);
  }, []);

  return (
    <div className="flex-1 flex h-[calc(100vh-50px)] overflow-hidden bg-background">
      {/* Left Sidebar: Watchlist */}
      <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
         <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-text-secondary">Watchlist</span>
            <button className="text-text-secondary hover:text-text-primary"><Plus size={14} /></button>
         </div>
         <div className="flex-1 overflow-y-auto">
            {WATCHLIST.map(item => (
              <div key={item.symbol} className="px-4 py-3 border-b border-border/50 hover:bg-surface-hover cursor-pointer transition-colors group">
                 <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-text-primary">{item.symbol}</span>
                    <span className="text-sm font-mono text-text-primary">{item.price}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-[10px] text-text-tertiary uppercase">Binance</span>
                    <span className={`text-xs font-bold ${item.change.startsWith('+') ? 'text-positive' : 'text-negative'}`}>{item.change}</span>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col min-w-0">
         {/* Chart Toolbar */}
         <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4">
            <div className="flex items-center gap-2 text-text-primary font-bold cursor-pointer hover:bg-surface-hover px-2 py-1 rounded">
               <span>BTCUSDT</span>
               <span className="text-text-tertiary text-xs">1H</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-1">
               {['15m', '1H', '4H', '1D'].map(tf => (
                 <button key={tf} className="px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded">
                   {tf}
                 </button>
               ))}
            </div>
         </div>
         
         {/* Chart Canvas */}
         <div className="flex-1 relative bg-[#131315]">
            <TradingChart data={chartData} />
            <div className="absolute top-4 left-4 z-10 opacity-50 pointer-events-none">
               <h1 className="text-4xl font-bold text-white/5">MarketMind</h1>
            </div>
         </div>
      </div>
    </div>
  );
}