'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const TABS = ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Estimates'];

function toBillions(v: number) {
  return `${v.toFixed(2)}B`;
}

export function FinancialAnalysisModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Income Statement';
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const sheetRows = useMemo(() => {
    const s = depth?.financial.statement20y ?? [];
    if (s.length === 0) return [] as Array<[string, string, string, string]>;
    if (selected === 'Income Statement') {
      return s.flatMap((r, i, arr) => {
        const prev = arr[Math.max(0, i - 1)];
        const revDelta = prev ? (((r.revenue - prev.revenue) / Math.max(0.01, prev.revenue)) * 100).toFixed(2) : '0.00';
        return [
          [`Revenue ${r.year}`, toBillions(r.revenue), toBillions(prev?.revenue ?? r.revenue), `${Number(revDelta) >= 0 ? '+' : ''}${revDelta}%`],
          [`EBIT ${r.year}`, toBillions(r.ebit), toBillions(prev?.ebit ?? r.ebit), `${(r.marginPct - (prev?.marginPct ?? r.marginPct)).toFixed(2)}pp`],
          [`Net Income ${r.year}`, toBillions(r.netIncome), toBillions(prev?.netIncome ?? r.netIncome), `${(((r.netIncome - (prev?.netIncome ?? r.netIncome)) / Math.max(0.01, (prev?.netIncome ?? r.netIncome))) * 100).toFixed(2)}%`],
          [`Margin ${r.year}`, `${r.marginPct.toFixed(2)}%`, `${(prev?.marginPct ?? r.marginPct).toFixed(2)}%`, `${(r.marginPct - (prev?.marginPct ?? r.marginPct)).toFixed(2)}pp`],
        ] as Array<[string, string, string, string]>;
      });
    }
    if (selected === 'Balance Sheet') {
      return s.flatMap((r, i, arr) => {
        const prev = arr[Math.max(0, i - 1)];
        return [
          [`Assets ${r.year}`, toBillions(r.assets), toBillions(prev?.assets ?? r.assets), `${(((r.assets - (prev?.assets ?? r.assets)) / Math.max(0.01, (prev?.assets ?? r.assets))) * 100).toFixed(2)}%`],
          [`Liabilities ${r.year}`, toBillions(r.liabilities), toBillions(prev?.liabilities ?? r.liabilities), `${(((r.liabilities - (prev?.liabilities ?? r.liabilities)) / Math.max(0.01, (prev?.liabilities ?? r.liabilities))) * 100).toFixed(2)}%`],
          [`Shares ${r.year}`, `${r.shares.toFixed(2)}B`, `${(prev?.shares ?? r.shares).toFixed(2)}B`, `${(r.shares - (prev?.shares ?? r.shares)).toFixed(2)}B`],
        ] as Array<[string, string, string, string]>;
      });
    }
    if (selected === 'Cash Flow') {
      return s.flatMap((r, i, arr) => {
        const prev = arr[Math.max(0, i - 1)];
        return [
          [`FCF ${r.year}`, toBillions(r.fcf), toBillions(prev?.fcf ?? r.fcf), `${(((r.fcf - (prev?.fcf ?? r.fcf)) / Math.max(0.01, (prev?.fcf ?? r.fcf))) * 100).toFixed(2)}%`],
          [`Cap Intensity ${r.year}`, `${(100 * (r.assets / Math.max(0.01, r.revenue))).toFixed(2)}%`, `${(100 * ((prev?.assets ?? r.assets) / Math.max(0.01, (prev?.revenue ?? r.revenue)))).toFixed(2)}%`, `${((r.assets / Math.max(0.01, r.revenue)) - ((prev?.assets ?? r.assets) / Math.max(0.01, (prev?.revenue ?? r.revenue)))).toFixed(2)}`],
        ] as Array<[string, string, string, string]>;
      });
    }
    return (depth?.financial.analystRevisions ?? []).map((r) => [
      `REV ${r.date}`,
      `EPS ${r.epsRevPct.toFixed(2)}%`,
      `REV ${r.revRevPct.toFixed(2)}%`,
      `TP ${r.target.toFixed(2)}`,
    ]);
  }, [depth, selected]);

  const layoutClass =
    selected === 'Income Statement' ? 'grid-cols-[70%_30%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
      : selected === 'Balance Sheet' ? 'grid-cols-[64%_36%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
        : selected === 'Cash Flow' ? 'grid-cols-[76%_24%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
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
              {sheetRows.map(([m, c, p, d], idx) => (
                <tr key={m} className="border-t border-[#1a1a1a]">
                  <td className="px-1 py-[1px] text-[#d8e4f4]">{m}</td>
                  <td className="px-1 py-[1px] text-right text-[#eaf3ff]">{c}</td>
                  <td className="px-1 py-[1px] text-right text-[#b2c4db]">{p}</td>
                  <td className={`px-1 py-[1px] text-right font-bold ${d.startsWith('+') || (!d.startsWith('-') && idx % 2 === 0) ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{d}</td>
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
          {(depth?.financial.analystRevisions ?? []).map((r, i) => (
            <div key={`${r.date}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">
              {`REV ${r.date} EPS ${r.epsRevPct >= 0 ? '+' : ''}${r.epsRevPct.toFixed(2)}% / REV ${r.revRevPct >= 0 ? '+' : ''}${r.revRevPct.toFixed(2)}% / TP ${r.target.toFixed(2)} / DISP ${r.dispersion.toFixed(2)}`}
            </div>
          ))}
          {state.systemFeed.map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">{line}</div>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">VALUATION + METRICS</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px] bg-black">
          {(depth?.financial.valuationBand ?? []).flatMap((v) => [
            [`P/E ${v.year}`, v.pe.toFixed(2)],
            [`EV/EBITDA ${v.year}`, v.evEbitda.toFixed(2)],
            [`PEG ${v.year}`, v.peg.toFixed(2)],
          ]).map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-[#9fb4cd]">{k}</span><span className="text-[#e7f1ff] font-bold">{v}</span></div>
          ))}
          {(depth?.financial.segmentBreakdown ?? []).map((s) => (
            <div key={`seg-${s.segment}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] gap-2">
              <span className="text-[#9fb4cd]">{s.segment}</span>
              <span className="text-[#e7f1ff] font-bold">{s.revenuePct.toFixed(1)}%</span>
              <span className="text-[#b2c4db]">Mgn {s.marginPct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
