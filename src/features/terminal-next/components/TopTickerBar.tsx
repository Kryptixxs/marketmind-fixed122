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
      <div className="h-[14px] border-b border-[#111] bg-black px-[2px] flex items-center gap-[2px] text-[8px] font-mono tracking-tight uppercase tabular-nums">
        <div className="flex-1 min-w-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-max grid auto-cols-[116px] grid-flow-col gap-x-[2px] pr-[2px]">
          {sorted.map((q, idx) => (
            <button
              key={`top-${q.symbol}`}
              onClick={() => dispatch({ type: 'SET_SYMBOL', payload: q.symbol })}
              className="flex items-center justify-between min-w-0 border-r border-[#111] last:border-r-0 pr-[2px]"
            >
              <span data-ticker={q.symbol} className={`truncate ${idx === 0 ? 'text-[#fbe4aa] font-bold' : 'text-[#a8bad0]'}`}>{q.symbol}</span>
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
          className="h-[12px] px-[2px] border border-[#5a1f35] bg-[#2b1019] text-[#ffd5e1] text-[7px] font-bold shrink-0 leading-none"
        >
          HELP
        </button>
      </div>
      <TerminalTutorialModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
