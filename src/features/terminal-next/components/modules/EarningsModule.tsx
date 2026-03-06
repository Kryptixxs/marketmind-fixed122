'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';

const TABS = ['Earnings Calendar', 'Surprise', 'Guidance'];

export function EarningsModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Earnings Calendar';
  const layoutClass =
    selected === 'Earnings Calendar' ? 'grid-cols-[38%_62%]' : selected === 'Surprise' ? 'grid-cols-[46%_54%]' : 'grid-cols-[34%_66%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} WEI GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };
  const rows =
    selected === 'Earnings Calendar'
      ? [['T+1', ref?.earningsDates[0] ?? 'N/A'], ['T+2', ref?.earningsDates[1] ?? 'N/A'], ['DeskFocus', state.activeSymbol], ['Regime', state.risk.regime]]
      : selected === 'Surprise'
        ? [['EPS Surprise', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`], ['Revenue Surprise', `${(state.microstructure.imbalance * 100).toFixed(1)}%`], ['Signal', state.microstructure.orderFlowImbalance >= 0 ? 'POSITIVE' : 'NEGATIVE'], ['Dispersion', 'MEDIUM']]
        : [['Guidance Tone', 'Neutral-Positive'], ['Revision Dispersion', 'Medium'], ['Uncertainty', `${state.risk.impliedVolProxy}%`], ['Analyst Breadth', '78 covered']];

  return (
    <div key={`wei-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">WEI / EARNINGS MATRIX</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-[2px] border-b border-[#142034] ${selected === t ? 'bg-[#2b3a07] text-[#efffc7]' : 'text-[#b6c8dd]'}`}>{t}</button>
          ))}
          {rows.map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">WATCHLIST</div>
          {state.quotes.slice(0, 8).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">EARNINGS NEWSFLOW + REVISIONS</div>
        <div className="grid grid-rows-[60%_40%] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">{state.headlines.slice(0, 18).map((h, i) => <div key={`${h}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#d7e3f3]">{h}</div>)}</div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">{state.systemFeed.slice(0, 14).map((h, i) => <div key={`${h}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#9fb4cd]">{h}</div>)}</div>
        </div>
      </section>
    </div>
  );
}
