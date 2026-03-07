'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['Indices', 'Sectors', 'Breadth', 'Flows', 'Macro', 'Correlations'];

const SECTORS = [
  ['Technology', '+0.82%', '1.24', 'Outperform'],
  ['Healthcare', '+0.31%', '0.89', 'Neutral'],
  ['Financials', '+0.45%', '1.12', 'Outperform'],
  ['Consumer Disc', '+0.28%', '0.95', 'Neutral'],
  ['Industrials', '+0.52%', '1.08', 'Outperform'],
  ['Energy', '+1.12%', '1.35', 'Outperform'],
  ['Materials', '+0.38%', '0.98', 'Neutral'],
  ['Utilities', '-0.15%', '0.72', 'Underperform'],
  ['Real Estate', '-0.22%', '0.68', 'Underperform'],
];

const INDICES = [
  ['SPX', 5284.1, '+0.42%', '52.3M'],
  ['NDX', 18645.4, '+0.58%', '28.1M'],
  ['DJI', 39250.2, '+0.31%', '12.4M'],
  ['RUT', 2080.5, '+0.28%', '8.2M'],
  ['VIX', 16.8, '-2.1%', '—'],
];

export function MarketModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Indices';

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[18%_40%_42%] grid-rows-[50%_50%] gap-px bg-black">
      <section className="bg-black border-r border-[#1a1a1a] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">MKT / NAV</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-0.5 border-b border-[#262626] ${selected === t ? 'bg-[#0d1f0d] text-green-400 font-bold' : 'text-gray-400 hover:bg-[#0f0f0f]'}`}>{t}</button>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">ADV/DEC</div>
          <div className="px-1 py-0.5 border-b border-[#262626] grid grid-cols-2 gap-1 text-gray-300">
            <span>Advancing</span><span className="text-green-500 font-bold">1,842</span>
            <span>Declining</span><span className="text-red-500 font-bold">1,158</span>
            <span>Breadth</span><span className="font-bold">61.4%</span>
          </div>
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">QUOTES</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })} className="w-full text-left px-1 py-0.5 border-b border-[#262626] grid grid-cols-[1fr_auto] text-gray-300 hover:bg-[#0f0f0f]">
              <span>{q.symbol}</span><span className={q.pct >= 0 ? 'text-green-500' : 'text-red-500'}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}%</span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">SECTOR PERFORMANCE</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Sector</th><th className="text-right px-1 py-0.5">1D</th><th className="text-right px-1 py-0.5">Beta</th><th className="text-right px-1 py-0.5">View</th></tr>
            </thead>
            <tbody>
              {SECTORS.map(([sec, d, beta, view], i) => (
                <tr key={`sec-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f]">
                  <td className="px-1 py-0.5 text-gray-200">{sec}</td><td className={`px-1 py-0.5 text-right font-bold ${d.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{d}</td><td className="px-1 py-0.5 text-right text-gray-400">{beta}</td><td className="px-1 py-0.5 text-right"><span className={view === 'Outperform' ? 'text-green-500' : view === 'Underperform' ? 'text-red-500' : 'text-gray-500'}>{view}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">INDEX SNAPSHOT</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Index</th><th className="text-right px-1 py-0.5">Level</th><th className="text-right px-1 py-0.5">1D</th><th className="text-right px-1 py-0.5">Vol</th></tr>
            </thead>
            <tbody>
              {INDICES.map(([idx, lvl, d, vol], i) => (
                <tr key={`idx-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f]">
                  <td className="px-1 py-0.5 text-gray-200 font-medium">{idx}</td><td className="px-1 py-0.5 text-right text-gray-300">{lvl.toLocaleString()}</td><td className={`px-1 py-0.5 text-right font-bold ${d.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{d}</td><td className="px-1 py-0.5 text-right text-gray-400">{vol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col col-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">FLOWS / MACRO / CORRELATIONS</div>
        <div className="flex-1 overflow-y-auto text-[8px] grid grid-cols-3 gap-px">
          <div className="overflow-y-auto border-r border-[#262626]">
            <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">ETF FLOWS</div>
            {[['SPY', '+$1.2B', 'Inflow'], ['QQQ', '+$890M', 'Inflow'], ['IWM', '-$120M', 'Outflow'], ['XLF', '+$340M', 'Inflow'], ['XLE', '+$210M', 'Inflow']].map(([etf, amt, dir], i) => (
              <div key={`fl-${i}`} className="px-1 py-0.5 border-b border-[#262626] flex justify-between text-gray-300"><span>{etf}</span><span className={dir === 'Inflow' ? 'text-green-500' : 'text-red-500'}>{amt}</span></div>
            ))}
          </div>
          <div className="overflow-y-auto border-r border-[#262626]">
            <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">MACRO</div>
            {[['US10Y', '4.22%', '+2bp'], ['DXY', '104.2', '-0.1%'], ['WTI', '$79.2', '+0.8%'], ['Gold', '$2350', '+0.3%'], ['BTC', '$90.5K', '+1.2%']].map(([m, v, ch], i) => (
              <div key={`mac-${i}`} className="px-1 py-0.5 border-b border-[#262626] flex justify-between text-gray-300"><span>{m}</span><span>{v} </span><span className={ch.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{ch}</span></div>
            ))}
          </div>
          <div className="overflow-y-auto">
            <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">CORR MATRIX</div>
            {[['SPX/NDX', '0.98'], ['SPX/VIX', '-0.82'], ['SPX/US10Y', '-0.45'], ['NDX/VIX', '-0.79'], ['Gold/DXY', '-0.72']].map(([pair, corr], i) => (
              <div key={`corr-${i}`} className="px-1 py-0.5 border-b border-[#262626] flex justify-between text-gray-300"><span>{pair}</span><span>{corr}</span></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
