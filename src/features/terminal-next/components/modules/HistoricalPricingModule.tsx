'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';

const TABS = ['Daily', 'Intraday', 'Adjusted'];

export function HistoricalPricingModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Daily';
  const bars = state.barsBySymbol[state.activeSymbol] ?? [];
  const recent = bars.slice(-24);
  const layoutClass =
    selected === 'Daily'
      ? 'grid-cols-[58%_42%] grid-rows-[66%_34%]'
      : selected === 'Intraday'
        ? 'grid-cols-[64%_36%] grid-rows-[72%_28%]'
        : 'grid-cols-[52%_48%] grid-rows-[60%_40%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} HP GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`hp-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] flex items-center justify-between">
          <span className="text-[#f4cf76] font-bold">HP / HISTORICAL PRICING</span>
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`px-1 border text-[8px] ${selected === t ? 'border-[#95ca2d] bg-[#2b3a07] text-[#efffc7]' : 'border-[#4f3a18] bg-[#18130a] text-[#d8be8d]'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-[9px] tabular-nums">
            <thead className="sticky top-0 bg-[#09111c] text-[#9fb4cd]">
              <tr><th className="text-left px-1 py-[1px]">Date/Time</th><th className="text-right px-1 py-[1px]">Open</th><th className="text-right px-1 py-[1px]">High</th><th className="text-right px-1 py-[1px]">Low</th><th className="text-right px-1 py-[1px]">Close</th><th className="text-right px-1 py-[1px]">Vol</th></tr>
            </thead>
            <tbody>
              {(selected === 'Daily'
                ? (ref?.dailyBars ?? []).slice(-24).map((d) => ({ ts: d.date, open: d.close * 0.997, high: d.close * 1.006, low: d.close * 0.994, close: d.close, volume: d.volume }))
                : recent.map((b) => ({ ts: new Date(b.ts).toISOString().slice(11, 19), ...b }))
              ).map((b, i) => (
                <tr key={`${b.ts}-${i}`} className="border-t border-[#142034]">
                  <td className="px-1 py-[1px] text-[#d8e4f4]">{String(b.ts)}</td>
                  <td className="px-1 py-[1px] text-right text-[#bcd1ea]">{b.open.toFixed(2)}</td>
                  <td className="px-1 py-[1px] text-right text-[#4ce0a5]">{b.high.toFixed(2)}</td>
                  <td className="px-1 py-[1px] text-right text-[#ff7ca3]">{b.low.toFixed(2)}</td>
                  <td className="px-1 py-[1px] text-right text-[#eaf3ff] font-bold">{b.close.toFixed(2)}</td>
                  <td className="px-1 py-[1px] text-right text-[#9fb4cd]">{Math.round(b.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">SYMBOL SWITCH</div>
          {state.quotes.slice(0, 8).map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">HP ANALYTICS STACK</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['Window', selected === 'Daily' ? '24 sessions' : '24 bars'], ['RV', `${state.risk.realizedVol}%`], ['IVx', `${state.risk.impliedVolProxy}%`], ['Beta', `${state.risk.beta}`], ['Corr', `${state.risk.corrToBenchmark}`], ['Momentum', `${state.quotes.find((q) => q.symbol === state.activeSymbol)?.momentum ?? 0}`], ['Liquidity', `${state.quotes.find((q) => q.symbol === state.activeSymbol)?.liquidityScore ?? 0}`], ['Regime', state.risk.regime], ['Spread', `${state.microstructure.insideSpreadBps}bp`], ['OFI', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">HP EVENT TAPE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {state.executionEvents.slice(0, 12).map((e) => (
            <div key={e.id} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#b7c8dd]">{e.symbol} {e.status} {e.fillQty}@{e.fillPrice.toFixed(2)}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
