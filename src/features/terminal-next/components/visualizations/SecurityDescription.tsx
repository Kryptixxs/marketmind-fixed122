'use client';

import React, { useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';

const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

function buildDescription(ticker: string): { marketCap: string; pe: number; divYield: string; summary: string } {
  const h = hash(ticker);
  const mcap = (50 + (h % 950)) * 1e9;
  const mcapStr = mcap >= 1e12 ? `${(mcap / 1e12).toFixed(2)}T` : mcap >= 1e9 ? `${(mcap / 1e9).toFixed(2)}B` : `${(mcap / 1e6).toFixed(0)}M`;
  const pe = 8 + (h % 45);
  const divYld = (0.5 + (h % 80) / 100).toFixed(2) + '%';
  const sentences = [
    'The company operates across multiple segments including technology, services, and consumer products.',
    'Revenue has shown consistent growth over the past five years with expanding margins.',
    'Management has prioritized capital allocation toward high-return growth initiatives and strategic M&A.',
    'The balance sheet remains strong with manageable leverage and ample liquidity.',
    'Analysts remain broadly positive on the long-term outlook given the competitive moat and market position.',
  ];
  const summary = sentences.join(' ');
  return { marketCap: mcapStr, pe, divYield: divYld, summary };
}

/**
 * DES - Security Description. 2-column layout:
 * Market Cap, P/E Ratio, Dividend Yield, 5-sentence Business Summary in Amber.
 */
export function SecurityDescription() {
  const { state } = useTerminalStore();
  const ticker = state.activeSymbol;
  const data = useMemo(() => buildDescription(ticker), [ticker]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#000000] overflow-auto terminal-scrollbar">
      <div className="flex-none px-2 py-1 border-b border-[#333] bg-[#0a0a0a]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFB000]">
          DES • Security Description • {ticker}
        </span>
      </div>
      <div className="flex-1 min-h-0 p-3 grid grid-cols-2 gap-x-6 gap-y-2" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>
        <div className="col-span-2 grid grid-cols-2 gap-4 mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">Market Cap</span>
            <span className="text-[#FFFFFF] tabular-nums">{data.marketCap}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">P/E Ratio</span>
            <span className="text-[#FFFFFF] tabular-nums">{data.pe}x</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">Dividend Yield</span>
            <span className="text-[#FFFFFF] tabular-nums">{data.divYield}</span>
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1 mt-2">
          <span className="text-[#666] text-[10px] uppercase tracking-wider">Business Summary</span>
          <p className="text-[#FFB000] leading-relaxed" style={{ fontSize: '11px' }}>
            {data.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
