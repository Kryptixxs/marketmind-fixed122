'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

const COLS: DenseColumn[] = [
  { key: 'exDate', header: 'Ex-Date', width: '80px' },
  { key: 'payDate', header: 'Pay Date', width: '80px' },
  { key: 'amount', header: 'Amount', width: '60px', align: 'right', format: (v) => '$' + Number(v).toFixed(4) },
  { key: 'type', header: 'Type', width: '70px' },
  { key: 'freq', header: 'Freq', width: '60px' },
];

export function FnDVD({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';

  const rows = useMemo(() => {
    const seed = h(ticker);
    // Base dividend seeded by ticker: range $0.10–$1.50
    const base = (0.10 + (seed % 140) / 100);
    const result: Array<Record<string, unknown>> = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const ex = new Date(now.getTime() - i * 91 * 86400000);
      const pay = new Date(ex.getTime() + 14 * 86400000);
      // Slight decline in earlier periods to simulate history
      const amount = Math.max(0.01, base - 0.001 * Math.floor(i / 4));
      result.push({
        id: i,
        exDate: ex.toISOString().slice(0, 10),
        payDate: pay.toISOString().slice(0, 10),
        amount,
        type: 'Regular',
        freq: 'Quarterly',
      });
    }
    return result;
  }, [ticker]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`DVD • Dividends — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" panelIdx={panelIdx} />
    </div>
  );
}
