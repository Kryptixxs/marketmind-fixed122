'use client';

import { useState } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { TerminalTutorialModal } from './TerminalTutorialModal';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function TopTickerBar() {
  const { state, dispatch } = useTerminalStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const sorted = [...state.quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  return (
    <>
      <div className="h-5 border-b border-[#1a1a1a] bg-black px-1 flex items-center gap-1 text-[9px] tabular-nums">
        <div className="flex-1 min-w-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-max grid auto-cols-[140px] grid-flow-col gap-x-1 pr-1">
          {sorted.map((q, idx) => (
            <button
              key={`top-${q.symbol}`}
              onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })}
              className="flex items-center justify-between min-w-0 border-r border-[#1a1a1a] last:border-r-0 pr-1"
            >
              <span className={`truncate ${idx === 0 ? 'text-[#fbe4aa] font-bold' : 'text-[#a8bad0]'}`}>{q.symbol}</span>
              <span
                className={`${
                  q.pct >= 0 ? 'text-green-500' : 'text-red-500'
                } ${state.delta.priceFlash[q.symbol] ? 'font-bold' : ''}`}
              >
                {q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}%
              </span>
            </button>
          ))}
          </div>
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="h-4 px-1 border border-[#5a1f35] bg-[#2b1019] text-[#ffd5e1] text-[8px] font-bold shrink-0"
        >
          HELP
        </button>
      </div>
      <TerminalTutorialModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
