'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Exposure', 'Risk', 'Concentration'];

export function PortfolioModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Exposure';
  const topPositions = [...state.blotter].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 12);
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
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">RISK DECOMPOSITION</div>
          {[['LongGross', (state.risk.grossExposure * 0.58).toFixed(1)], ['ShortGross', (state.risk.grossExposure * 0.42).toFixed(1)], ['Top3Conc', `${Math.min(100, state.risk.concentration + 12).toFixed(1)}%`], ['TailRisk', `${(state.risk.intradayVar * 1.35).toFixed(1)}`], ['VolRegime', state.risk.regime]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] grid grid-cols-[1fr_1fr]">
              <span className="text-[#9fb4cd]">{k}</span>
              <span className="text-right text-[#e7f1ff] font-bold">{v}</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">POSITION DRIVER</div>
          {state.quotes.slice(0, 18).map((q) => (
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
              <span className="text-right text-[#b7c8dd]">
                <span className="inline-block h-[6px] align-middle mr-1 bg-[#132338] w-12 relative">
                  <span className={`absolute top-0 left-0 h-full ${x.value >= 0 ? 'bg-[#2f7f61]' : 'bg-[#7f2f49]'}`} style={{ width: `${Math.min(100, Math.round(Math.abs(x.value) * 2.2))}%` }} />
                </span>
                {Math.abs(x.value)}
              </span>
              <span className={`text-right font-bold ${x.value >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{x.value >= 0 ? 'LONG' : 'SHORT'}</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">TOP POSITIONS BY PNL</div>
          {topPositions.map((p) => (
            <div key={`tp-${p.id}`} className="px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#d7e3f3] truncate">{p.symbol}</span>
              <span className="text-right text-[#9fb4cd]">{p.qty}</span>
              <span className={`text-right font-bold ${p.pnl >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{p.pnl.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">PORTFLOW EVENTS</div>
        <div className="grid grid-rows-[55%_45%] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {state.executionEvents.slice(0, 26).map((e) => <div key={e.id} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#d7e3f3]">{e.symbol} {e.status} {e.fillQty}@{e.fillPrice.toFixed(2)}</div>)}
            {topPositions.slice(0, 8).map((p) => <div key={`evt-${p.id}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#6e85a3]">RISKCHK {p.symbol} {p.side} PNL {p.pnl.toFixed(0)}</div>)}
          </div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {state.systemFeed.slice(0, 20).map((s, i) => <div key={`${s}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#9fb4cd]">{s}</div>)}
            {state.alerts.slice(0, 10).map((a, i) => <div key={`al-${a}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#e3b4ff]">{a}</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
