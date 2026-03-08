'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity } from '../entities/types';

const PEER_POOL = [
  { ticker: 'MSFT', name: 'Microsoft Corp', sector: 'Software', mcap: 3200 },
  { ticker: 'GOOGL', name: 'Alphabet Inc', sector: 'Internet', mcap: 2100 },
  { ticker: 'AMZN', name: 'Amazon.com', sector: 'E-Commerce', mcap: 1900 },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Social Media', mcap: 1300 },
  { ticker: 'NVDA', name: 'NVIDIA Corp', sector: 'Semiconductors', mcap: 2800 },
  { ticker: 'AAPL', name: 'Apple Inc', sector: 'Hardware', mcap: 2900 },
  { ticker: 'CRM', name: 'Salesforce', sector: 'Software', mcap: 280 },
  { ticker: 'ORCL', name: 'Oracle Corp', sector: 'Software', mcap: 350 },
  { ticker: 'ADBE', name: 'Adobe Inc', sector: 'Software', mcap: 240 },
  { ticker: 'INTC', name: 'Intel Corp', sector: 'Semiconductors', mcap: 170 },
  { ticker: 'AMD', name: 'AMD Inc', sector: 'Semiconductors', mcap: 280 },
  { ticker: 'AVGO', name: 'Broadcom Inc', sector: 'Semiconductors', mcap: 600 },
  { ticker: 'CSCO', name: 'Cisco Systems', sector: 'Networking', mcap: 210 },
  { ticker: 'IBM', name: 'IBM Corp', sector: 'IT Services', mcap: 180 },
  { ticker: 'TXN', name: 'Texas Instruments', sector: 'Semiconductors', mcap: 170 },
];

const COLS: DenseColumn[] = [
  { key: 'ticker', header: 'Ticker', width: '60px' },
  { key: 'name', header: 'Name', width: '2fr' },
  { key: 'sector', header: 'Sector', width: '1fr' },
  { key: 'mcap', header: 'MCap ($B)', width: '70px', align: 'right', format: (v) => Number(v).toLocaleString() },
];

export function FnRELS({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';

  const rows = useMemo(() => PEER_POOL.filter((p) => p.ticker !== ticker).map((p, i) => ({ id: i, ...p })), [ticker]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`RELS • Related Securities — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0"
        panelIdx={panelIdx}
        rowEntity={(row) => makeSecurity(`${row.ticker} US Equity`, row.name as string)}
        onRowClick={(row) => drill(makeSecurity(`${row.ticker} US Equity`, row.name as string), 'OPEN_IN_PLACE', panelIdx)}
      />
    </div>
  );
}
