'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function CrossAssetMatrixPanel() {
  const { state, dispatch } = useTerminalStore();

  const ranked = useMemo(() => [...state.quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)), [state.quotes]);

  return (
    <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
      <div className="h-5 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
        <span className="text-[#9bc3e8] font-bold">CROSS-ASSET MATRIX</span>
        <span className="text-[#7f99ba]">|%| Rank</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[9px] tabular-nums">
          <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
            <tr>
              <th className="text-left px-1 py-0.5">Asset</th>
              <th className="text-right px-1 py-0.5">Last</th>
              <th className="text-right px-1 py-0.5">%Chg</th>
              <th className="text-right px-1 py-0.5">Liq</th>
              <th className="text-right px-1 py-0.5">Vol</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((q) => (
              <tr
                key={`mx-${q.symbol}`}
                className="border-t border-[#142034] cursor-pointer hover:bg-[#0d1a2c]"
                onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })}
              >
                <td className="px-1 py-[1px] text-[#dbe7f7]">{q.symbol}</td>
                <td className={`px-1 py-[1px] text-right ${state.delta.priceFlash[q.symbol] ? 'font-bold text-[#f2f8ff]' : 'text-[#edf3fb]'}`}>{fmt(q.last, q.last < 10 ? 4 : 2)}</td>
                <td className={`px-1 py-0.5 text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}</td>
                <td className="px-1 py-[1px] text-right text-[#9eb3cf]">{q.liquidityScore}</td>
                <td className="px-1 py-[1px] text-right text-[#9eb3cf]">{fmt(q.volumeM, 2)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
