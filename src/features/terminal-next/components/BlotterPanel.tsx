'use client';

import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function BlotterPanel() {
  const { state, dispatch } = useTerminalStore();

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col">
      <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between text-[10px]">
        <span className="text-[#9bc3e8] font-bold">EXECUTION BLOTTER</span>
        <button
          onClick={() => dispatch({ type: 'SET_FUNCTION', payload: 'YAS' })}
          className="text-[#7f99ba]"
        >
          Fills
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[9px] tabular-nums">
          <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
            <tr>
              <th className="text-left px-1 py-0.5">Symbol</th>
              <th className="text-left px-1 py-0.5">Side</th>
              <th className="text-right px-1 py-0.5">Qty</th>
              <th className="text-right px-1 py-0.5">Avg</th>
              <th className="text-right px-1 py-0.5">Last</th>
              <th className="text-right px-1 py-0.5">PnL</th>
              <th className="text-left px-1 py-0.5">St</th>
            </tr>
          </thead>
          <tbody>
            {state.blotter.map((r) => (
              <tr key={r.id} className="border-t border-[#1a1a1a]">
                <td className="px-1 py-[1px] text-[#dbe7f7]">{r.symbol}</td>
                <td className={`px-1 py-[1px] font-bold ${r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{r.side}</td>
                <td className="px-1 py-[1px] text-right text-[#edf3fb]">{r.qty}</td>
                <td className="px-1 py-[1px] text-right text-[#edf3fb]">{fmt(r.avg, 2)}</td>
                <td className="px-1 py-[1px] text-right text-[#edf3fb]">{fmt(r.last, 2)}</td>
                <td
                  className={`px-1 py-[1px] text-right font-bold ${
                    state.delta.pnlFlash[r.id] === 'up'
                      ? 'bg-[#12372a] text-[#7dffcc]'
                      : state.delta.pnlFlash[r.id] === 'down'
                        ? 'bg-[#422031] text-[#ffb2c8]'
                        : r.pnl >= 0
                          ? 'text-[#4ce0a5]'
                          : 'text-[#ff7ca3]'
                  }`}
                >
                  {r.pnl >= 0 ? '+' : ''}{fmt(r.pnl, 0)}
                </td>
                <td className="px-1 py-[1px] text-[#9eb3cf]">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
