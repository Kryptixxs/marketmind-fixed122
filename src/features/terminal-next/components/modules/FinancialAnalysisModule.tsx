'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Estimates'];

const SHEETS: Record<string, Array<[string, string, string, string]>> = {
  'Income Statement': [
    ['Revenue', '$389.5B', '$381.2B', '+2.2%'], ['EBIT', '$119.4B', '$114.7B', '+4.1%'], ['Net Income', '$96.8B', '$93.1B', '+4.0%'], ['EPS', '6.23', '5.98', '+4.2%'],
    ['Gross Margin', '45.6%', '44.8%', '+0.8pp'], ['Op Margin', '30.3%', '29.1%', '+1.2pp'], ['Tax Rate', '14.2%', '14.8%', '-0.6pp'], ['R&D', '$29.1B', '$27.4B', '+6.2%'],
    ['SG&A', '$24.8B', '$23.9B', '+3.8%'], ['D&A', '$11.2B', '$10.8B', '+3.7%'], ['Interest', '$2.9B', '$3.1B', '-6.5%'], ['Other Inc', '$1.2B', '$0.9B', '+33%'],
  ],
  'Balance Sheet': [
    ['Assets', '$352.5B', '$344.1B', '+2.4%'], ['Liabilities', '$291.4B', '$286.6B', '+1.7%'], ['Equity', '$61.1B', '$57.5B', '+6.3%'], ['Net Debt', '$72.8B', '$75.1B', '-3.1%'],
    ['Cash', '$61.6B', '$59.2B', '+4.1%'], ['Inventory', '$6.3B', '$6.1B', '+3.3%'], ['AR', '$64.2B', '$61.4B', '+4.6%'], ['PP&E', '$42.5B', '$41.2B', '+3.2%'],
    ['Goodwill', '$0', '$0', 'flat'], ['Intangibles', '$3.2B', '$3.4B', '-5.9%'], ['ST Debt', '$9.8B', '$10.1B', '-3.0%'], ['LT Debt', '$95.3B', '$97.2B', '-2.0%'],
  ],
  'Cash Flow': [
    ['OCF', '$121.3B', '$117.9B', '+2.9%'], ['CapEx', '$10.9B', '$11.6B', '-6.0%'], ['FCF', '$110.4B', '$106.3B', '+3.9%'], ['Buybacks', '$87.2B', '$80.7B', '+8.1%'],
    ['Dividends', '$15.0B', '$14.9B', '+0.7%'], ['Acquisitions', '$0.5B', '$1.2B', '-58%'], ['Debt Issued', '$2.0B', '$3.5B', '-43%'], ['Debt Repaid', '$4.2B', '$3.8B', '+11%'],
    ['Stock Issued', '$0.1B', '$0.2B', '-50%'], ['D&A Addback', '$11.2B', '$10.8B', '+3.7%'], ['WC Change', '$-2.1B', '$-1.8B', '+17%'], ['Other CF', '$0.3B', '$0.2B', '+50%'],
  ],
  Estimates: [
    ['NextQ EPS', '6.23', '6.11', '+2.0%'], ['FY EPS', '25.74', '25.10', '+2.5%'], ['NextQ Rev', '$96.5B', '$94.9B', '+1.7%'], ['FY Rev', '$402.3B', '$395.1B', '+1.8%'],
    ['FY+1 EPS', '27.82', '27.10', '+2.7%'], ['FY+1 Rev', '$418.5B', '$412.0B', '+1.6%'], ['LT Growth', '8.2%', '7.9%', '+0.3pp'], ['Target Price', '$245', '$238', '+2.9%'],
    ['Consensus', 'BUY', 'BUY', 'flat'], ['Upgrades', '12', '10', '+2'], ['Downgrades', '1', '2', '-1'], ['Revisions 90d', '+3.1%', '+2.8%', '+0.3pp'],
  ],
};

export function FinancialAnalysisModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Income Statement';
  const layoutClass =
    selected === 'Income Statement'
      ? 'grid-cols-[70%_30%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
      : selected === 'Balance Sheet'
        ? 'grid-cols-[64%_36%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
        : selected === 'Cash Flow'
          ? 'grid-cols-[76%_24%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
          : 'grid-cols-[68%_32%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} FA GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`fa-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-black`}>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] flex items-center justify-between">
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
            <thead className="sticky top-0 bg-[#0a0a0a] text-[#9fb4cd]">
              <tr><th className="text-left px-1 py-[1px]">Metric</th><th className="text-right px-1 py-[1px]">Current</th><th className="text-right px-1 py-[1px]">Prior</th><th className="text-right px-1 py-[1px]">Delta</th></tr>
            </thead>
            <tbody>
              {(SHEETS[selected] ?? []).map(([m, c, p, d]) => (
                <tr key={m} className="border-t border-[#1a1a1a]">
                  <td className="px-1 py-[1px] text-[#d8e4f4]">{m}</td>
                  <td className="px-1 py-[1px] text-right text-[#eaf3ff]">{c}</td>
                  <td className="px-1 py-[1px] text-right text-[#b2c4db]">{p}</td>
                  <td className={`px-1 py-[1px] text-right font-bold ${d.startsWith('+') ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">SYMBOL RECOMPOSE</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">ESTIMATE REVISIONS</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black">
          {[
            `EPS UP ${state.activeSymbol} FY26 +2.1% cons $25.74`,
            `REV UP ${state.activeSymbol} FY26 +0.8% cons $402.3B`,
            `PT RAISE ${state.activeSymbol} $245 tgt (was $238)`,
            `MARGIN REV ${state.activeSymbol} op mgn +0.3pp`,
            `EPS DOWN ${state.activeSymbol} FY27 -0.5% cons $27.82`,
            `REV FLAT ${state.activeSymbol} FY27 cons $418.5B`,
            `UPGRADE ${state.activeSymbol} 2 brokers PT +4%`,
            `DOWNGRADE ${state.activeSymbol} 1 broker PT -2%`,
            `SURPRISE ${state.activeSymbol} LQ EPS beat +3.2%`,
            `GUIDANCE ${state.activeSymbol} FY26 raised +1.5%`,
            `CONSENSUS ${state.activeSymbol} 42 buys 8 holds`,
            `REVISION 90d ${state.activeSymbol} EPS +3.1% Rev +1.8%`,
            `EPS UP ${state.activeSymbol} FY25 Q4 +1.2% cons $1.58`,
            `REV UP ${state.activeSymbol} FY25 Q4 +0.4% cons $96.2B`,
            `PT RAISE ${state.activeSymbol} 3 brokers avg +$12`,
            `MARGIN REV ${state.activeSymbol} gross +0.2pp FY26`,
            `EPS DOWN ${state.activeSymbol} FY28 -0.3% cons $29.10`,
            `REV FLAT ${state.activeSymbol} FY28 cons $432B`,
            `UPGRADE ${state.activeSymbol} 1 broker PT $252`,
            `DOWNGRADE ${state.activeSymbol} 1 broker PT $228`,
            `SURPRISE ${state.activeSymbol} LQ Rev beat +2.1%`,
            `GUIDANCE ${state.activeSymbol} FY27 init +2%`,
            `CONSENSUS ${state.activeSymbol} 38 buys 12 holds`,
            `REVISION 30d ${state.activeSymbol} EPS +1.2% Rev +0.9%`,
          ].map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">{line}</div>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">VALUATION + METRICS</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px] bg-black">
          {[['P/E', '31.2'], ['EV/EBITDA', '22.4'], ['PEG', '1.8'], ['ROE', '28.4%'], ['ROIC', '24.1%'], ['FCF Yield', '3.2%'], ['Div Yield', '0.5%'], ['BV/Share', '$4.82'], ['EV/Rev', '7.1x'], ['Op Margin', '30.3%'], ['Net Margin', '24.9%'], ['Gross Margin', '45.6%'], ['Asset Turn', '1.12x'], ['Debt/Equity', '1.79x'], ['Current Ratio', '1.04'], ['Quick Ratio', '0.98'], ['P/B', '6.34'], ['P/S', '7.52'], ['EV/EBIT', '25.1'], ['FCF Margin', '28.4%']].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}
