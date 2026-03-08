'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

const EVENTS = [
  { type: 'EARNINGS', date: '2024-10-31', desc: 'Q4 FY24 Earnings Release', impact: 'HIGH' },
  { type: 'EARNINGS', date: '2024-07-25', desc: 'Q3 FY24 Earnings Release', impact: 'HIGH' },
  { type: 'DIVIDEND', date: '2024-11-08', desc: 'Ex-Dividend ($0.25)', impact: 'MED' },
  { type: 'DIVIDEND', date: '2024-08-09', desc: 'Ex-Dividend ($0.24)', impact: 'MED' },
  { type: 'SPLIT', date: '2020-08-31', desc: '4-for-1 Stock Split', impact: 'HIGH' },
  { type: 'GUIDANCE', date: '2024-10-31', desc: 'Q1 FY25 Revenue Guidance', impact: 'HIGH' },
  { type: 'BUYBACK', date: '2024-05-02', desc: '$110B Share Repurchase Auth', impact: 'MED' },
  { type: 'CONF', date: '2024-06-10', desc: 'WWDC 2024 Keynote', impact: 'MED' },
  { type: 'FILING', date: '2024-11-01', desc: '10-K Annual Report Filed', impact: 'LOW' },
  { type: 'RATING', date: '2024-10-15', desc: 'JPM Upgrades to Overweight', impact: 'MED' },
];

const COLS: DenseColumn[] = [
  { key: 'date', header: 'Date', width: '80px' },
  { key: 'type', header: 'Type', width: '70px' },
  { key: 'desc', header: 'Description', width: '3fr' },
  { key: 'impact', header: 'Impact', width: '50px' },
];

export function FnEVT({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const rows = EVENTS.map((e, i) => ({ id: i, ...e }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`EVT • Corporate Events — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" />
    </div>
  );
}
