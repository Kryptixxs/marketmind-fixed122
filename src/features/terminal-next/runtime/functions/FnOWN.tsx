'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { makeHolder } from '../entities/types';

const HOLDERS = [
  'Vanguard Group', 'BlackRock', 'State Street', 'Fidelity Mgmt', 'Berkshire Hathaway',
  'Capital Research', 'Geode Capital', 'T Rowe Price', 'JPMorgan Chase', 'Northern Trust',
  'Morgan Stanley', 'Bank of America', 'Goldman Sachs AM', 'Wellington Mgmt', 'Invesco',
  'Charles Schwab', 'Dimensional FA', 'Citadel Advisors', 'AQR Capital', 'Two Sigma',
];

const COLS: DenseColumn[] = [
  { key: 'holder', header: 'Holder', width: '2fr' },
  { key: 'shares', header: 'Shares (M)', width: '80px', align: 'right', format: (v) => Number(v).toFixed(1) },
  { key: 'pct', header: '% Out', width: '60px', align: 'right', format: (v) => Number(v).toFixed(2) + '%' },
  { key: 'change', header: 'Chg (M)', width: '70px', align: 'right', tone: true, format: (v) => { const n = Number(v); return (n >= 0 ? '+' : '') + n.toFixed(1); } },
  { key: 'value', header: 'Value ($B)', width: '70px', align: 'right', format: (v) => Number(v).toFixed(1) },
];

export function FnOWN({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';

  const rows = useMemo(() => {
    const seed = Array.from(ticker).reduce((a, c) => a + c.charCodeAt(0), 0);
    return HOLDERS.map((holder, i) => {
      const shares = 100 + ((seed + i * 37) % 800);
      const pct = shares / 160;
      const change = ((seed + i * 13) % 60) - 30;
      const value = shares * 0.175;
      return { id: i, holder, shares, pct, change, value };
    });
  }, [ticker]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`OWN • Institutional Ownership — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0"
        panelIdx={panelIdx}
        rowEntity={(row) => makeHolder(row.holder as string, Number(row.pct))}
      />
    </div>
  );
}
