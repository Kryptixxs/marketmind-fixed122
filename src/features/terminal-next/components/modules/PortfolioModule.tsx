'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Exposure', 'Risk', 'Concentration'];

export function PortfolioModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Exposure';
  const layoutClass =
    selected === 'Exposure' ? 'grid-cols-[36%_34%_30%]' : selected === 'Risk' ? 'grid-cols-[32%_36%_32%]' : 'grid-cols-[40%_30%_30%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} PORT GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`port-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">PORT / EXPOSURE STACK</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-[2px] border-b border-[#142034] ${selected === t ? 'bg-[#2b3a07] text-[#efffc7]' : 'text-[#b6c8dd]'}`}>{t}</button>
          ))}
          {[['Gross', `${state.risk.grossExposure}`], ['Net', `${state.risk.netExposure}`], ['VaR', `${state.risk.intradayVar}`], ['Beta', `${state.risk.beta}`], ['Corr', `${state.risk.corrToBenchmark}`], ['Regime', state.risk.regime]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">POSITION DRIVER</div>
          {state.quotes.slice(0, 8).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">SECTOR CONCENTRATION GRID</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {state.risk.exposureBySector.map((x) => (
            <div key={x.sector} className="px-1 py-[2px] border-b border-[#142034] grid grid-cols-[1fr_1fr_auto]">
              <span className="text-[#9fb4cd]">{x.sector}</span>
              <span className="text-right text-[#b7c8dd]">{Math.abs(x.value)}</span>
              <span className={`text-right font-bold ${x.value >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{x.value >= 0 ? 'LONG' : 'SHORT'}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">PORTFLOW EVENTS</div>
        <div className="grid grid-rows-[55%_45%] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">{state.executionEvents.slice(0, 18).map((e) => <div key={e.id} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#d7e3f3]">{e.symbol} {e.status} {e.fillQty}@{e.fillPrice.toFixed(2)}</div>)}</div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">{state.systemFeed.slice(0, 12).map((s, i) => <div key={`${s}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#9fb4cd]">{s}</div>)}</div>
        </div>
      </section>
    </div>
  );
}
