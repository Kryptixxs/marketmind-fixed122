'use client';

import { useTerminalStore } from '../../store/TerminalStore';

const TABS = ['10-K', '10-Q', '8-K', 'Proxy', 'Insider', 'S-1'];

const FILINGS = [
  ['10-K', '2025-10-28', 'Annual Report', 'Filed'],
  ['10-Q', '2026-01-28', 'Q1 2026', 'Filed'],
  ['10-Q', '2026-04-28', 'Q2 2026', 'Expected'],
  ['8-K', '2026-03-15', 'Earnings Release', 'Filed'],
  ['8-K', '2026-02-10', 'Dividend Declared', 'Filed'],
  ['DEF 14A', '2026-01-20', 'Proxy Statement', 'Filed'],
  ['4', '2026-03-01', 'Insider Buy CEO', 'Filed'],
  ['4', '2026-02-28', 'Insider Sell CFO', 'Filed'],
  ['SC 13G', '2026-01-15', 'Vanguard 13G', 'Filed'],
  ['S-1', '2025-11-01', 'IPO Registration', 'Effective'],
];

const INSIDER_ACTIVITY = [
  ['CEO', 'Buy', '50,000', '196.20', '03/01'],
  ['CFO', 'Sell', '12,000', '198.50', '02/28'],
  ['COO', 'Buy', '25,000', '195.80', '02/25'],
  ['Director A', 'Buy', '10,000', '197.00', '02/20'],
  ['Director B', 'Sell', '5,000', '199.20', '02/15'],
];

export function SecFilingsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : '10-K';
  const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[18%_40%_42%] grid-rows-[48%_52%] gap-px bg-black">
      <section className="bg-black border-r border-[#1a1a1a] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">SEC / FILINGS</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-0.5 border-b border-[#262626] ${selected === t ? 'bg-[#0d1f0d] text-green-400 font-bold' : 'text-gray-400 hover:bg-[#0f0f0f]'}`}>{t}</button>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">FOCUS</div>
          <div className="px-1 py-0.5 border-b border-[#262626] text-gray-200 font-bold">{sym}</div>
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">WATCHLIST</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })} className="w-full text-left px-1 py-0.5 border-b border-[#262626] text-gray-300 hover:bg-[#0f0f0f]">{q.symbol}</button>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">RECENT FILINGS — {sym}</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Form</th><th className="text-left px-1 py-0.5">Date</th><th className="text-left px-1 py-0.5">Description</th><th className="text-right px-1 py-0.5">Status</th></tr>
            </thead>
            <tbody>
              {FILINGS.map(([form, date, desc, status], i) => (
                <tr key={`fil-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f] cursor-pointer">
                  <td className="px-1 py-0.5 text-gray-200 font-medium">{form}</td><td className="px-1 py-0.5 text-gray-400">{date}</td><td className="px-1 py-0.5 text-gray-300">{desc}</td><td className="px-1 py-0.5 text-right"><span className={status === 'Filed' ? 'text-green-500' : 'text-amber-500'}>{status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">INSIDER ACTIVITY</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Insider</th><th className="text-left px-1 py-0.5">Type</th><th className="text-right px-1 py-0.5">Qty</th><th className="text-right px-1 py-0.5">Price</th><th className="text-right px-1 py-0.5">Date</th></tr>
            </thead>
            <tbody>
              {INSIDER_ACTIVITY.map(([name, type, qty, px, d], i) => (
                <tr key={`ins-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f]">
                  <td className="px-1 py-0.5 text-gray-200">{name}</td><td className="px-1 py-0.5"><span className={type === 'Buy' ? 'text-green-500 font-bold' : 'text-red-500'}>{type}</span></td><td className="px-1 py-0.5 text-right text-gray-300">{qty}</td><td className="px-1 py-0.5 text-right text-gray-400">${px}</td><td className="px-1 py-0.5 text-right text-gray-400">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col col-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">13F HOLDINGS / INSTITUTIONAL</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Holder</th><th className="text-right px-1 py-0.5">Shares</th><th className="text-right px-1 py-0.5">% Out</th><th className="text-right px-1 py-0.5">Value</th><th className="text-left px-1 py-0.5">Change</th></tr>
            </thead>
            <tbody>
              {[['Vanguard', '1.24B', '7.2%', '$243B', '+0.2%'], ['BlackRock', '1.02B', '5.9%', '$200B', '+0.1%'], ['State Street', '420M', '2.4%', '$82B', '-0.1%'], ['Fidelity', '380M', '2.2%', '$75B', '+0.3%'], ['Berkshire', '905M', '5.2%', '$178B', 'flat']].map(([h, sh, pct, val, ch], i) => (
                <tr key={`13f-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f]">
                  <td className="px-1 py-0.5 text-gray-200">{h}</td><td className="px-1 py-0.5 text-right text-gray-300">{sh}</td><td className="px-1 py-0.5 text-right text-gray-400">{pct}</td><td className="px-1 py-0.5 text-right text-gray-300">{val}</td><td className="px-1 py-0.5"><span className={ch.startsWith('+') ? 'text-green-500' : ch.startsWith('-') ? 'text-red-500' : 'text-gray-500'}>{ch}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
