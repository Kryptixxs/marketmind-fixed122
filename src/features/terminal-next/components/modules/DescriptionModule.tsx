'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';

const TABS = ['Overview', 'Capital Structure', 'Ratings', 'Corporate Actions'];

export function DescriptionModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Overview';
  const layoutClass =
    selected === 'Overview'
      ? 'grid-cols-[26%_44%_30%] grid-rows-[62%_38%]'
      : selected === 'Capital Structure'
        ? 'grid-cols-[22%_48%_30%] grid-rows-[54%_46%]'
        : selected === 'Ratings'
          ? 'grid-cols-[30%_36%_34%] grid-rows-[50%_50%]'
          : 'grid-cols-[24%_46%_30%] grid-rows-[58%_42%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} DES GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`des-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] flex items-center justify-between">
          <span className="text-[#f4cf76] font-bold">DES / ISSUER CONTEXT</span>
          <span className="text-[#9eb3cf]">{selected}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })}
              className={`w-full text-left px-1 py-[2px] border-b border-[#142034] ${selected === t ? 'bg-[#2b3a07] text-[#efffc7]' : 'text-[#b6c8dd]'}`}
            >
              {t}
            </button>
          ))}
          <div className="h-4 px-1 border-b border-[#142034] text-[8px] text-[#f4cf76] flex items-center">SECURITY LIST</div>
          {state.quotes.slice(0, 12).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
          <div className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#93a9c6]">Sector</span><span className="text-[#e0eaf7] font-bold">{ref?.sector ?? 'N/A'}</span></div>
          <div className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#93a9c6]">Industry</span><span className="text-[#e0eaf7] font-bold">{ref?.industry ?? 'N/A'}</span></div>
          <div className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#93a9c6]">Country</span><span className="text-[#e0eaf7] font-bold">{ref?.country ?? 'N/A'}</span></div>
          <div className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#93a9c6]">Exchange</span><span className="text-[#e0eaf7] font-bold">{ref?.exchange ?? 'N/A'}</span></div>
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">DESCRIPTION GRID</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['Market Cap', `${ref?.marketCapBn ?? 0} Bn`], ['Float', `${ref?.floatBn ?? 0} Bn`], ['S&P', ref?.ratings.sp ?? 'N/A'], ['Moody`s', ref?.ratings.moodys ?? 'N/A'], ['Fitch', ref?.ratings.fitch ?? 'N/A'], ['Next Earnings', ref?.earningsDates[0] ?? 'N/A'], ['2nd Earnings', ref?.earningsDates[1] ?? 'N/A'], ['Regime', state.risk.regime], ['Corr', `${state.risk.corrToBenchmark}`], ['Beta', `${state.risk.beta}`], ['Liquidity', `${state.quotes.find((q) => q.symbol === state.activeSymbol)?.liquidityScore ?? 0}`], ['Clock', new Date(state.tickMs).toISOString().slice(11, 19)]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] grid grid-cols-[1.2fr_1fr]">
              <span className="text-[#9fb4cd]">{k}</span>
              <span className="text-[#e7f1ff] font-bold text-right">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">CORPORATE EVENTS + SYSTEM</div>
        <div className="grid grid-rows-[56%_44%] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {[...state.headlines.slice(0, 12), ...(ref?.earningsDates ?? [])].map((line, i) => (
              <div key={`${line}-${i}`} className="text-[9px] px-1 py-[1px] border-b border-[#142034] text-[#cdd9ea]">{line}</div>
            ))}
          </div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {state.systemFeed.slice(0, 14).map((line, i) => (
              <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#9fb4cd]">{line}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">CAPITAL STRUCTURE SNAPSHOT</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['Debt Tier', 'Senior Unsecured'], ['Leverage', '1.8x'], ['Coverage', '12.4x'], ['Maturity', '4.2Y'], ['Implied Vol', `${state.risk.impliedVolProxy}%`], ['Intraday VaR', `${state.risk.intradayVar}`], ['Concentration', `${state.risk.concentration}%`]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}
