'use client';

import React from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { useTerminalLayout } from '../context/TerminalLayoutContext';

function CRTToggle() {
  const { crtOverlayEnabled, toggleCrtOverlay } = useTerminalLayout();
  return (
    <button
      onClick={toggleCrtOverlay}
      className={`px-1.5 py-0.5 text-[9px] border ${crtOverlayEnabled ? 'border-[#00FF00] text-[#00FF00] bg-[#00FF0010]' : 'border-[#3f4f63] text-[#5f7694]'}`}
      title="Alt+S: CRT overlay"
    >
      CRT
    </button>
  );
}

const fmt = (v: number, d = 2) =>
  v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * Global header: latency, server time, market status.
 * Fixed font size (0.65rem) for terminal density.
 */
export function SystemShellHeader() {
  const { deskStats, clocks, state } = useTerminalStore();

  return (
    <header
      className="flex-none h-7 px-3 flex items-center justify-between border-b border-[#111] bg-black text-[#a4b8d2]"
      style={{ fontSize: '0.65rem' }}
    >
      <div className="flex items-center gap-4 font-mono uppercase tracking-wider tabular-nums">
        <span>Latency</span>
        <span className="text-[#4ce0a5] font-bold">{deskStats.latency}ms</span>
        <span className="text-[#3f4f63]">|</span>
        <span>Server</span>
        <span className="text-[#9bc3e8]">NY {clocks.ny}</span>
        <span className="text-[#5f7694]">LDN {clocks.ldn}</span>
        <span className="text-[#5f7694]">HKG {clocks.hkg}</span>
        <span className="text-[#5f7694]">TKY {clocks.tky}</span>
        <span className="text-[#3f4f63]">|</span>
        <span>Market</span>
        <span
          className={
            state.risk.regime === 'VOL_EXPANSION'
              ? 'text-red-500'
              : state.risk.regime === 'TREND'
                ? 'text-green-500'
                : 'text-[#7a90ac]'
          }
        >
          {state.risk.regime}
        </span>
        <span className="text-[#3f4f63]">|</span>
        <span>Breadth</span>
        <span className={deskStats.breadth >= 50 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>
          {fmt(deskStats.breadth, 0)}%
        </span>
        <span className="text-[#3f4f63]">|</span>
        <span>Spread</span>
        <span>{fmt(deskStats.spread, 1)}bp</span>
      </div>
      <div className="font-mono text-[#7a90ac]">VANTAGE TERMINAL • 4-PANEL COMMAND CENTER</div>
    </header>
  );
}

/**
 * Global footer: system-level stats.
 */
export function SystemShellFooter() {
  const { state, dispatch } = useTerminalStore();

  return (
    <footer
      className="flex-none h-6 px-3 flex items-center justify-between border-t border-[#111] bg-black text-[#7a90ac] overflow-x-auto custom-scrollbar"
      style={{ fontSize: '0.6rem' }}
    >
      <div className="flex items-center gap-3 font-mono uppercase tracking-wider whitespace-nowrap min-w-max">
        {state.headlines.slice(0, 3).map((h, i) => (
          <button
            key={`foot-${i}`}
            onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' })}
            className="hover:text-[#9bc3e8] transition-colors"
          >
            [{660 + (i % 30)}] {h}
          </button>
        ))}
      </div>
      <div className="font-mono text-[#5f7694] shrink-0 flex items-center gap-2">
        <span>Adv/Dec {state.quotes.filter((q) => q.pct > 0).length}/{state.quotes.filter((q) => q.pct < 0).length}</span>
        <span>VaR {state.risk.intradayVar.toFixed(0)}</span>
        <CRTToggle />
      </div>
    </footer>
  );
}
