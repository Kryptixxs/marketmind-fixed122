'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';

const TICK_FLASH_MS = 200;

type SortKey = 'name' | 'symbol' | 'last' | 'abs' | 'pct';
type SortDir = 'asc' | 'desc';

const fmtNum = (n: number, decimals = 2) => n.toFixed(decimals);
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
const chgColor = (n: number) => (n > 0 ? '#00FF00' : n < 0 ? '#FF0000' : '#666666');

/**
 * WEI - World Equity Indices. High-density table:
 * 5 cols (Index, Ticker, Last, Net Chg, %Chg), 11px font, 20px rows, aligned, +/- colors.
 * 1-click sort on every column; sorted header turns Amber.
 * Tick Flash: Price and %Chg cells flash Green/Red for 200ms on update.
 */
export function WorldEquityIndices() {
  const { state, dispatch } = useTerminalStore();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'symbol', dir: 'asc' });
  const rows = useMemo(() => {
    const r = [...state.quotes.slice(0, 21)];
    r.sort((a, b) => {
      const vA = a[sort.key];
      const vB = b[sort.key];
      const cmp = typeof vA === 'string' ? (vA as string).localeCompare(vB as string) : (vA as number) - (vB as number);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [state.quotes, sort]);
  const prevRef = useRef<Map<string, { last: number; pct: number }>>(new Map());
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    const next: Record<string, 'up' | 'down'> = {};
    for (const q of rows) {
      const prev = prevRef.current.get(q.symbol);
      if (prev) {
        if (q.last > prev.last) next[q.symbol] = 'up';
        else if (q.last < prev.last) next[q.symbol] = 'down';
      }
      prevRef.current.set(q.symbol, { last: q.last, pct: q.pct });
    }
    if (Object.keys(next).length > 0) {
      setFlashMap(next);
      const t = setTimeout(() => setFlashMap({}), TICK_FLASH_MS);
      return () => clearTimeout(t);
    }
  }, [rows, state.tickMs]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#000000]">
      <div className="flex-none px-2 py-1 border-b border-[#333] bg-[#0a0a0a]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFB000]">
          WEI • World Equity Indices
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        <table
          className="w-full border-collapse"
          style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#0a0a0a]">
            <tr className="border-b border-[#333]" style={{ height: '20px' }}>
              {(['name', 'symbol', 'last', 'abs', 'pct'] as const).map((key) => {
                const isSorted = sort.key === key;
                const label = key === 'name' ? 'Index' : key === 'symbol' ? 'Ticker' : key === 'abs' ? 'Net Chg' : key === 'pct' ? '%Chg' : 'Last';
                return (
                  <th
                    key={key}
                    className={`py-0 px-2 font-bold uppercase tracking-wider cursor-pointer select-none ${key === 'name' || key === 'symbol' ? 'text-left' : 'text-right tabular-nums'}`}
                    style={{ color: isSorted ? '#FFB000' : '#666' }}
                    onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
                  >
                    {label}{isSorted && (sort.dir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const flash = flashMap[r.symbol];
              return (
                <tr
                  key={r.symbol}
                  className="border-b border-[#222] hover:bg-[#111] cursor-pointer"
                  style={{ height: '20px' }}
                  onClick={() => dispatch({ type: 'TICKER_SELECTED', payload: r.symbol })}
                >
                  <td className="py-0 px-2 text-[#FFFFFF] whitespace-nowrap overflow-hidden text-ellipsis">{r.name}</td>
                  <td className="py-0 px-2 text-[#999] whitespace-nowrap overflow-hidden text-ellipsis tabular-nums" data-ticker={r.symbol}>{r.symbol}</td>
                  <td className={`py-0 px-2 text-right text-[#FFFFFF] tabular-nums ${flash ? `cell-flash-${flash}` : ''}`}>
                    {fmtNum(r.last)}
                  </td>
                  <td className={`py-0 px-2 text-right tabular-nums ${flash ? `cell-flash-${flash}` : ''}`} style={{ color: chgColor(r.abs) }}>
                    {(r.abs >= 0 ? '+' : '') + fmtNum(r.abs)}
                  </td>
                  <td className={`py-0 px-2 text-right tabular-nums ${flash ? `cell-flash-${flash}` : ''}`} style={{ color: chgColor(r.pct) }}>
                    {fmtPct(r.pct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}