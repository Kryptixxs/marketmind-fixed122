'use client';

import { useMemo, useRef } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function CrossAssetMatrixPanel() {
  const { state, dispatch } = useTerminalStore();
  const matrixRef = useRef<HTMLDivElement>(null);

  const ranked = useMemo(() => [...state.quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)), [state.quotes]);
  const displayRanked = ranked;

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col font-mono tracking-tight uppercase tabular-nums">
      <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] flex items-center justify-between text-[8px]">
        <span className="text-[#9bc3e8] font-bold">CROSS-ASSET MATRIX</span>
        <span className="text-[#7f99ba]">% Rank Corr</span>
      </div>
      <div ref={matrixRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[8px] tabular-nums">
          <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
            <tr>
              <th className="text-left px-[2px] py-[1px]">Asset</th>
              <th className="text-right px-[2px] py-[1px]">Last</th>
              <th className="text-right px-[2px] py-[1px]">%</th>
              <th className="text-right px-[2px] py-[1px]">LQ</th>
              <th className="text-right px-[2px] py-[1px]">VolM</th>
              <th className="text-right px-[2px] py-[1px]">Mom</th>
            </tr>
          </thead>
          <tbody>
            {displayRanked.map((q) => (
              <tr
                key={`mx-${q.symbol}`}
                className="border-t border-[#111] cursor-pointer hover:bg-[#0f0f0f]"
                onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })}
              >
                <td className="px-[2px] py-[1px] text-[#dbe7f7]">{q.symbol}</td>
                <td className={`px-[2px] py-[1px] text-right ${state.delta.priceFlash[q.symbol] ? 'font-bold text-[#f2f8ff]' : 'text-[#edf3fb]'}`}>{fmt(q.last, q.last < 10 ? 4 : 2)}</td>
                <td className={`px-[2px] py-[1px] text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}</td>
                <td className="px-[2px] py-[1px] text-right text-[#9eb3cf]">{q.liquidityScore}</td>
                <td className="px-[2px] py-[1px] text-right text-[#9eb3cf]">{fmt(q.volumeM, 1)}</td>
                <td className="px-[2px] py-[1px] text-right text-[#9eb3cf]">{q.momentum.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
