'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

function makeEvent2(type: string, date: string, desc: string) {
  return { kind: 'EVENT' as const, id: `${type}-${date}`, display: desc, payload: { type, date, desc } };
}

const EVENT_TYPES = ['EARNINGS', 'EARNINGS', 'DIVIDEND', 'DIVIDEND', 'GUIDANCE', 'BUYBACK', 'RATING', 'FILING', 'SPLIT', 'CONF'];
const EVENT_IMPACTS = ['HIGH', 'HIGH', 'MED', 'MED', 'HIGH', 'MED', 'MED', 'LOW', 'HIGH', 'MED'];

function generateEvents(ticker: string) {
  const seed = h(ticker);
  const now = new Date();
  return EVENT_TYPES.map((type, i) => {
    const daysBack = (seed * (i + 1) * 31) % 180;
    const d = new Date(now.getTime() - daysBack * 86400000);
    const date = d.toISOString().slice(0, 10);
    const descriptions: Record<string, string> = {
      EARNINGS: `${ticker} Q${((seed + i) % 4) + 1} Earnings Release`,
      DIVIDEND: `Ex-Dividend $${(0.20 + (seed % 20) / 100).toFixed(2)}/share`,
      GUIDANCE: `${ticker} FY Guidance Update`,
      BUYBACK: `${ticker} $${(1 + seed % 9)}B Buyback Authorization`,
      RATING: `JPM ${['Upgrades', 'Initiates at', 'Downgrades'][i % 3]} ${ticker}`,
      FILING: `${ticker} ${['10-K', '10-Q', '8-K', 'DEF 14A'][i % 4]} Filed`,
      SPLIT: `${ticker} ${(seed % 3) + 2}-for-1 Stock Split`,
      CONF: `${ticker} Investor Day / Conference`,
    };
    const desc = descriptions[type] ?? `${ticker} ${type}`;
    return { id: i, type, date, desc, impact: EVENT_IMPACTS[i]! };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

const COLS: DenseColumn[] = [
  { key: 'date', header: 'Date', width: '80px' },
  { key: 'type', header: 'Type', width: '70px' },
  { key: 'desc', header: 'Description', width: '3fr' },
  { key: 'impact', header: 'Impact', width: '50px' },
];

export function FnEVT({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const rows = useMemo(() => generateEvents(ticker), [ticker]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`EVT • Corporate Events — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0"
        panelIdx={panelIdx}
        rowEntity={(row) => makeEvent2(row.type as string, row.date as string, row.desc as string)}
      />
    </div>
  );
}
