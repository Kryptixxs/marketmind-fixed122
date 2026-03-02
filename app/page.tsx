'use client';

import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Widget } from '@/components/Widget';
import { TapeWidget } from '@/components/widgets/Tape';
import { TradingChart } from '@/components/TradingChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Activity, Radio, Wifi } from 'lucide-react';

// We need to fetch/generate chart data in a real app, but for now passing mock
const MOCK_CHART_DATA = Array.from({ length: 100 }, (_, i) => ({
  time: Math.floor(Date.now() / 1000) - (100 - i) * 3600,
  open: 100 + Math.random() * 10,
  high: 110 + Math.random() * 10,
  low: 90 + Math.random() * 10,
  close: 105 + Math.random() * 10,
}));

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("BTC-USD");

  return (
    <div className="h-full w-full bg-background p-1">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-sm border border-border">
        
        {/* LEFT COLUMN: WATCHLIST & MARKET STATS */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60}>
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
                        <span className="text-xs text-text-primary">{(Math.random() * 4000 + 1000).toFixed(2)}</span>
                        <span className="text-[10px] text-positive">+0.45%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Widget>
            </ResizablePanel>
            <ResizableHandle className="bg-border" />
            <ResizablePanel defaultSize={40}>
               <Widget title="Global Vitals">
                 <div className="p-3 grid grid-cols-2 gap-4">
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle className="bg-border w-[2px]" />

        {/* CENTER COLUMN: CHART & TAPE */}
        <ResizablePanel defaultSize={55}>
          <ResizablePanelGroup direction="vertical">
            {/* Main Chart */}
            <ResizablePanel defaultSize={70} className="relative">
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
                <div className="w-full h-full bg-black">
                  {/* Reuse TradingChart but container must be sized */}
                  <TradingChart data={MOCK_CHART_DATA} />
                </div>
              </Widget>
            </ResizablePanel>
            
            <ResizableHandle className="bg-border h-[2px]" />
            
            {/* Level 2 / Tape */}
            <ResizablePanel defaultSize={30}>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>
                  <Widget title="Time & Sales">
                    <TapeWidget symbol={activeSymbol} />
                  </Widget>
                </ResizablePanel>
                <ResizableHandle className="bg-border w-[1px]" />
                <ResizablePanel defaultSize={50}>
                  <Widget title="Order Book">
                    <div className="w-full h-full flex flex-col text-[10px]">
                      {/* Mock Order Book */}
                      <div className="flex-1 flex flex-col justify-end overflow-hidden">
                        {Array.from({length: 8}).map((_, i) => (
                           <div key={i} className="flex justify-between px-2 py-0.5 text-negative hover:bg-surface-highlight relative">
                             <div className="absolute right-0 top-0 bottom-0 bg-negative/10" style={{width: `${Math.random() * 80}%`}}></div>
                             <span className="z-10 font-mono">{(65000 + i * 10).toFixed(1)}</span>
                             <span className="z-10 font-mono">{(Math.random() * 2).toFixed(3)}</span>
                           </div>
                        ))}
                      </div>
                      <div className="bg-surface border-y border-border py-1 px-2 flex justify-between font-bold">
                        <span className="text-positive">64,950.00</span>
                        <span>Spread: 5.0</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {Array.from({length: 8}).map((_, i) => (
                           <div key={i} className="flex justify-between px-2 py-0.5 text-positive hover:bg-surface-highlight relative">
                             <div className="absolute right-0 top-0 bottom-0 bg-positive/10" style={{width: `${Math.random() * 80}%`}}></div>
                             <span className="z-10 font-mono">{(64950 - i * 10).toFixed(1)}</span>
                             <span className="z-10 font-mono">{(Math.random() * 2).toFixed(3)}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  </Widget>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle className="bg-border w-[2px]" />

        {/* RIGHT COLUMN: NEWS & AI */}
        <ResizablePanel defaultSize={25} minSize={20}>
          <ResizablePanelGroup direction="vertical">
             <ResizablePanel defaultSize={50}>
               <Widget title="Intelligence Wire">
                 <NewsFeed />
               </Widget>
             </ResizablePanel>
             <ResizableHandle className="bg-border h-[2px]" />
             <ResizablePanel defaultSize={50}>
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
             </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}