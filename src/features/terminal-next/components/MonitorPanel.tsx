'use client';

import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function MonitorPanel() {
  const { state, dispatch } = useTerminalStore();
  const adv = state.quotes.filter((q) => q.pct >= 0).length;
  const dec = state.quotes.filter((q) => q.pct < 0).length;
  const breadth = state.quotes.length > 0 ? ((adv / state.quotes.length) * 100).toFixed(1) : '0';

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col font-mono tracking-tight uppercase tabular-nums">
      <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] flex items-center justify-between text-[8px]">
        <span className="text-[#9bc3e8] font-bold">MONITORS</span>
        <span className="text-[#7f99ba]">{state.quotes.length} LIVE</span>
      </div>
      <div className="h-[12px] px-[2px] border-b border-[#111] grid grid-cols-[auto_auto_auto_auto_auto_auto] gap-[2px] bg-[#0a0a0a] text-[7px] leading-none">
        <span className="text-[#7d91ac]">Adv</span>
        <span className="text-[#4ce0a5] font-bold">{adv}</span>
        <span className="text-[#7d91ac]">Dec</span>
        <span className="text-[#ff7ca3] font-bold">{dec}</span>
        <span className="text-[#7d91ac]">Brd</span>
        <span className="text-[#e7f1ff] font-bold">{breadth}%</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[8px] tabular-nums">
          <thead className="sticky top-0 bg-[#0a0a0a]">
            <tr className="text-[#7db0db]">
                  <th className="text-left px-[2px] py-[1px]">Tk</th>
                  <th className="text-right px-[2px] py-[1px]">Last</th>
                  <th className="text-right px-[2px] py-[1px]">Δ</th>
                  <th className="text-right px-[2px] py-[1px]">%</th>
                  <th className="text-right px-[2px] py-[1px]">LQ</th>
                  <th className="text-right px-[2px] py-[1px]">β</th>
                  <th className="text-right px-[2px] py-[1px]">VolM</th>
            </tr>
          </thead>
          <tbody>
            {state.quotes.map((q) => (
              <tr
                key={q.symbol}
                className="border-t border-[#111] hover:bg-[#0f0f0f] cursor-pointer"
                onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })}
              >
                    <td className="px-[2px] py-[1px] text-[#d7e2f2]">{q.symbol}</td>
                    <td className={`px-[2px] py-[1px] text-right ${state.delta.priceFlash[q.symbol] ? 'font-bold text-[#f2f8ff]' : 'text-[#edf3fb]'}`}>{fmt(q.last, q.last < 10 ? 4 : 2)}</td>
                    <td className={`px-[2px] py-[1px] text-right font-bold ${q.abs >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.abs >= 0 ? '+' : ''}{fmt(q.abs, 2)}</td>
                    <td className={`px-[2px] py-[1px] text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>
                  {q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}
                </td>
                <td className="px-[2px] py-[1px] text-right text-[#9eb3cf]">{q.liquidityScore}</td>
                <td className="px-[2px] py-[1px] text-right text-[#9eb3cf]">{q.betaToSPX.toFixed(2)}</td>
                <td className="px-[2px] py-[1px] text-right text-[#9eb3cf]">{fmt(q.volumeM, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
