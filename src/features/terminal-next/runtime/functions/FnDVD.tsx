'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

const COLS: DenseColumn[] = [
  { key: 'exDate', header: 'Ex-Date', width: '80px' },
  { key: 'payDate', header: 'Pay Date', width: '80px' },
  { key: 'amount', header: 'Amount', width: '60px', align: 'right', format: (v) => '$' + Number(v).toFixed(2) },
  { key: 'type', header: 'Type', width: '70px' },
  { key: 'freq', header: 'Freq', width: '60px' },
];

export function FnDVD({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';

  const rows = useMemo(() => {
    const result: Array<Record<string, unknown>> = [];
    const base = 0.24;
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const ex = new Date(now.getTime() - i * 91 * 86400000);
      const pay = new Date(ex.getTime() + 14 * 86400000);
      result.push({
        id: i,
        exDate: ex.toISOString().slice(0, 10),
        payDate: pay.toISOString().slice(0, 10),
        amount: base + (i < 8 ? 0 : -0.01 * Math.floor(i / 4)),
        type: 'Regular',
        freq: 'Quarterly',
      });
    }
    return result;
  }, [ticker]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`DVD • Dividends — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" />
    </div>
  );
}
