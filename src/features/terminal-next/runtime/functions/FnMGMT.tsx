'use client';

import React from 'react';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { makePerson } from '../entities/types';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

const FIRST_NAMES = ['James', 'Sarah', 'Michael', 'Jennifer', 'Robert', 'Lisa', 'David', 'Mary', 'John', 'Patricia', 'Thomas', 'Emily', 'Charles', 'Amanda', 'Christopher'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White'];
const TITLES = [
  'Chief Executive Officer', 'Chief Financial Officer', 'Chief Operating Officer',
  'Chief Technology Officer', 'Chief Marketing Officer', 'Chief Legal Officer',
  'SVP Engineering', 'SVP Finance', 'SVP Operations', 'VP Corporate Development',
  'VP Strategy', 'VP Investor Relations', 'General Counsel', 'Chief Risk Officer',
  'SVP Human Resources',
];

function generateExecs(ticker: string) {
  const seed = h(ticker);
  return TITLES.map((title, i) => {
    const fnIdx = (seed + i * 7) % FIRST_NAMES.length;
    const lnIdx = (seed + i * 13) % LAST_NAMES.length;
    const name = `${FIRST_NAMES[fnIdx]} ${LAST_NAMES[lnIdx]}`;
    const age = 45 + ((seed + i * 11) % 25);
    const since = 2005 + ((seed + i * 3) % 18);
    return { id: i, name, title, age, since };
  });
}

const COLS: DenseColumn[] = [
  { key: 'name', header: 'Name', width: '2fr' },
  { key: 'title', header: 'Title', width: '2fr' },
  { key: 'age', header: 'Age', width: '40px', align: 'right' },
  { key: 'since', header: 'Since', width: '50px', align: 'right' },
];

export function FnMGMT({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const rows = generateExecs(ticker);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`MGMT • Management — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0"
        panelIdx={panelIdx}
        rowEntity={(row) => makePerson(row.name as string, row.title as string, ticker)}
      />
    </div>
  );
}
