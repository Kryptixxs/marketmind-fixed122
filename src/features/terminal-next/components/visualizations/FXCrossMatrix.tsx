'use client';

import React, { memo, useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY'] as const;
const TICK_MS = 1000;
const FLASH_MS = 200;

function randomRate(base: number, pct = 0.003): number {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

export interface FXCrossMatrixProps {
  className?: string;
}

export const FXCrossMatrix = memo(function FXCrossMatrix({ className = '' }: FXCrossMatrixProps) {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    const baseRates: Record<string, number> = {
      'USD/EUR': 0.92,
      'USD/GBP': 0.79,
      'USD/JPY': 149.5,
      'EUR/USD': 1.087,
      'EUR/GBP': 0.858,
      'EUR/JPY': 162.5,
      'GBP/USD': 1.265,
      'GBP/EUR': 1.165,
      'GBP/JPY': 189.2,
      'JPY/USD': 0.00669,
      'JPY/EUR': 0.00615,
      'JPY/GBP': 0.00529,
    };
    for (const [k, v] of Object.entries(baseRates)) m[k] = v;
    return m;
  });

  const [flashMap, setFlashMap] = useState<Record<string, boolean>>({});
  const prevRatesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const iv = setInterval(() => {
      const next: Record<string, number> = {};
      const baseRates: [string, number][] = [
        ['USD/EUR', 0.92],
        ['USD/GBP', 0.79],
        ['USD/JPY', 149.5],
        ['EUR/USD', 1.087],
        ['EUR/GBP', 0.858],
        ['EUR/JPY', 162.5],
        ['GBP/USD', 1.265],
        ['GBP/EUR', 1.165],
        ['GBP/JPY', 189.2],
        ['JPY/USD', 0.00669],
        ['JPY/EUR', 0.00615],
        ['JPY/GBP', 0.00529],
      ];
      const flashes: Record<string, boolean> = {};
      for (const [pair, base] of baseRates) {
        const v = randomRate(base);
        next[pair] = v;
        const prev = prevRatesRef.current[pair];
        if (prev !== undefined && Math.abs(v - prev) > 1e-6) flashes[pair] = true;
      }
      prevRatesRef.current = next;
      setRates(next);
      if (Object.keys(flashes).length > 0) {
        setFlashMap(flashes);
        setTimeout(() => setFlashMap({}), FLASH_MS);
      }
    }, TICK_MS);
    return () => clearInterval(iv);
  }, []);

  const fmt = (pair: string, v: number) => {
    if (pair.startsWith('JPY/') || pair.endsWith('/JPY')) {
      return v >= 1 ? v.toFixed(2) : v.toFixed(4);
    }
    return v.toFixed(4);
  };

  return (
    <div
      className={`flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#000000] border border-[#333] font-mono ${className}`}
      style={{ fontSize: '10px' }}
    >
      <div className="flex-none px-2 py-1 border-b border-[#333] text-[#FFB000] font-bold uppercase tracking-wider">
        FXC • FX Cross Matrix
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar p-2">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="w-12 h-6 text-[#666] text-[9px] uppercase" />
              {CURRENCIES.map((c) => (
                <th key={c} className="h-6 text-center text-[#FFB000] text-[9px] font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CURRENCIES.map((row) => (
              <tr key={row}>
                <td className="h-6 text-[#FFB000] text-[9px] font-bold py-0.5">{row}</td>
                {CURRENCIES.map((col) => {
                  const isDiag = row === col;
                  const pair = `${row}/${col}`;
                  const rate = rates[pair];
                  const flash = flashMap[pair];
                  return (
                    <td
                      key={col}
                      className={clsx(
                        'h-6 text-center tabular-nums py-0.5 transition-colors',
                        isDiag && 'bg-[#222] text-[#444]',
                        !isDiag && 'text-[#b0b8c4]'
                      )}
                      style={{
                        backgroundColor: flash ? 'rgba(255,176,0,0.2)' : isDiag ? undefined : undefined,
                        transitionDuration: `${FLASH_MS}ms`,
                      }}
                    >
                      {isDiag ? '—' : rate != null ? fmt(pair, rate) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
