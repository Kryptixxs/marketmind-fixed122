'use client';

import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function DeskStatusStrip() {
  const { deskStats, clocks, dispatch, state } = useTerminalStore();

  return (
    <div className="h-[14px] border-b border-[#111] bg-black px-[2px] flex items-center justify-between text-[8px] font-mono tracking-tight uppercase tabular-nums">
      <div className="flex items-center gap-[4px] text-[#a4b8d2]">
        <button onClick={() => dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'OVERVIEW' })}>Adv/Dec {deskStats.adv}/{deskStats.dec}</button>
        <button onClick={() => dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'FACTORS' })}>Breadth {fmt(deskStats.breadth, 0)}%</button>
        <button onClick={() => dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'EVENTS' })}>AvgMove {fmt(deskStats.avgMove, 2)}%</button>
        <button onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'DEPTH' })}>Spread {fmt(deskStats.spread, 1)}bp</button>
        <button onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'TAPE' })}>Latency {deskStats.latency}ms</button>
        <button onClick={() => dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'EVENTS' })}>VaR {fmt(state.risk.intradayVar, 0)}</button>
        <span className={state.risk.regime === 'VOL_EXPANSION' ? 'text-red-500' : state.risk.regime === 'TREND' ? 'text-green-500' : 'text-gray-400'}>{state.risk.regime}</span>
      </div>
      <div className="flex items-center gap-[4px] text-[#a4b8d2]">
        <button onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: state.feedTab === 'NEWS' ? 'SYSTEM' : 'NEWS' })}>NY {clocks.ny}</button>
        <span>LDN {clocks.ldn}</span>
        <span>HKG {clocks.hkg}</span>
        <span>TKY {clocks.tky}</span>
      </div>
    </div>
  );
}
