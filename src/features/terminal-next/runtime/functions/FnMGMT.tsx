'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

const EXECS = [
  { name: 'Timothy D. Cook', title: 'Chief Executive Officer', age: 63, since: 2011 },
  { name: 'Luca Maestri', title: 'Chief Financial Officer', age: 60, since: 2014 },
  { name: 'Jeff Williams', title: 'Chief Operating Officer', age: 60, since: 2015 },
  { name: 'Katherine L. Adams', title: 'General Counsel & SVP', age: 59, since: 2017 },
  { name: 'Deirdre O\'Brien', title: 'SVP Retail + People', age: 57, since: 2019 },
  { name: 'Craig Federighi', title: 'SVP Software Engineering', age: 55, since: 2012 },
  { name: 'John Ternus', title: 'SVP Hardware Engineering', age: 49, since: 2021 },
  { name: 'Eddy Cue', title: 'SVP Services', age: 59, since: 2011 },
  { name: 'Johny Srouji', title: 'SVP Hardware Technologies', age: 57, since: 2015 },
  { name: 'Greg Joswiak', title: 'SVP Marketing', age: 58, since: 2020 },
  { name: 'Adrian Perica', title: 'VP Corporate Dev', age: 50, since: 2009 },
  { name: 'Lisa Jackson', title: 'VP Environment', age: 57, since: 2013 },
  { name: 'Sabih Khan', title: 'SVP Operations', age: 55, since: 2019 },
  { name: 'Mary Demby', title: 'VP Controller', age: 52, since: 2018 },
  { name: 'Chris Kondo', title: 'VP Finance', age: 48, since: 2020 },
];

const COLS: DenseColumn[] = [
  { key: 'name', header: 'Name', width: '2fr' },
  { key: 'title', header: 'Title', width: '2fr' },
  { key: 'age', header: 'Age', width: '40px', align: 'right' },
  { key: 'since', header: 'Since', width: '50px', align: 'right' },
];

export function FnMGMT({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const rows = EXECS.map((e, i) => ({ id: i, ...e }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`MGMT • Management — ${ticker}`} />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" />
    </div>
  );
}
