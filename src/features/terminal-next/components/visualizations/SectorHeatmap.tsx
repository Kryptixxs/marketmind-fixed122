'use client';

import React, { useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { useMarketData } from '../../hooks/useMarketData';

interface SectorCell {
  sector: string;
  marketCap: number;
  pctChg: number;
  symbols: string[];
}

/** Map pctChg (-5 to +5) to color: deep red -> neutral -> bright green */
function pctToColor(pct: number): string {
  const t = Math.max(-5, Math.min(5, pct));
  const n = (t + 5) / 10;
  const r = Math.round(255 * (1 - n));
  const g = Math.round(255 * n);
  return `rgb(${r},${g},0)`;
}

/**
 * IMAP - Sector Heatmap. Treemap layout:
 * Size = Market Cap, Color = % Change (deep red to bright green).
 */
export function SectorHeatmap() {
  const { quotes } = useMarketData();
  const { state } = useTerminalStore();

  const sectorData = useMemo(() => {
    const bySector = new Map<string, { mcap: number; pctSum: number; pctW: number; symbols: string[] }>();
    const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

    for (const q of quotes) {
      const sector = state.referenceBySymbol[q.symbol]?.sector ?? 'Other';
      const mcap = state.referenceBySymbol[q.symbol]?.marketCapBn ?? 50 + (hash(q.symbol) % 200);
      const pct = q.pct;

      const cur = bySector.get(sector);
      if (cur) {
        cur.mcap += mcap;
        cur.pctSum += pct * mcap;
        cur.pctW += mcap;
        cur.symbols.push(q.symbol);
      } else {
        bySector.set(sector, { mcap, pctSum: pct * mcap, pctW: mcap, symbols: [q.symbol] });
      }
    }

    const totalMcap = [...bySector.values()].reduce((a, c) => a + c.mcap, 0);
    const cells: SectorCell[] = [];
    for (const [sector, d] of bySector) {
      const avgPct = d.pctW > 0 ? d.pctSum / d.pctW : 0;
      cells.push({
        sector,
        marketCap: d.mcap,
        pctChg: avgPct,
        symbols: d.symbols,
      });
    }
    return { cells, totalMcap };
  }, [quotes, state.referenceBySymbol]);

  const { cells, totalMcap } = sectorData;
  const sorted = useMemo(() => [...cells].sort((a, b) => b.marketCap - a.marketCap), [cells]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#000000] overflow-auto terminal-scrollbar">
      <div className="flex-none px-2 py-1 border-b border-[#333] bg-[#0a0a0a]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFB000]">
          IMAP • Sector Heatmap
        </span>
      </div>
      <div
        className="flex-1 min-h-0 p-2 flex flex-wrap content-start gap-1"
        style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}
      >
        {sorted.map((c) => {
          const pct = Math.max(-5, Math.min(5, c.pctChg));
          const w = totalMcap > 0 ? Math.max(15, (c.marketCap / totalMcap) * 100) : 20;
          return (
            <div
              key={c.sector}
              className="flex flex-col justify-center items-center border border-[#333] min-w-[80px] cursor-pointer hover:border-[#555] transition-colors"
              style={{
                width: `${w}%`,
                minHeight: '48px',
                backgroundColor: pctToColor(pct),
                color: pct >= 0 ? '#001a00' : '#1a0000',
              }}
            >
              <span className="font-bold uppercase truncate w-full text-center px-1">{c.sector}</span>
              <span className="tabular-nums font-bold">
                {pct >= 0 ? '+' : ''}
                {pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
