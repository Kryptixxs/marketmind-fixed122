'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Yield', 'Duration', 'Spread'];

export function BondAnalyticsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Yield';
  const tenors = [
    ['2Y', 4.44 + state.microstructure.orderFlowImbalance * 0.2],
    ['5Y', 4.18 + state.microstructure.imbalance * 0.2],
    ['10Y', 4.12 + state.microstructure.orderFlowImbalance * 0.15],
    ['30Y', 4.28 + state.microstructure.imbalance * 0.15],
  ] as const;
  const layoutClass =
    selected === 'Yield' ? 'grid-cols-[34%_33%_33%]' : selected === 'Duration' ? 'grid-cols-[30%_38%_32%]' : 'grid-cols-[36%_28%_36%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} YAS GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`yas-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">YAS / TERM STRUCTURE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-[2px] border-b border-[#142034] ${selected === t ? 'bg-[#2b3a07] text-[#efffc7]' : 'text-[#b6c8dd]'}`}>{t}</button>
          ))}
          <div className="h-4 px-1 border-b border-[#142034] text-[8px] text-[#f4cf76] flex items-center">BOND WATCH</div>
          {state.quotes.slice(0, 14).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
            </button>
          ))}
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">CURVE TABLE</div>
          {tenors.map(([t, y], i) => (
            <div key={t} className="px-1 py-[2px] border-b border-[#142034] grid grid-cols-[auto_1fr_auto_auto] text-[8px]">
              <span className="text-[#9fb4cd]">{t}</span>
              <span className="mx-1 h-[6px] self-center bg-[#132338] relative">
                <span className="absolute left-0 top-0 h-full bg-[#2d6fa5]" style={{ width: `${Math.min(100, Math.max(5, Math.round((y - 3.8) * 90)))}%` }} />
              </span>
              <span className="text-right text-[#e7f1ff]">{y.toFixed(3)}%</span>
              <span className={`text-right font-bold ${i % 2 === 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{i % 2 === 0 ? '+' : '-'}{(Math.abs(state.microstructure.imbalance) * (i + 1) * 1.8).toFixed(2)}bp</span>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">YIELD/RISK GRID</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['YTM', `${(4.86 + state.microstructure.orderFlowImbalance * 0.25).toFixed(3)}%`], ['YTW', `${(4.91 + state.microstructure.imbalance * 0.2).toFixed(3)}%`], ['Duration', `${(7.18 + state.risk.beta * 0.2).toFixed(2)}`], ['Convexity', `${(0.9 + Math.abs(state.microstructure.imbalance) * 0.35).toFixed(2)}`], ['DV01', `$${(18.3 + state.risk.grossExposure * 0.03).toFixed(1)}k`], ['OAS', `${(186 + state.microstructure.insideSpreadBps * 2.2).toFixed(0)} bps`], ['ZSpread', `${(172 + state.microstructure.insideSpreadBps * 1.6).toFixed(0)} bps`], ['BidDepth', `${state.orderBook.slice(0, 8).reduce((a, b) => a + b.bidSize, 0)}`], ['AskDepth', `${state.orderBook.slice(0, 8).reduce((a, b) => a + b.askSize, 0)}`], ['Regime', state.risk.regime], ['OFI', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`], ['Imbalance', `${(state.microstructure.imbalance * 100).toFixed(1)}%`]].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">MICRO / SPREAD TAPE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[8px]">
          <div className="grid grid-cols-2 gap-px bg-[#1a2433] border-b border-[#142034]">
            <div className="px-1 py-[2px] bg-[#08111d] text-[#9fb4cd]">BidCum <span className="text-[#4ce0a5] font-bold">{state.orderBook.slice(0, 10).reduce((a, b) => a + b.cumBidSize, 0)}</span></div>
            <div className="px-1 py-[2px] bg-[#08111d] text-[#9fb4cd]">AskCum <span className="text-[#ff7ca3] font-bold">{state.orderBook.slice(0, 10).reduce((a, b) => a + b.cumAskSize, 0)}</span></div>
          </div>
          {state.tape.slice(0, 30).map((t) => <div key={t.id} className="px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_1fr_auto_auto]"><span className="text-[#9fb4cd]">{t.time}</span><span className={t.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{t.price.toFixed(2)}</span><span className="text-right text-[#d7e3f3]">{t.size}</span><span className={t.isSweep ? 'text-[#ffaf66] font-bold text-right' : 'text-[#6e85a3] text-right'}>{t.isSweep ? 'SWP' : 'N'}</span></div>)}
        </div>
      </section>
    </div>
  );
}
