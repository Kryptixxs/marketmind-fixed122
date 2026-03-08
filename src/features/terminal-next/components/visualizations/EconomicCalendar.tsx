'use client';

import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';

export type CalendarEventImpact = 'high' | 'medium' | 'low';

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: CalendarEventImpact;
  actual?: string;
  estimate?: string;
  prior?: string;
  /** true = beat estimate (flash green), false = miss (flash red), undefined = no actual yet */
  beat?: boolean;
}

const TICK_FLASH_MS = 300;

const EVENTS: Omit<CalendarEvent, 'id' | 'beat'>[] = [
  { date: '03/07', time: '08:30', country: 'US', event: 'Nonfarm Payrolls', impact: 'high', actual: '175K', estimate: '180K', prior: '272K' },
  { date: '03/07', time: '08:30', country: 'US', event: 'Unemployment Rate', impact: 'high', actual: '3.9%', estimate: '3.8%', prior: '3.7%' },
  { date: '03/07', time: '10:00', country: 'US', event: 'ISM Services PMI', impact: 'medium', actual: '53.8', estimate: '53.2', prior: '52.6' },
  { date: '03/10', time: '14:00', country: 'US', event: 'Fed Budget Balance', impact: 'low', estimate: '-$285B', prior: '-$296B' },
  { date: '03/11', time: '08:30', country: 'US', event: 'CPI YoY', impact: 'high', estimate: '3.2%', prior: '3.1%' },
  { date: '03/11', time: '08:30', country: 'US', event: 'Core CPI MoM', impact: 'high', estimate: '0.3%', prior: '0.3%' },
  { date: '03/12', time: '14:00', country: 'US', event: 'Fed Rate Decision', impact: 'high', estimate: '4.50-4.75%', prior: '4.50-4.75%' },
  { date: '03/13', time: '08:30', country: 'US', event: 'Retail Sales', impact: 'medium', actual: '0.8%', estimate: '0.5%', prior: '0.6%' },
  { date: '03/14', time: '08:30', country: 'US', event: 'Initial Jobless Claims', impact: 'medium', estimate: '218K', prior: '215K' },
  { date: '03/14', time: '08:30', country: 'US', event: 'PPI MoM', impact: 'medium', actual: '0.2%', estimate: '0.3%', prior: '0.3%' },
];

/** Parse numeric value for beat/miss comparison. Higher is better for most (jobs, PMI). Lower for unemployment, inflation. */
function parseEconValue(s: string): number | null {
  const t = s.replace(/,/g, '').replace(/\$/g, '').trim();
  const pct = t.endsWith('%');
  const k = /K$/i.test(t);
  const b = /B$/i.test(t);
  const num = parseFloat(t.replace(/[KkBb%$,-]/g, ''));
  if (Number.isNaN(num)) return null;
  let v = num;
  if (k) v *= 1000;
  if (b) v *= 1e9;
  return pct ? num : v;
}

/** Determine beat: for % (unemployment, inflation) lower=better; for counts/PMI higher=better */
function computeBeat(actual: string, estimate: string, event: string): boolean {
  const a = parseEconValue(actual);
  const e = parseEconValue(estimate);
  if (a == null || e == null) return false;
  const lowerBetter = /unemployment|jobless|claims|inflation|cpi|ppi|deficit|balance/i.test(event);
  return lowerBetter ? a < e : a > e;
}

export interface EconomicCalendarProps {
  className?: string;
  maxHeight?: string;
}

export const EconomicCalendar = memo(function EconomicCalendar({
  className = '',
  maxHeight = '200px',
}: EconomicCalendarProps) {
  const events = useMemo(
    () =>
      EVENTS.map((e, i) => ({
        ...e,
        id: `cal-${i}`,
        beat: e.actual && e.estimate ? computeBeat(e.actual, e.estimate, e.event) : undefined,
      })),
    []
  );

  const [flashMap, setFlashMap] = useState<Record<string, 'beat' | 'miss'>>({});
  const prevActualRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const next: Record<string, 'beat' | 'miss'> = {};
    for (const e of events) {
      if (!e.actual) continue;
      const prev = prevActualRef.current.get(e.id);
      if (prev !== e.actual) {
        prevActualRef.current.set(e.id, e.actual);
        if (e.beat !== undefined) next[e.id] = e.beat ? 'beat' : 'miss';
      }
    }
    if (Object.keys(next).length > 0) {
      setFlashMap(next);
      const t = setTimeout(() => setFlashMap({}), TICK_FLASH_MS);
      return () => clearTimeout(t);
    }
  }, [events]);

  const impactColor = (i: CalendarEventImpact) =>
    i === 'high' ? '#FF0000' : i === 'medium' ? '#FFD700' : '#666';

  return (
    <div
      className={clsx(
        'overflow-y-auto custom-scrollbar terminal-scrollbar bg-[#000000] border border-[#222] font-mono',
        className
      )}
      style={{ maxHeight, fontSize: '10px' }}
    >
      <div className="h-[14px] px-2 py-1 border-b border-[#222] text-[#FFB000] font-bold uppercase tracking-wider sticky top-0 bg-[#0a0a0a] z-10">
        ECO • Economic Calendar
      </div>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#5a6b7a] text-[9px]">
            <th className="text-left px-2 py-1 border-b border-[#222]">Time</th>
            <th className="text-left px-2 py-1 border-b border-[#222]">Event</th>
            <th className="text-right px-2 py-1 border-b border-[#222]">Estimate</th>
            <th className="text-right px-2 py-1 border-b border-[#222]">Actual</th>
            <th className="text-right px-2 py-1 border-b border-[#222]">Prior</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const flash = flashMap[e.id];
            const actualCellBg =
              flash === 'beat' ? 'rgba(0,255,0,0.25)' : flash === 'miss' ? 'rgba(255,0,0,0.25)' : undefined;
            return (
              <tr key={e.id} className="border-b border-[#111] hover:bg-[#0a0a0a]">
                <td className="px-2 py-1 text-[#666] tabular-nums">{e.time}</td>
                <td className="px-2 py-1">
                  <span
                    className="w-1 h-3 inline-block mr-1 align-middle"
                    style={{ backgroundColor: impactColor(e.impact) }}
                  />
                  <span className="text-[#b0b8c4]">{e.event}</span>
                </td>
                <td className="px-2 py-1 text-right tabular-nums text-[#666]">{e.estimate ?? '—'}</td>
                <td
                  className={clsx(
                    'px-2 py-1 text-right tabular-nums transition-colors',
                    flash === 'beat' && 'text-[#00FF00]',
                    flash === 'miss' && 'text-[#FF0000]',
                    !flash && e.actual && 'text-[#00FF00]',
                    !flash && !e.actual && 'text-[#666]'
                  )}
                  style={{ backgroundColor: actualCellBg, transitionDuration: `${TICK_FLASH_MS}ms` }}
                >
                  {e.actual ?? '—'}
                </td>
                <td className="px-2 py-1 text-right tabular-nums text-[#555]">{e.prior ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
