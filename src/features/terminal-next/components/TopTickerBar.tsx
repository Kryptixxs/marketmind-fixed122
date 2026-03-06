'use client';

import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function TopTickerBar() {
  const { state, dispatch } = useTerminalStore();
  const sorted = [...state.quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 6);
  return (
    <div className="h-5 border-b border-[#1a2433] bg-[#070d17] px-1 grid grid-cols-6 gap-x-1 text-[10px] tabular-nums">
      {sorted.map((q, idx) => (
        <button
          key={`top-${q.symbol}`}
          onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })}
          className="flex items-center justify-between min-w-0 border-r border-[#162133] last:border-r-0 pr-1"
        >
          <span className={`truncate ${idx === 0 ? 'text-[#d7e2f2] font-bold' : 'text-[#9db0cb]'}`}>{q.symbol}</span>
          <span
            className={`${
              q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'
            } ${state.delta.priceFlash[q.symbol] ? 'font-bold' : ''}`}
          >
            {q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}%
          </span>
        </button>
      ))}
    </div>
  );
}
