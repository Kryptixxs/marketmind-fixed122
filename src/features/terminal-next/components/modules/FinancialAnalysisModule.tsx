'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Estimates'];

const SHEETS: Record<string, Array<[string, string, string, string]>> = {
  'Income Statement': [['Revenue', '$389.5B', '$381.2B', '+2.2%'], ['EBIT', '$119.4B', '$114.7B', '+4.1%'], ['Net Income', '$96.8B', '$93.1B', '+4.0%'], ['EPS', '6.23', '5.98', '+4.2%']],
  'Balance Sheet': [['Assets', '$352.5B', '$344.1B', '+2.4%'], ['Liabilities', '$291.4B', '$286.6B', '+1.7%'], ['Equity', '$61.1B', '$57.5B', '+6.3%'], ['Net Debt', '$72.8B', '$75.1B', '-3.1%']],
  'Cash Flow': [['OCF', '$121.3B', '$117.9B', '+2.9%'], ['CapEx', '$10.9B', '$11.6B', '-6.0%'], ['FCF', '$110.4B', '$106.3B', '+3.9%'], ['Buybacks', '$87.2B', '$80.7B', '+8.1%']],
  Estimates: [['NextQ EPS', '6.23', '6.11', '+2.0%'], ['FY EPS', '25.74', '25.10', '+2.5%'], ['NextQ Rev', '$96.5B', '$94.9B', '+1.7%'], ['FY Rev', '$402.3B', '$395.1B', '+1.8%']],
};

export function FinancialAnalysisModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Income Statement';
  const layoutClass =
    selected === 'Income Statement'
      ? 'grid-cols-[70%_30%] grid-rows-[60%_40%]'
      : selected === 'Balance Sheet'
        ? 'grid-cols-[64%_36%] grid-rows-[50%_50%]'
        : selected === 'Cash Flow'
          ? 'grid-cols-[76%_24%] grid-rows-[58%_42%]'
          : 'grid-cols-[68%_32%] grid-rows-[54%_46%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} FA GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`fa-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-[#20170a]`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] flex items-center justify-between">
          <span className="text-[#f4cf76] font-bold">FA / FINANCIAL ANALYSIS</span>
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })}
                className={`px-1 border text-[8px] ${selected === t ? 'border-[#95ca2d] bg-[#2b3a07] text-[#efffc7]' : 'border-[#4f3a18] bg-[#18130a] text-[#d8be8d]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-[9px] tabular-nums">
            <thead className="sticky top-0 bg-[#09111c] text-[#9fb4cd]">
              <tr><th className="text-left px-1 py-[1px]">Metric</th><th className="text-right px-1 py-[1px]">Current</th><th className="text-right px-1 py-[1px]">Prior</th><th className="text-right px-1 py-[1px]">Delta</th></tr>
            </thead>
            <tbody>
              {(SHEETS[selected] ?? []).map(([m, c, p, d]) => (
                <tr key={m} className="border-t border-[#142034]">
                  <td className="px-1 py-[1px] text-[#d8e4f4]">{m}</td>
                  <td className="px-1 py-[1px] text-right text-[#eaf3ff]">{c}</td>
                  <td className="px-1 py-[1px] text-right text-[#b2c4db]">{p}</td>
                  <td className={`px-1 py-[1px] text-right font-bold ${d.startsWith('+') ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4 px-1 border-y border-[#142034] text-[8px] text-[#f4cf76] flex items-center">SYMBOL RECOMPOSE</div>
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
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">REVISION FLOW</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {state.systemFeed.slice(0, 16).map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#9fb4cd]">{line}</div>
          ))}
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#2a2416] bg-[#0b1320] text-[10px] text-[#f4cf76] font-bold flex items-center">FA DIAGNOSTICS</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['Gross', `${state.risk.grossExposure}`], ['Net', `${state.risk.netExposure}`], ['Beta', `${state.risk.beta}`], ['Corr', `${state.risk.corrToBenchmark}`], ['RV', `${state.risk.realizedVol}%`], ['IVx', `${state.risk.impliedVolProxy}%`], ['Regime', state.risk.regime]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#142034] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}
