'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Skew', 'Surface', 'Greeks'];

export function OptionsAnalyticsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Skew';
  const layoutClass = selected === 'Skew' ? 'grid-cols-[50%_50%]' : selected === 'Surface' ? 'grid-cols-[56%_44%]' : 'grid-cols-[44%_56%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} OVME GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`ovme-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] flex items-center justify-between">
          <span className="text-[#f4cf76] font-bold">OVME / VOLATILITY SURFACE</span>
          <div className="flex items-center gap-1">{TABS.map((t) => <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`px-1 border text-[8px] ${selected === t ? 'border-[#95ca2d] bg-[#2b3a07] text-[#efffc7]' : 'border-[#4f3a18] bg-[#18130a] text-[#d8be8d]'}`}>{t}</button>)}</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['25D RR', '1.8'], ['25D BF', '0.7'], ['ATM IV', `${state.risk.impliedVolProxy}%`], ['Skew Slope', '0.12'], ['Term Curvature', '0.05'], ['Spot-Vol Corr', '-0.31']].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">UNDERLYING</div>
          {state.quotes.slice(0, 8).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">GREEKS / RISK DELTA</div>
        <div className="grid grid-rows-[58%_42%] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
            {[['Delta', '0.42'], ['Gamma', '0.08'], ['Vega', '0.21'], ['Theta', '-0.03'], ['Charm', '-0.02'], ['Vanna', '0.04']].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
          </div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar text-[8px]">
            {state.systemFeed.slice(0, 14).map((l, i) => <div key={`${l}-${i}`} className="px-1 py-[1px] border-b border-[#142034] text-[#b7c8dd]">{l}</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
