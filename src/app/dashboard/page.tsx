'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { calculateParkinsonVol } from '../../../quant_engine/math/feature_gen';
import { calculateOptimalTrajectory } from '../../../quant_engine/execution/almgren_chriss';
import { Activity, Zap, Target, BarChart3, ShieldAlert, Globe, Cpu } from 'lucide-react';

const WATCHLIST = ['NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 'GOLD', 'CRUDE', 'BTCUSD', 'AAPL', 'NVDA', 'MSFT', 'TSLA', 'EURUSD', 'GBPUSD', 'USDJPY'];

export default function PeakTerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [mounted, setMounted] = useState(false);
  
  const { data: marketData } = useMarketData(WATCHLIST);
  const activeQuote = marketData[activeSymbol];

  // Fix hydration mismatch by tracking mount state
  useEffect(() => {
    setMounted(true);
  }, []);

  const quantMetrics = useMemo(() => {
    if (!activeQuote || !activeQuote.history) return null;
    const bars = activeQuote.history.map(h => ({
      symbol: activeSymbol,
      timestamp: h.timestamp,
      open: h.open, high: h.high, low: h.low, close: h.close,
      volume: h.volume, vwap: h.close
    }));
    const vol = calculateParkinsonVol(bars);
    const trajectory = calculateOptimalTrajectory(1000, 60, vol, 50000);
    return { vol, trajectory };
  }, [activeQuote, activeSymbol]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden font-mono selection:bg-accent/30">
      <TerminalCommandBar />

      <div className="flex-1 w-full flex overflow-hidden">
        <PanelGroup orientation="horizontal">
          
          {/* LEFT: MARKET WATCH (DENSE) */}
          <Panel defaultSize={22} minSize={15}>
            <TerminalPanel title="Market Monitor // Global Matrix">
              <div className="h-full overflow-y-auto custom-scrollbar">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Ticker</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Chg%</th>
                      <th className="text-right hidden xl:table-cell">Vol(M)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WATCHLIST.map(sym => {
                      const tick = marketData[sym];
                      const isPos = tick?.changePercent >= 0;
                      return (
                        <tr 
                          key={sym} 
                          onClick={() => setActiveSymbol(sym)} 
                          className={`cursor-pointer hover:bg-surface-highlight transition-colors ${activeSymbol === sym ? 'bg-accent/10' : ''}`}
                        >
                          <td className={`font-bold ${activeSymbol === sym ? 'text-accent' : 'text-text-primary'}`}>{sym}</td>
                          <td className="text-right font-mono">{tick?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`text-right font-mono ${isPos ? 'text-positive' : 'text-negative'}`}>
                            {tick ? `${isPos ? '+' : ''}${tick.changePercent.toFixed(2)}%` : '---'}
                          </td>
                          <td className="text-right font-mono text-text-tertiary hidden xl:table-cell">
                            {/* Use a stable value during SSR and generate random only on client */}
                            {mounted ? (Math.random() * 100).toFixed(1) : "0.0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TerminalPanel>
          </Panel>

          <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />

          {/* CENTER: ANALYTICS */}
          <Panel defaultSize={58}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={75}>
                <TerminalPanel title={`Price Analytics // ${activeSymbol} // Real-time`}>
                  <div className="w-full h-full bg-black relative">
                    <TradingChart data={activeQuote?.history?.map(h => ({
                      time: Math.floor(h.timestamp / 1000),
                      open: h.open, high: h.high, low: h.low, close: h.close
                    })) || []} />
                    
                    <div className="absolute top-1 left-1 flex gap-1 z-10">
                      <div className="px-1.5 py-0.5 bg-surface/80 backdrop-blur border border-border text-[8px] font-bold text-accent uppercase">L1_FEED</div>
                      <div className="px-1.5 py-0.5 bg-surface/80 backdrop-blur border border-border text-[8px] font-bold text-text-secondary uppercase">SMC_ACTIVE</div>
                    </div>
                  </div>
                </TerminalPanel>
              </Panel>
              
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />

              <Panel defaultSize={25}>
                <div className="grid grid-cols-4 h-full gap-px bg-border">
                  <div className="bg-background p-2">
                    <div className="flex items-center gap-1 text-accent mb-2">
                      <Zap size={10} />
                      <span className="text-[8px] font-bold uppercase">Quant</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">PARK_VOL</span>
                        <span className="font-mono text-text-primary">{(quantMetrics?.vol || 0).toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">Z_SCORE</span>
                        <span className="font-mono text-positive">+1.42</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">BETA_SPY</span>
                        <span className="font-mono text-text-primary">1.12</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background p-2">
                    <div className="flex items-center gap-1 text-warning mb-2">
                      <Target size={10} />
                      <span className="text-[8px] font-bold uppercase">Execution</span>
                    </div>
                    <div className="h-8 flex items-end gap-0.5">
                      {quantMetrics?.trajectory.slice(0, 20).map((val, i) => (
                        <div key={i} className="flex-1 bg-warning/20 border-t border-warning/40" style={{ height: `${(val / 1000) * 100}%` }} />
                      ))}
                    </div>
                    <span className="text-[7px] text-text-tertiary uppercase mt-1 block">ALMGREN_CHRIS_60M</span>
                  </div>
                  <div className="bg-background p-2">
                    <div className="flex items-center gap-1 text-negative mb-2">
                      <ShieldAlert size={10} />
                      <span className="text-[8px] font-bold uppercase">Risk</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-0.5 bg-surface-highlight rounded-full overflow-hidden">
                        <div className="h-full bg-negative w-[65%]" />
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">VAR_95</span>
                        <span className="font-mono text-text-primary">$12.4K</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">MAX_DD</span>
                        <span className="font-mono text-negative">-4.2%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background p-2">
                    <div className="flex items-center gap-1 text-blue-400 mb-2">
                      <Globe size={10} />
                      <span className="text-[8px] font-bold uppercase">Macro</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">DXY_CORR</span>
                        <span className="font-mono text-negative">-0.82</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-text-tertiary">US10Y_SENS</span>
                        <span className="font-mono text-text-primary">HIGH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />

          {/* RIGHT: INTELLIGENCE */}
          <Panel defaultSize={20}>
            <TerminalPanel title="Intelligence Wire">
              <NewsFeed activeSymbol={activeSymbol} />
            </TerminalPanel>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}