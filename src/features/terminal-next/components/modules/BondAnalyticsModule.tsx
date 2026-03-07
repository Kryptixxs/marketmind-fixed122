'use client';

import { useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const TABS = ['Yield', 'Duration', 'Spread'];

export function BondAnalyticsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Yield';
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);
  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const tenors = depth?.bond.curve.map((r) => [r.tenor, r.yld] as const) ?? [
    ['2Y', 4.44 + state.microstructure.orderFlowImbalance * 0.2],
    ['5Y', 4.18 + state.microstructure.imbalance * 0.2],
    ['10Y', 4.12 + state.microstructure.orderFlowImbalance * 0.15],
    ['30Y', 4.28 + state.microstructure.imbalance * 0.15],
  ];
  const layoutClass =
    selected === 'Yield' ? 'grid-cols-[34%_33%_33%]' : selected === 'Duration' ? 'grid-cols-[30%_38%_32%]' : 'grid-cols-[36%_28%_36%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} YAS GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`yas-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-black`}>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">YAS / TERM STRUCTURE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-[2px] border-b border-[#1a1a1a] ${selected === t ? 'bg-[#2b3a07] text-[#efffc7]' : 'text-[#b6c8dd]'}`}>{t}</button>
          ))}
          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">BOND WATCH</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
            </button>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">CURVE TABLE</div>
          {tenors.map(([t, y], i) => (
            <div key={t} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_1fr_auto_auto] text-[8px]">
              <span className="text-[#9fb4cd]">{t}</span>
              <span className="mx-1 h-[6px] self-center bg-[#132338] relative">
                <span className="absolute left-0 top-0 h-full bg-[#2d6fa5]" style={{ width: `${Math.min(100, Math.max(5, Math.round((y - 3.8) * 90)))}%` }} />
              </span>
              <span className="text-right text-[#e7f1ff]">{y.toFixed(3)}%</span>
              <span className={`text-right font-bold ${i % 2 === 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{i % 2 === 0 ? '+' : '-'}{(Math.abs(state.microstructure.imbalance) * (i + 1) * 1.8).toFixed(2)}bp</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">LIQUIDITY LADDER</div>
          {(depth?.bond.liquidityLadder ?? []).map((l) => (
            <div key={l.bucket} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_1fr_1fr_auto] text-[8px] gap-2">
              <span className="text-[#9fb4cd]">{l.bucket}</span>
              <span className="text-[#4ce0a5]">B {l.bidDepth}</span>
              <span className="text-[#ff7ca3]">A {l.askDepth}</span>
              <span className="text-[#e7f1ff]">{l.turnoverPct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">YIELD/RISK GRID</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['YTM', `${(4.86 + state.microstructure.orderFlowImbalance * 0.25).toFixed(3)}%`], ['YTW', `${(4.91 + state.microstructure.imbalance * 0.2).toFixed(3)}%`], ['Duration', `${(7.18 + state.risk.beta * 0.2).toFixed(2)}`], ['Convexity', `${(0.9 + Math.abs(state.microstructure.imbalance) * 0.35).toFixed(2)}`], ['DV01', `$${(18.3 + state.risk.grossExposure * 0.03).toFixed(1)}k`], ['OAS', `${(186 + state.microstructure.insideSpreadBps * 2.2).toFixed(0)} bps`], ['ZSpread', `${(172 + state.microstructure.insideSpreadBps * 1.6).toFixed(0)} bps`], ['BidDepth', `${state.orderBook.reduce((a, b) => a + b.bidSize, 0)}`], ['AskDepth', `${state.orderBook.reduce((a, b) => a + b.askSize, 0)}`], ['Regime', state.risk.regime], ['OFI', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`], ['Imbalance', `${(state.microstructure.imbalance * 100).toFixed(1)}%`]].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
          {(depth?.bond.curve ?? []).map((r) => (
            <div key={`curve-${r.tenor}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_auto_auto_auto] gap-2 text-[8px]">
              <span className="text-[#9fb4cd]">{r.tenor}</span>
              <span className="text-[#e7f1ff]">OAS {r.oas.toFixed(1)}</span>
              <span className="text-[#e7f1ff]">Z {r.zSpread.toFixed(1)}</span>
              <span className="text-[#9fb4cd]">DV01 {r.dv01.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">MICRO / SPREAD TAPE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[8px]">
          <div className="grid grid-cols-2 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a]">
            <div className="px-1 py-[2px] bg-[#0a0a0a] text-[#9fb4cd]">BidCum <span className="text-[#4ce0a5] font-bold">{state.orderBook.reduce((a, b) => a + b.cumBidSize, 0)}</span></div>
            <div className="px-1 py-[2px] bg-[#0a0a0a] text-[#9fb4cd]">AskCum <span className="text-[#ff7ca3] font-bold">{state.orderBook.reduce((a, b) => a + b.cumAskSize, 0)}</span></div>
          </div>
          {state.tape.map((t) => <div key={t.id} className="px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_1fr_auto_auto]"><span className="text-[#9fb4cd]">{t.time}</span><span className={t.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{t.price.toFixed(2)}</span><span className="text-right text-[#d7e3f3]">{t.size}</span><span className={t.isSweep ? 'text-[#ffaf66] font-bold text-right' : 'text-[#6e85a3] text-right'}>{t.isSweep ? 'SWP' : 'N'}</span></div>)}
          {(depth?.bond.spreadHistory ?? []).map((s) => (
            <div key={s.date} className="px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#9fb4cd]">{s.date}</span>
              <span className="text-[#e7f1ff]">OAS {s.oas.toFixed(1)}</span>
              <span className="text-[#b7c8dd]">Z {s.zSpread.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
