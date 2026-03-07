'use client';

import { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { fetchHistoricalEarnings, type HistoricalEarningsRow } from '@/app/actions/fetchHistoricalEarnings';
import { EarningsHistoryChart } from '../EarningsHistoryChart';

const TABS = ['Earnings Calendar', 'Historical Earnings', 'Surprise', 'Guidance'];

export function EarningsModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Earnings Calendar';
  const [histEarnings, setHistEarnings] = useState<HistoricalEarningsRow[]>([]);

  useEffect(() => {
    if (selected !== 'Historical Earnings') return;
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchHistoricalEarnings(sym).then((rows) => setHistEarnings(rows)).catch(() => {});
  }, [selected, state.activeSymbol]);

  const layoutClass =
    selected === 'Earnings Calendar' ? 'grid-cols-[38%_62%]' : selected === 'Historical Earnings' ? 'grid-cols-[35%_65%]' : selected === 'Surprise' ? 'grid-cols-[46%_54%]' : 'grid-cols-[34%_66%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} WEI GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };
  const rows =
    selected === 'Earnings Calendar'
      ? [['T+1', ref?.earningsDates[0] ?? 'N/A'], ['T+2', ref?.earningsDates[1] ?? 'N/A'], ['DeskFocus', state.activeSymbol], ['Regime', state.risk.regime]]
      : selected === 'Historical Earnings'
        ? [['Symbol', state.activeSymbol], ['Quarters', `${histEarnings.length}`], ['DeskFocus', state.activeSymbol]]
        : selected === 'Surprise'
        ? [['EPS Surprise', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`], ['Revenue Surprise', `${(state.microstructure.imbalance * 100).toFixed(1)}%`], ['Signal', state.microstructure.orderFlowImbalance >= 0 ? 'POSITIVE' : 'NEGATIVE'], ['Dispersion', 'MEDIUM']]
        : [['Guidance Tone', 'Neutral-Positive'], ['Revision Dispersion', 'Medium'], ['Uncertainty', `${state.risk.impliedVolProxy}%`], ['Analyst Breadth', '78 covered']];
  const earningsGrid = state.quotes.map((q, i) => {
    const profile = state.referenceBySymbol[q.symbol];
    const nextDate = profile?.earningsDates?.[0] ?? '2026-04-01';
    const surprise = ((q.momentum * 3.1) + (state.microstructure.orderFlowImbalance * 10) + (i % 5)).toFixed(1);
    const tag = i % 3 === 0 ? 'NEAR' : i % 3 === 1 ? 'ACTIVE' : 'REV';
    return { symbol: q.symbol, nextDate, surprise, tag, pct: q.pct, ivx: state.risk.impliedVolProxy + (i % 4) };
  });

  return (
    <div key={`wei-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-black`}>
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">WEI / EARNINGS MATRIX</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-[2px] border-b border-[#1a1a1a] ${selected === t ? 'bg-[#2b3a07] text-[#efffc7]' : 'text-[#b6c8dd]'}`}>{t}</button>
          ))}
          {rows.map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">EARNINGS PROXIES MATRIX</div>
          <table className="w-full text-[8px] tabular-nums">
            <thead className="bg-[#0a0a0a] text-[#9fb4cd] sticky top-0">
              <tr><th className="text-left px-1 py-[1px]">Sym</th><th className="text-left px-1 py-[1px]">Date</th><th className="text-right px-1 py-[1px]">Srp</th><th className="text-right px-1 py-[1px]">IVx</th><th className="text-right px-1 py-[1px]">Tag</th></tr>
            </thead>
            <tbody>
              {earningsGrid.map((r) => (
                <tr key={`eg-${r.symbol}`} className="border-t border-[#1a1a1a]">
                  <td className="px-1 py-[1px] text-[#d7e3f3]">{r.symbol}</td>
                  <td className="px-1 py-[1px] text-[#9fb4cd]">{r.nextDate}</td>
                  <td className={`px-1 py-[1px] text-right font-bold ${Number(r.surprise) >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{r.surprise}</td>
                  <td className="px-1 py-[1px] text-right text-[#e7f1ff]">{r.ivx.toFixed(1)}</td>
                  <td className={`px-1 py-[1px] text-right font-bold ${r.tag === 'NEAR' ? 'text-[#ffaf66]' : r.tag === 'ACTIVE' ? 'text-[#63c8ff]' : 'text-[#e3b4ff]'}`}>{r.tag}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">WATCHLIST</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>
      {selected === 'Historical Earnings' && (
        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">HISTORICAL EARNINGS CHART</div>
          <div className="flex-1 min-h-0">
            <EarningsHistoryChart data={histEarnings} />
          </div>
        </section>
      )}
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">
          {selected === 'Historical Earnings' ? 'EPS / REVENUE HISTORY' : 'EARNINGS NEWSFLOW + REVISIONS'}
        </div>
        {selected === 'Historical Earnings' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-[8px] tabular-nums">
              <thead className="sticky top-0 bg-[#0a0a0a] text-[#9fb4cd]">
                <tr><th className="text-left px-1 py-[1px]">Date</th><th className="text-right px-1 py-[1px]">EPS Est</th><th className="text-right px-1 py-[1px]">EPS Act</th><th className="text-right px-1 py-[1px]">Rev Act</th><th className="text-right px-1 py-[1px]">Surprise</th></tr>
              </thead>
              <tbody>
                {histEarnings.map((r, i) => (
                  <tr key={`he-${r.date}-${i}`} className="border-t border-[#1a1a1a]">
                    <td className="px-1 py-[1px] text-[#d7e3f3]">{r.date}</td>
                    <td className="px-1 py-[1px] text-right text-[#9fb4cd]">{r.epsEst != null ? r.epsEst.toFixed(2) : '—'}</td>
                    <td className="px-1 py-[1px] text-right text-[#e7f1ff]">{r.epsAct != null ? r.epsAct.toFixed(2) : '—'}</td>
                    <td className="px-1 py-[1px] text-right text-[#b2c4db]">{r.revAct != null ? `${r.revAct}B` : '—'}</td>
                    <td className={`px-1 py-[1px] text-right font-bold ${r.surprise != null ? (r.surprise >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]') : 'text-[#6e85a3]'}`}>
                      {r.surprise != null ? `${r.surprise >= 0 ? '+' : ''}${r.surprise}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-[#1a1a1a] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 gap-px bg-[#142034]">
              {['Beat', 'Miss', 'Raise', 'Cut'].map((k, i) => (
                <div key={k} className="px-1 py-[2px] text-[8px] bg-[#0a0a0a] text-[#9fb4cd]">{k} <span className="text-[#e7f1ff] font-bold">{(state.streamClock.feed + i * 3) % 17}</span></div>
              ))}
            </div>
            {state.headlines.map((h, i) => <div key={`${h}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#d7e3f3]">{h}</div>)}
          </div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {state.systemFeed.map((h, i) => <div key={`${h}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">{h}</div>)}
            {earningsGrid.map((r, i) => (
              <div key={`rv-${r.symbol}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">
                REV {r.symbol} {r.tag} SURP {r.surprise} IVX {r.ivx.toFixed(1)}
              </div>
            ))}
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
