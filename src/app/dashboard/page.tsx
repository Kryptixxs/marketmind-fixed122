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
import { Activity, Zap, Target, BarChart3, ShieldAlert, Globe, Cpu, Clock, Layers, ArrowRightLeft, TrendingUp, TrendingDown, ShieldCheck, ZapOff, Gauge, BarChart, Wifi } from 'lucide-react';

// New Widgets
import { MarketInternals } from '@/features/Terminal/components/widgets/MarketInternals';
import { MiniCalendar } from '@/features/Terminal/components/widgets/MiniCalendar';
import { SessionTracker } from '@/features/Terminal/components/widgets/SessionTracker';

const WATCHLIST = [
  'NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 'FTSE100', 'NIKKEI', 'HSI', 'AS51',
  'GOLD', 'SILVER', 'CRUDE', 'NATGAS', 'COPPER', 'PLATINUM',
  'BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD',
  'AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'NFLX', 'DIS', 'PYPL',
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
  'DXY', 'VIX', 'US10Y', 'US2Y', 'MOVE'
];

const TIMEFRAMES = [
  { label: '1M', val: '1m' },
  { label: '5M', val: '5m' },
  { label: '15M', val: '15m' },
  { label: '1H', val: '60m' },
  { label: '1D', val: '1d' },
];

export default function PeakTerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [interval, setInterval] = useState("15m");
  const [mounted, setMounted] = useState(false);
  
  const { data: marketData } = useMarketData(WATCHLIST, interval);
  const activeQuote = marketData[activeSymbol];

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
          
          {/* LEFT: MARKET WATCH & INTERNALS */}
          <Panel defaultSize={22} minSize={15}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={50}>
                <TerminalPanel title="Market Monitor // Global Matrix">
                  <div className="h-full overflow-y-auto custom-scrollbar">
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th className="text-left">Ticker</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Chg%</th>
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TerminalPanel>
              </Panel>
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />
              <Panel defaultSize={25}>
                <TerminalPanel title="Market Internals">
                  <MarketInternals tick={activeQuote} />
                </TerminalPanel>
              </Panel>
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />
              <Panel defaultSize={25}>
                <TerminalPanel title="Upcoming Macro">
                  <div className="h-full overflow-hidden">
                    <MiniCalendar />
                  </div>
                </TerminalPanel>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 transition-colors" />

          {/* CENTER: ANALYTICS & SESSIONS */}
          <Panel defaultSize={58}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={60}>
                <TerminalPanel 
                  title={`Price Analytics // ${activeSymbol} // Real-time`}
                  actions={
                    <div className="flex items-center gap-1 bg-background border border-border rounded-sm p-0.5">
                      {TIMEFRAMES.map(tf => (
                        <button
                          key={tf.val}
                          onClick={() => setInterval(tf.val)}
                          className={`px-1.5 py-0.5 text-[8px] font-bold rounded-sm transition-colors ${interval === tf.val ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary'}`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <div className="w-full h-full bg-black relative">
                    <TradingChart data={activeQuote?.history?.map(h => ({
                      time: Math.floor(h.timestamp / 1000),
                      open: h.open, high: h.high, low: h.low, close: h.close
                    })) || []} />
                    
                    <div className="absolute top-1 left-1 flex gap-1 z-10">
                      <div className="px-1.5 py-0.5 bg-surface/80 backdrop-blur border border-border text-[8px] font-bold text-accent uppercase flex items-center gap-1">
                        <Wifi size={8} className="text-positive animate-pulse" />
                        L1_FEED
                      </div>
                      <div className="px-1.5 py-0.5 bg-surface/80 backdrop-blur border border-border text-[8px] font-bold text-text-secondary uppercase">SMC_ACTIVE</div>
                    </div>
                  </div>
                </TerminalPanel>
              </Panel>
              
              <PanelResizeHandle className="h-px bg-border hover:bg-accent/50 transition-colors" />

              <Panel defaultSize={40}>
                <div className="grid grid-cols-4 h-full gap-px bg-border">
                  {/* QUAD 1: QUANT MATRIX */}
                  <div className="bg-background p-2 flex flex-col">
                    <div className="flex items-center gap-1 text-accent mb-2 shrink-0">
                      <Zap size={10} />
                      <span className="text-[8px] font-bold uppercase">Quant Matrix</span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                      {[
                        { label: 'PARK_VOL', val: (quantMetrics?.vol || 0).toFixed(5), color: 'text-text-primary' },
                        { label: 'SHARPE_R', val: '2.42', color: 'text-positive' },
                        { label: 'SORTINO', val: '3.12', color: 'text-positive' },
                        { label: 'CALMAR_R', val: '1.85', color: 'text-positive' },
                        { label: 'BETA_SPY', val: '1.12', color: 'text-text-primary' },
                        { label: 'ALPHA_GEN', val: '+0.45%', color: 'text-accent' },
                        { label: 'KURTOSIS', val: '4.12', color: 'text-text-secondary' },
                        { label: 'SKEWNESS', val: '-0.24', color: 'text-negative' },
                        { label: 'OMEGA_R', val: '1.85', color: 'text-positive' },
                        { label: 'VAR_99', val: '2.4%', color: 'text-negative' },
                        { label: 'EXP_RET', val: '12.4%', color: 'text-positive' },
                        { label: 'VOL_ANN', val: '18.2%', color: 'text-text-secondary' }
                      ].map(m => (
                        <div key={m.label} className="flex justify-between text-[8px] border-b border-border/30 pb-0.5">
                          <span className="text-text-tertiary">{m.label}</span>
                          <span className={`font-mono ${m.color}`}>{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QUAD 2: EXECUTION ENGINE */}
                  <div className="bg-background p-2 flex flex-col">
                    <div className="flex items-center gap-1 text-warning mb-2 shrink-0">
                      <Target size={10} />
                      <span className="text-[8px] font-bold uppercase">Execution Engine</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                      <div className="h-10 flex items-end gap-0.5 bg-surface-highlight/20 p-1 rounded-sm shrink-0">
                        {quantMetrics?.trajectory.slice(0, 24).map((val, i) => (
                          <div key={i} className="flex-1 bg-warning/20 border-t border-warning/40" style={{ height: `${(val / 1000) * 100}%` }} />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: 'ALGO_TYPE', val: 'VWAP_SMART', color: 'text-text-primary' },
                          { label: 'EST_SLIP', val: '0.42 BPS', color: 'text-warning' },
                          { label: 'FILL_PROB', val: '94.2%', color: 'text-positive' },
                          { label: 'URGENCY', val: 'MEDIUM', color: 'text-warning' },
                          { label: 'PART_RATE', val: '5.0%', color: 'text-text-secondary' },
                          { label: 'VENUE_OPT', val: 'IEX_DARK', color: 'text-accent' },
                          { label: 'VWAP_DIST', val: '-0.02%', color: 'text-positive' },
                          { label: 'POV_RATE', val: '10.0%', color: 'text-text-primary' },
                          { label: 'LMT_OFFSET', val: '0.5 TICKS', color: 'text-text-tertiary' },
                          { label: 'ROUTING', val: 'ADAPTIVE', color: 'text-accent' }
                        ].map(m => (
                          <div key={m.label} className="flex justify-between text-[8px] border-b border-border/30 pb-0.5">
                            <span className="text-text-tertiary">{m.label}</span>
                            <span className={`font-mono ${m.color}`}>{m.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* QUAD 3: RISK PARAMETERS */}
                  <div className="bg-background p-2 flex flex-col">
                    <div className="flex items-center gap-1 text-negative mb-2 shrink-0">
                      <ShieldAlert size={10} />
                      <span className="text-[8px] font-bold uppercase">Risk Parameters</span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] uppercase text-text-tertiary">
                          <span>Margin Utilization</span>
                          <span>65%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-highlight rounded-sm overflow-hidden">
                          <div className="h-full bg-negative w-[65%]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          { label: 'VAR_95', val: '$12.4K', color: 'text-text-primary' },
                          { label: 'CVAR_99', val: '$18.9K', color: 'text-negative' },
                          { label: 'MAX_DD', val: '-4.2%', color: 'text-negative' },
                          { label: 'LIQ_DIST', val: '14.2%', color: 'text-text-primary' },
                          { label: 'BETA_SPY', val: '1.12', color: 'text-warning' },
                          { label: 'CORR_DXY', val: '-0.82', color: 'text-negative' },
                          { label: 'EXP_GROSS', val: '$1.2M', color: 'text-text-secondary' },
                          { label: 'STRESS_L1', val: 'PASS', color: 'text-positive' },
                          { label: 'CONC_RISK', val: 'LOW', color: 'text-positive' },
                          { label: 'SECTOR_EXP', val: 'TECH_32%', color: 'text-warning' }
                        ].map(m => (
                          <div key={m.label} className="flex justify-between text-[8px] border-b border-border/30 pb-0.5">
                            <span className="text-text-tertiary">{m.label}</span>
                            <span className={`font-mono ${m.color}`}>{m.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* QUAD 4: LIQUIDITY MATRIX */}
                  <div className="bg-background p-2 flex flex-col">
                    <div className="flex items-center gap-1 text-blue-400 mb-2 shrink-0">
                      <Layers size={10} />
                      <span className="text-[8px] font-bold uppercase">Liquidity Matrix</span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        <div className="bg-surface-highlight/30 p-1 rounded-sm border border-border/50">
                          <div className="text-[7px] text-text-tertiary uppercase">Bid Depth</div>
                          <div className="text-[9px] font-mono text-positive">1.4M</div>
                        </div>
                        <div className="bg-surface-highlight/30 p-1 rounded-sm border border-border/50">
                          <div className="text-[7px] text-text-tertiary uppercase">Ask Depth</div>
                          <div className="text-[9px] font-mono text-negative">0.9M</div>
                        </div>
                      </div>
                      {[
                        { label: 'IMBALANCE', val: '+24.2%', color: 'text-positive' },
                        { label: 'SPREAD_BPS', val: '0.12', color: 'text-text-primary' },
                        { label: 'MKT_IMPACT', val: '0.04%', color: 'text-warning' },
                        { label: 'SLIP_CURVE', val: 'LINEAR', color: 'text-text-tertiary' },
                        { label: 'BOOK_SKEW', val: 'BULLISH', color: 'text-positive' },
                        { label: 'TAPE_SPEED', val: 'HIGH', color: 'text-accent' },
                        { label: 'HFT_ACTIVITY', val: 'MODERATE', color: 'text-warning' },
                        { label: 'SWEEP_PROB', val: '12.4%', color: 'text-text-secondary' },
                        { label: 'LARGE_ORD', val: 'DETECTED', color: 'text-negative' }
                      ].map(m => (
                        <div key={m.label} className="flex justify-between text-[8px] border-b border-border/30 pb-0.5">
                          <span className="text-text-tertiary">{m.label}</span>
                          <span className={`font-mono ${m.color}`}>{m.val}</span>
                        </div>
                      ))}
                      <div className="mt-2">
                        <SessionTracker tick={activeQuote} />
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