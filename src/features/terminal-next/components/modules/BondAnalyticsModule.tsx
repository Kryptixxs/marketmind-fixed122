'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Yield', 'Duration', 'Spread'];

export function BondAnalyticsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Yield';
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
          {state.quotes.slice(0, 6).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
            </button>
          ))}
          {['2Y 4.44', '5Y 4.18', '10Y 4.12', '30Y 4.28', 'Curve +4bp', 'Steepener +2bp'].map((x) => <div key={x} className="px-1 py-[2px] border-b border-[#142034] text-[#d7e3f3]">{x}</div>)}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">YIELD/RISK GRID</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['YTM', '4.86%'], ['YTW', '4.91%'], ['Duration', '7.18'], ['Convexity', '0.90'], ['DV01', '$18.3k'], ['OAS', '186 bps'], ['ZSpread', '172 bps']].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">MICRO / SPREAD TAPE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[8px]">
          {state.tape.slice(0, 20).map((t) => <div key={t.id} className="px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_1fr_auto]"><span className="text-[#9fb4cd]">{t.time}</span><span className={t.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{t.price.toFixed(2)}</span><span className="text-right text-[#d7e3f3]">{t.size}</span></div>)}
        </div>
      </section>
    </div>
  );
}
