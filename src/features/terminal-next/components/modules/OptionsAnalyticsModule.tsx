'use client';

import { useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const TABS = ['Skew', 'Surface', 'Greeks'];

export function OptionsAnalyticsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Skew';
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);
  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const layoutClass = selected === 'Skew' ? 'grid-cols-[50%_50%]' : selected === 'Surface' ? 'grid-cols-[56%_44%]' : 'grid-cols-[44%_56%]';
  const volSurface = depth?.options.surface ?? [0.1, 0.25, 0.5, 0.75, 0.9].map((delta, i) => ({
    delta: `${Math.round(delta * 100)}D`,
    w1: state.risk.impliedVolProxy + i * 0.9 - 1.2,
    m1: state.risk.impliedVolProxy + i * 0.7 - 0.6,
    m3: state.risk.impliedVolProxy + i * 0.5,
    m6: state.risk.impliedVolProxy + i * 0.4,
  }));
  const scenarios = [
    ['S+1% V+1', 0.42 + state.microstructure.orderFlowImbalance * 0.12, 0.08, 0.21, -0.03],
    ['S-1% V+1', 0.36 + state.microstructure.imbalance * 0.1, 0.1, 0.28, -0.04],
    ['S+2% V-1', 0.51 + state.microstructure.orderFlowImbalance * 0.1, 0.06, 0.16, -0.02],
    ['S-2% V+2', 0.29 + state.microstructure.imbalance * 0.12, 0.12, 0.35, -0.06],
  ];
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} OVME GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`ovme-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-black`}>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] flex items-center justify-between">
          <span className="text-[#f4cf76] font-bold">OVME / VOLATILITY SURFACE</span>
          <div className="flex items-center gap-1">{TABS.map((t) => <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`px-1 border text-[8px] ${selected === t ? 'border-[#95ca2d] bg-[#2b3a07] text-[#efffc7]' : 'border-[#4f3a18] bg-[#18130a] text-[#d8be8d]'}`}>{t}</button>)}</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['25D RR', '1.8'], ['25D BF', '0.7'], ['ATM IV', `${state.risk.impliedVolProxy}%`], ['Skew Slope', '0.12'], ['Term Curvature', '0.05'], ['Spot-Vol Corr', '-0.31']].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">VOL SURFACE (DELTA x TENOR)</div>
          <table className="w-full text-[8px] tabular-nums">
            <thead className="bg-[#0a0a0a] text-[#9fb4cd]">
              <tr><th className="text-left px-1 py-[1px]">Delta</th><th className="text-right px-1 py-[1px]">1W</th><th className="text-right px-1 py-[1px]">1M</th><th className="text-right px-1 py-[1px]">3M</th></tr>
            </thead>
            <tbody>
              {volSurface.map((r) => (
                <tr key={r.delta} className="border-t border-[#1a1a1a]">
                  <td className="px-1 py-[1px] text-[#d7e3f3]">{r.delta}</td>
                  <td className="px-1 py-[1px] text-right text-[#e7f1ff]">{r.w1.toFixed(1)}%</td>
                  <td className="px-1 py-[1px] text-right text-[#e7f1ff]">{r.m1.toFixed(1)}%</td>
                  <td className="px-1 py-[1px] text-right text-[#e7f1ff]">{r.m3.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">OI HEATMAP (EXP x STRIKE)</div>
          {(depth?.options.oiHeatmap ?? []).map((h, i) => (
            <div key={`${h.expiration}-${h.strike}-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#9fb4cd]">{h.expiration}</span>
              <span className="text-[#d7e3f3]">{h.strike.toFixed(2)}</span>
              <span className="text-[#e7f1ff]">{h.oi}</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">UNDERLYING</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)} <span className={q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}%</span></span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">GREEKS / RISK DELTA</div>
        <div className="grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
            {[['Delta', '0.42'], ['Gamma', '0.08'], ['Vega', '0.21'], ['Theta', '-0.03'], ['Charm', '-0.02'], ['Vanna', '0.04'], ['Vomma', '0.06'], ['Color', '-0.01']].map(([k, v]) => <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>)}
            <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">SCENARIO GRID</div>
            {scenarios.map((row) => (
              <div key={row[0]} className="px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1.3fr_repeat(4,1fr)] text-[8px]">
                <span className="text-[#9fb4cd]">{row[0]}</span>
                <span className="text-right text-[#e7f1ff]">{Number(row[1]).toFixed(2)}</span>
                <span className="text-right text-[#e7f1ff]">{Number(row[2]).toFixed(2)}</span>
                <span className="text-right text-[#e7f1ff]">{Number(row[3]).toFixed(2)}</span>
                <span className="text-right text-[#e7f1ff]">{Number(row[4]).toFixed(2)}</span>
              </div>
            ))}
            {(depth?.options.gammaExposure ?? []).map((g, i) => (
              <div key={`${g.strike}-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[auto_auto_auto] text-[8px]">
                <span className="text-[#9fb4cd]">{g.strike.toFixed(2)}</span>
                <span className="text-[#e7f1ff]">Gamma {g.gamma.toFixed(4)}</span>
                <span className="text-[#b7c8dd]">OI {g.openInterest}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar text-[8px]">
            {state.systemFeed.map((l, i) => <div key={`${l}-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#b7c8dd]">{l}</div>)}
            {volSurface.map((r) => <div key={`diag-${r.delta}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">SURF {r.delta} {r.w1.toFixed(1)}/{r.m1.toFixed(1)}/{r.m3.toFixed(1)}</div>)}
            {(depth?.options.skewHistory ?? []).map((s) => (
              <div key={s.date} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">{`${s.date} RR ${s.rr25d.toFixed(2)} BF ${s.bf25d.toFixed(2)}`}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
