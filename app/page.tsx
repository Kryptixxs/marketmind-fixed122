'use client';

import { useState, useEffect } from 'react';
import { Widget } from '@/components/Widget';
import { TapeWidget } from '@/components/widgets/Tape';
import { TradingChart } from '@/components/TradingChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Wifi } from 'lucide-react';

const MOCK_CHART_DATA = Array.from({ length: 100 }, (_, i) => ({
  time: Math.floor(Date.now() / 1000) - (100 - i) * 3600,
  open: 100 + Math.random() * 10,
  high: 110 + Math.random() * 10,
  low: 90 + Math.random() * 10,
  close: 105 + Math.random() * 10,
}));

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("BTC-USD");
  const [marketData, setMarketData] = useState<Record<string, { price: string, change: string }>>({});
  const [orderBook, setOrderBook] = useState<{asks: any[], bids: any[]}>({ asks: [], bids: [] });

  // Hydration fix: Generate random data only on client mount
  useEffect(() => {
    const data: any = {};
    ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ES1!', 'NQ1!', 'EUR/USD', 'GC1!', 'CL1!'].forEach(sym => {
      data[sym] = {
        price: (Math.random() * 4000 + 1000).toFixed(2),
        change: '+' + (Math.random() * 1.5).toFixed(2) + '%'
      };
    });
    setMarketData(data);

    // Generate initial order book
    const asks = Array.from({length: 8}).map((_, i) => ({
      price: (65000 + i * 10).toFixed(1),
      size: (Math.random() * 2).toFixed(3),
      width: Math.random() * 80
    }));
    const bids = Array.from({length: 8}).map((_, i) => ({
      price: (64950 - i * 10).toFixed(1),
      size: (Math.random() * 2).toFixed(3),
      width: Math.random() * 80
    }));
    setOrderBook({ asks, bids });
  }, []);

  return (
    <div className="h-full w-full bg-background p-1 overflow-hidden">
      {/* 
        GRID LAYOUT:
        Cols: 20% (Left) | 55% (Center) | 25% (Right)
        Rows: Main Content vs Bottom Panel
      */}
      <div className="grid grid-cols-12 grid-rows-12 gap-1 h-full w-full">
        
        {/* --- LEFT COLUMN (Cols 1-3) --- */}
        <div className="col-span-3 row-span-8 overflow-hidden">
          <Widget title="Market Watch">
            <div className="flex flex-col">
              {['BTC-USD', 'ETH-USD', 'SOL-USD', 'ES1!', 'NQ1!', 'EUR/USD', 'GC1!', 'CL1!'].map(sym => (
                <div 
                  key={sym} 
                  onClick={() => setActiveSymbol(sym)}
                  className={`flex justify-between items-center px-3 py-2 border-b border-border/50 cursor-pointer hover:bg-surface-highlight ${activeSymbol === sym ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                >
                  <span className="font-bold text-xs">{sym}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-text-primary">
                      {marketData[sym]?.price || '---'}
                    </span>
                    <span className="text-[10px] text-positive">
                      {marketData[sym]?.change || '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Widget>
        </div>
        
        <div className="col-span-3 row-span-4 overflow-hidden">
           <Widget title="Global Vitals">
             <div className="p-3 grid grid-cols-2 gap-4 h-full content-start">
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">VIX Index</div>
                 <div className="text-xl font-bold text-warning">14.52</div>
               </div>
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">DXY Dollar</div>
                 <div className="text-xl font-bold text-text-primary">104.20</div>
               </div>
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">10Y Yield</div>
                 <div className="text-xl font-bold text-negative">4.31%</div>
               </div>
               <div>
                 <div className="text-[10px] text-text-tertiary uppercase mb-1">Liquidity</div>
                 <div className="text-xl font-bold text-positive">High</div>
               </div>
             </div>
           </Widget>
        </div>

        {/* --- CENTER COLUMN (Cols 4-9) --- */}
        <div className="col-span-6 row-span-8 overflow-hidden relative">
          <Widget 
            title={`${activeSymbol} • 1H`} 
            actions={
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-positive flex items-center gap-1"><Wifi size={10}/> Live</span>
                <span className="px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary">1H</span>
                <span className="px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary">Candles</span>
              </div>
            }
          >
            <div className="w-full h-full bg-black flex flex-col justify-center items-center text-text-tertiary">
              <TradingChart data={MOCK_CHART_DATA} />
            </div>
          </Widget>
        </div>

        <div className="col-span-6 row-span-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-1 h-full">
            <Widget title="Time & Sales">
              <TapeWidget symbol={activeSymbol} />
            </Widget>
            <Widget title="Order Book">
              <div className="w-full h-full flex flex-col text-[10px]">
                {/* Order Book */}
                <div className="flex-1 flex flex-col justify-end overflow-hidden">
                  {orderBook.asks.map((ask, i) => (
                      <div key={i} className="flex justify-between px-2 py-0.5 text-negative hover:bg-surface-highlight relative">
                        <div className="absolute right-0 top-0 bottom-0 bg-negative/10" style={{width: `${ask.width}%`}}></div>
                        <span className="z-10 font-mono">{ask.price}</span>
                        <span className="z-10 font-mono">{ask.size}</span>
                      </div>
                  ))}
                </div>
                <div className="bg-surface border-y border-border py-1 px-2 flex justify-between font-bold">
                  <span className="text-positive">64,950.00</span>
                  <span>Spread: 5.0</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  {orderBook.bids.map((bid, i) => (
                      <div key={i} className="flex justify-between px-2 py-0.5 text-positive hover:bg-surface-highlight relative">
                        <div className="absolute right-0 top-0 bottom-0 bg-positive/10" style={{width: `${bid.width}%`}}></div>
                        <span className="z-10 font-mono">{bid.price}</span>
                        <span className="z-10 font-mono">{bid.size}</span>
                      </div>
                  ))}
                </div>
              </div>
            </Widget>
          </div>
        </div>

        {/* --- RIGHT COLUMN (Cols 10-12) --- */}
        <div className="col-span-3 row-span-6 overflow-hidden">
           <Widget title="Intelligence Wire">
             <NewsFeed />
           </Widget>
        </div>

        <div className="col-span-3 row-span-6 overflow-hidden">
           <Widget title="AI Analysis">
             <div className="p-3 text-xs text-text-secondary leading-relaxed">
               <div className="flex items-center gap-2 mb-3 text-accent">
                 <Activity size={14} />
                 <span className="font-bold">Bullish Divergence Detected</span>
               </div>
               <p className="mb-2">
                 <span className="text-text-primary font-bold">Signal:</span> Momentum indicators on 4H timeframe suggest trend reversal for BTC-USD.
               </p>
               <p className="mb-2">
                 <span className="text-text-primary font-bold">Correlation:</span> Decoupling from Nasdaq-100 observed in last 2 sessions.
               </p>
               <div className="mt-4 p-2 bg-surface border border-border rounded">
                 <div className="flex justify-between mb-1">
                    <span>Confidence</span>
                    <span className="text-positive">87%</span>
                 </div>
                 <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-positive"></div>
                 </div>
               </div>
             </div>
           </Widget>
        </div>

      </div>
    </div>
  );
}