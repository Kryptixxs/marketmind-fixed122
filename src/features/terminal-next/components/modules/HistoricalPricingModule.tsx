'use client';

import { useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const TABS = ['Daily', 'Intraday', 'Adjusted'];

export function HistoricalPricingModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Daily';
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const bars = state.barsBySymbol[state.activeSymbol] ?? [];
  const recent = bars;
  const spark = recent.map((b, i, arr) => {
    const min = Math.min(...arr.map((x) => x.close));
    const max = Math.max(...arr.map((x) => x.close));
    const span = Math.max(0.0001, max - min);
    const bucket = Math.round(((b.close - min) / span) * 7);
    return '._-:=+*#'[bucket] ?? '#';
  }).join('');
  const horizonRows = [
    ['1m', recent.length > 2 ? (((recent[recent.length - 1]?.close ?? 0) / (recent[recent.length - 2]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
    ['5m', recent.length > 6 ? (((recent[recent.length - 1]?.close ?? 0) / (recent[recent.length - 6]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
    ['15m', recent.length > 16 ? (((recent[recent.length - 1]?.close ?? 0) / (recent[recent.length - 16]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
    ['24b', recent.length > 1 ? (((recent[recent.length - 1]?.close ?? 0) / (recent[0]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
  ];
  const avgVol = recent.length ? Math.round(recent.reduce((a, b) => a + b.volume, 0) / recent.length) : 0;
  const layoutClass =
    selected === 'Daily'
      ? 'grid-cols-[58%_42%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
      : selected === 'Intraday'
        ? 'grid-cols-[64%_36%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
        : 'grid-cols-[52%_48%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} HP GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`hp-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-black`}>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] flex items-center justify-between">
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
                ? (ref?.dailyBars ?? []).map((d) => ({ ts: d.date, open: d.close * 0.997, high: d.close * 1.006, low: d.close * 0.994, close: d.close, volume: d.volume }))
                : recent.map((b) => ({ ts: new Date(b.ts).toISOString().slice(11, 19), ...b }))
              ).map((b, i) => (
                <tr key={`${b.ts}-${i}`} className="border-t border-[#1a1a1a]">
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
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">SYMBOL SWITCH</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">HP ANALYTICS STACK</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          <div className="px-1 py-[2px] border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="text-[8px] text-[#9fb4cd]">MICRO SPARKLINE</div>
            <div className="text-[9px] text-[#e7f1ff] font-bold tracking-wide truncate">{spark || '..................'}</div>
          </div>
          {[['Window', selected === 'Daily' ? '24 sessions' : '24 bars'], ['RV', `${state.risk.realizedVol}%`], ['IVx', `${state.risk.impliedVolProxy}%`], ['Beta', `${state.risk.beta}`], ['Corr', `${state.risk.corrToBenchmark}`], ['Momentum', `${state.quotes.find((q) => q.symbol === state.activeSymbol)?.momentum ?? 0}`], ['Liquidity', `${state.quotes.find((q) => q.symbol === state.activeSymbol)?.liquidityScore ?? 0}`], ['Regime', state.risk.regime], ['Spread', `${state.microstructure.insideSpreadBps}bp`], ['OFI', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`], ['AvgVol/Bar', `${avgVol}`], ['VWAP Drift', recent.length ? `${(((recent[recent.length - 1]?.close ?? 0) / ((recent[recent.length - 1]?.vwap ?? 1)) - 1) * 100).toFixed(2)}%` : '0.00%']].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">MULTI-HORIZON RETURN GRID</div>
          <table className="w-full text-[8px] tabular-nums">
            <thead className="bg-[#09111c] text-[#9fb4cd]">
              <tr><th className="text-left px-1 py-[1px]">Hzn</th><th className="text-right px-1 py-[1px]">Ret%</th><th className="text-right px-1 py-[1px]">VolScale</th></tr>
            </thead>
            <tbody>
              {horizonRows.map(([h, r], i) => (
                <tr key={`${h}-${i}`} className="border-t border-[#1a1a1a]">
                  <td className="px-1 py-[1px] text-[#d8e4f4]">{h}</td>
                  <td className={`px-1 py-[1px] text-right font-bold ${Number(r) >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{Number(r) >= 0 ? '+' : ''}{r}</td>
                  <td className="px-1 py-[1px] text-right text-[#9fb4cd]">{(1 + Math.abs(Number(r)) / 3).toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">20Y PRICE/REVENUE CORRELATION</div>
          {(depth?.historical.priceRevenueCorr ?? []).map((r) => (
            <div key={`corr-${r.year}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_1fr_auto] gap-2">
              <span className="text-[#9fb4cd]">{r.year}</span>
              <span className="text-[#d7e3f3]">Price vs Revenue</span>
              <span className={`font-bold ${r.corr >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{r.corr.toFixed(2)}</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">CRISIS BEHAVIOR LAYER</div>
          {(depth?.historical.crises ?? []).map((c) => (
            <div key={c.period} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1.3fr_auto_auto_auto] gap-2 text-[8px]">
              <span className="text-[#d7e3f3]">{c.period}</span>
              <span className="text-[#ff7ca3] font-bold">{c.drawdownPct}%</span>
              <span className="text-[#9fb4cd]">{c.recoveryMonths}m rec</span>
              <span className="text-[#ffaf66]">{c.volShiftPct}% vol</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">HP EVENT TAPE</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a]">
            <div className="px-1 py-[2px] text-[8px] bg-[#0a0a0a] text-[#9fb4cd]">ExecCt <span className="text-[#e7f1ff] font-bold">{state.executionEvents.length}</span></div>
            <div className="px-1 py-[2px] text-[8px] bg-[#0a0a0a] text-[#9fb4cd]">Sweep <span className={`font-bold ${state.microstructure.sweep.active ? 'text-[#ffaf66]' : 'text-[#e7f1ff]'}`}>{state.microstructure.sweep.text}</span></div>
            <div className="px-1 py-[2px] text-[8px] bg-[#0a0a0a] text-[#9fb4cd]">Cadence <span className="text-[#e7f1ff] font-bold">Q{state.streamClock.quotes}/E{state.streamClock.execution}</span></div>
          </div>
          {state.executionEvents.map((e) => (
            <div key={e.id} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#b7c8dd]">{e.symbol} {e.status} {e.fillQty}@{e.fillPrice.toFixed(2)}</div>
          ))}
          {state.systemFeed.map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">{line}</div>
          ))}
          {(depth?.historical.eventMarkers ?? []).map((event, i) => (
            <div key={`${event.date}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">
              {`${event.date} ${event.event} ${event.impactPct >= 0 ? '+' : ''}${event.impactPct.toFixed(2)}%`}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
