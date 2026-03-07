'use client';

import { useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const TABS = ['Earnings', 'Economic', 'Dividends', 'Splits', 'IPOs', 'Conferences'];

const ECO_EVENTS = [
  ['CPI', '08:30', '3.2%', '3.1%', 'High'],
  ['FOMC', '14:00', '—', '—', 'High'],
  ['NFP', '08:30', '185K', '192K', 'High'],
  ['Retail Sales', '08:30', '+0.4%', '+0.2%', 'Medium'],
  ['PMI Mfg', '10:00', '52.1', '51.8', 'Medium'],
  ['PMI Svcs', '10:00', '53.4', '53.0', 'Medium'],
  ['Jobless Claims', '08:30', '218K', '220K', 'Medium'],
  ['ECB Decision', '07:45', '—', '—', 'High'],
  ['BOE', '07:00', '—', '—', 'High'],
  ['BoJ', '03:00', '—', '—', 'High'],
];

const EARNINGS_THIS_WEEK = [
  ['AAPL', '2026-04-30', 'AMC', '6.23', '402.3B'],
  ['MSFT', '2026-04-24', 'AMC', '3.82', '64.2B'],
  ['NVDA', '2026-04-25', 'AMC', '6.12', '28.5B'],
  ['META', '2026-04-23', 'AMC', '5.21', '38.1B'],
  ['GOOGL', '2026-04-22', 'AMC', '1.89', '82.1B'],
  ['AMZN', '2026-04-25', 'AMC', '1.18', '148.2B'],
  ['TSLA', '2026-04-22', 'AMC', '0.72', '26.4B'],
  ['PLTR', '2026-04-30', 'AMC', '0.09', '0.68B'],
];

export function CalendarModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Earnings';
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const macroEvents = depth?.calendar.macro ?? ECO_EVENTS.map(([title, time, act, fcst, impact]) => ({ date: new Date().toISOString().slice(0, 10), title, impact, forecast: fcst }));
  const earningsRows = depth?.calendar.earnings ?? EARNINGS_THIS_WEEK.map(([ticker, date, _call, eps, _rev]) => ({ ticker, date, epsEst: Number(eps), revEst: null }));
  const catalysts = depth?.calendar.catalysts ?? [];
  const filingRows = depth?.sec.filings ?? [];
  const impactRows = depth?.news.impacts ?? [];
  const flowRows = depth?.market.flows ?? [];
  const revisionRows = depth?.earnings.revisionsTimeline ?? [];

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[20%_38%_42%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-black">
      <section className="bg-black border-r border-[#1a1a1a] min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white flex items-center">CAL / NAV</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-0.5 border-b border-[#262626] ${selected === t ? 'bg-[#0d1f0d] text-green-400 font-bold' : 'text-gray-400 hover:bg-[#0f0f0f]'}`}>{t}</button>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">WEEK VIEW</div>
          {['Mon 04/28', 'Tue 04/29', 'Wed 04/30', 'Thu 05/01', 'Fri 05/02'].map((d, i) => (
            <div key={d} className="px-1 py-0.5 border-b border-[#262626] text-gray-300">{d} — {(i + 3) * 4} events</div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">SYMBOL QUICK</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })} className="w-full text-left px-1 py-0.5 border-b border-[#262626] grid grid-cols-[1fr_auto] text-gray-300 hover:bg-[#0f0f0f]">
              <span>{q.symbol}</span><span className={q.pct >= 0 ? 'text-green-500' : 'text-red-500'}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}%</span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">ECONOMIC EVENTS</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Event</th><th className="text-left px-1 py-0.5">Time</th><th className="text-right px-1 py-0.5">Act</th><th className="text-right px-1 py-0.5">Fcst</th><th className="text-right px-1 py-0.5">Impact</th></tr>
            </thead>
            <tbody>
              {macroEvents.map((ev, i) => (
                <tr key={`eco-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f]">
                  <td className="px-1 py-0.5 text-gray-200">{ev.title}</td><td className="px-1 py-0.5 text-gray-400">{ev.date}</td><td className="px-1 py-0.5 text-right text-gray-200">—</td><td className="px-1 py-0.5 text-right text-gray-400">{ev.forecast}</td><td className="px-1 py-0.5 text-right"><span className={ev.impact === 'High' ? 'text-red-500 font-bold' : 'text-gray-400'}>{ev.impact}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">EARNINGS THIS WEEK</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] text-gray-400">
              <tr><th className="text-left px-1 py-0.5">Symbol</th><th className="text-left px-1 py-0.5">Date</th><th className="text-left px-1 py-0.5">Call</th><th className="text-right px-1 py-0.5">EPS Est</th><th className="text-right px-1 py-0.5">Rev Est</th></tr>
            </thead>
            <tbody>
              {earningsRows.map((row, i) => (
                <tr key={`earn-${i}`} className="border-t border-[#262626] hover:bg-[#0f0f0f] cursor-pointer" onClick={() => dispatch({ type: 'SET_SYMBOL', payload: row.ticker })}>
                  <td className="px-1 py-0.5 text-gray-200 font-medium">{row.ticker}</td><td className="px-1 py-0.5 text-gray-400">{row.date}</td><td className="px-1 py-0.5 text-gray-400">AMC</td><td className="px-1 py-0.5 text-right text-gray-200">{row.epsEst != null ? row.epsEst.toFixed(2) : '—'}</td><td className="px-1 py-0.5 text-right text-gray-400">{row.revEst != null ? `${row.revEst.toFixed(2)}B` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col col-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">UPCOMING DIVIDENDS / SPLITS / IPOs</div>
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-px bg-[#1a1a1a] text-[8px]">
          <div className="grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-[#1a1a1a] min-h-0">
            <div className="bg-black overflow-y-auto">
              <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">DIVIDENDS</div>
              {[['AAPL', '0.24', '05/09'], ['MSFT', '0.83', '05/15'], ['JPM', '1.15', '05/06'], ['V', '0.52', '05/08'], ['WMT', '0.83', '05/08'], ['PG', '1.06', '05/15'], ['KO', '0.485', '05/15'], ['PEP', '1.355', '05/09']].map(([s, amt, d], i) => (
                <div key={`div-${i}`} className="px-1 py-[1px] border-b border-[#262626] flex justify-between text-gray-300"><span>{s}</span><span>{amt} ex {d}</span></div>
              ))}
            </div>
            <div className="bg-black overflow-y-auto">
              <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">REVISION TRACE</div>
              {revisionRows.map((r, i) => (
                <div key={`rev-${r.date}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-300">
                  {`${r.date} EPS ${r.epsDeltaPct >= 0 ? '+' : ''}${r.epsDeltaPct.toFixed(2)} REV ${r.revDeltaPct >= 0 ? '+' : ''}${r.revDeltaPct.toFixed(2)}`}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-[#1a1a1a] min-h-0">
            <div className="bg-black overflow-y-auto">
              <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">SPLITS + CATALYSTS</div>
              {[['NVDA', '10:1', '06/10'], ['GOOGL', '20:1', '07/15'], ['TSLA', '3:1', '08/25']].map(([s, r, d], i) => (
                <div key={`spl-${i}`} className="px-1 py-[1px] border-b border-[#262626] flex justify-between text-gray-300"><span>{s}</span><span>{r} {d}</span></div>
              ))}
              {catalysts.map((c, i) => (
                <div key={`cat-${i}`} className="px-1 py-[1px] border-b border-[#262626] flex justify-between text-gray-300"><span>{c.type}</span><span>{c.date} {c.title}</span></div>
              ))}
            </div>
            <div className="bg-black overflow-y-auto">
              <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">FLOW + IMPACT TRACE</div>
              {flowRows.map((f, i) => (
                <div key={`flow-${i}`} className="px-1 py-[1px] border-b border-[#262626] flex justify-between text-gray-300">
                  <span>{f.vehicle}</span>
                  <span className={f.direction === 'Inflow' ? 'text-green-500' : 'text-red-500'}>
                    {`${f.flowUsdM >= 0 ? '+' : ''}$${f.flowUsdM.toFixed(0)}M`}
                  </span>
                </div>
              ))}
              {impactRows.map((x, i) => (
                <div key={`imp-${x.date}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-300">
                  {`${x.date} ${x.event} ${x.priceImpactPct >= 0 ? '+' : ''}${x.priceImpactPct.toFixed(2)}%`}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-[#1a1a1a] min-h-0">
            <div className="bg-black overflow-y-auto">
              <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">IPOs / CONF</div>
              {[['Reddit', 'IPO', '03/21'], ['Astera', 'IPO', '03/20'], ['Berkshire AGM', '05/03', 'Omaha'], ['Apple WWDC', '06/10', 'Cupertino']].map(([n, t, d], i) => (
                <div key={`ipo-${i}`} className="px-1 py-[1px] border-b border-[#262626] flex justify-between text-gray-300"><span>{n}</span><span>{t} {d}</span></div>
              ))}
            </div>
            <div className="bg-black overflow-y-auto">
              <div className="px-1 py-0.5 bg-[#0a0a0a] font-bold text-gray-400 border-b border-[#1a1a1a]">REGULATORY FILINGS + SYSTEM</div>
              {filingRows.map((f, i) => (
                <div key={`file-${f.form}-${f.filed}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-300">
                  {`${f.filed} ${f.form} ${f.description}`}
                </div>
              ))}
              {state.systemFeed.map((line, i) => (
                <div key={`sys-${line}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-400">{line}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
