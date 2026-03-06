'use client';

import React, { useState, useMemo } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { calculateParkinsonVol } from '../../../quant_engine/math/feature_gen';
import { calculateOptimalTrajectory } from '../../../quant_engine/execution/almgren_chriss';
import { Activity, Zap, Target, BarChart3, ShieldAlert } from 'lucide-react';

const WATCHLIST = ['NAS100', 'SPX500', 'GOLD', 'CRUDE', 'BTCUSD', 'AAPL', 'NVDA'];

export default function PeakTerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const { data: marketData } = useMarketData(WATCHLIST);
  const activeQuote = marketData[activeSymbol];

  // Compute Quant Metrics on the fly
  const quantMetrics = useMemo(() => {
    if (!activeQuote || !activeQuote.history) return null;
    
    const bars = activeQuote.history.map(h => ({
      symbol: activeSymbol,
      timestamp: h.timestamp,
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
      volume: h.volume,
      vwap: h.close // Fallback
    }));

    const vol = calculateParkinsonVol(bars);
    const trajectory = calculateOptimalTrajectory(1000, 60, vol, 50000);

    return { vol, trajectory };
  }, [activeQuote, activeSymbol]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden font-mono">
      <TerminalCommandBar />

      <div className="flex-1 w-full flex overflow-hidden">
        <PanelGroup orientation="horizontal">
          
          {/* LEFT: MARKET WATCH */}
          <Panel defaultSize={20} minSize={15}>
            <TerminalPanel title="Market Watch">
              <div className="h-full overflow-y-auto custom-scrollbar">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Sym</th>
                      <th className="text-right">Last</th>
                      <th className="text-right">Chg%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WATCHLIST.map(sym => {
                      const tick = marketData[sym];
                      return (
                        <tr key={sym} onClick={() => setActiveSymbol(sym)} className={`cursor-pointer hover:bg-surface-highlight ${activeSymbol === sym ? 'bg-accent/5' : ''}`}>
                          <td className="font-bold py-2">{sym}</td>
                          <td className="text-right font-mono">{tick?.price.toFixed(2)}</td>
                          <td className={`text-right font-mono ${tick?.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {tick?.changePercent.toFixed(2)}%
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
          <Panel defaultSize={60}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={70}>
                <TerminalPanel title={`Price Analytics // ${activeSymbol}`}>
                  <div className="w-full h-full bg-black relative">
                    <TradingChart data={activeQuote?.history?.map(h => ({
                      time: Math.floor(h.timestamp / 1000),
                      open: h.open, high: h.high, low: h.low, close: h.close
                    })) || []} />
                  </div>
                </TerminalPanel>
              </Panel>
              
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />

              <Panel defaultSize={30}>
                <div className="grid grid-cols-3 h-full gap-px bg-border">
                  <div className="bg-background p-4">
                    <div className="flex items-center gap-2 text-accent mb-4">
                      <Zap size={16} />
                      <span className="text-xs font-bold uppercase">Quant Metrics</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-text-tertiary uppercase">Parkinson Vol</span>
                        <span className="text-xs font-mono text-text-primary">{(quantMetrics?.vol || 0).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-text-tertiary uppercase">Z-Score (1D)</span>
                        <span className="text-xs font-mono text-positive">+1.42</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background p-4">
                    <div className="flex items-center gap-2 text-warning mb-4">
                      <Target size={16} />
                      <span className="text-xs font-bold uppercase">Optimal Execution</span>
                    </div>
                    <div className="h-16 flex items-end gap-1">
                      {quantMetrics?.trajectory.slice(0, 12).map((val, i) => (
                        <div key={i} className="flex-1 bg-warning/20 border-t border-warning" style={{ height: `${(val / 1000) * 100}%` }} />
                      ))}
                    </div>
                    <span className="text-[8px] text-text-tertiary uppercase mt-2 block">Almgren-Chriss Trajectory (60m)</span>
                  </div>
                  <div className="bg-background p-4">
                    <div className="flex items-center gap-2 text-negative mb-4">
                      <ShieldAlert size={16} />
                      <span className="text-xs font-bold uppercase">Risk Engine</span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-1 bg-surface-highlight rounded-full overflow-hidden">
                        <div className="h-full bg-negative w-[65%]" />
                      </div>
                      <span className="text-[10px] text-text-secondary">VaR (95%): $12,402</span>
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