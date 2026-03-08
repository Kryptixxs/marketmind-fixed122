'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';

const EVENTS = [
  { id: 0, time: '08:30', country: 'US', indicator: 'Nonfarm Payrolls', actual: '256K', forecast: '180K', prior: '212K' },
  { id: 1, time: '08:30', country: 'US', indicator: 'Unemployment Rate', actual: '3.7%', forecast: '3.8%', prior: '3.7%' },
  { id: 2, time: '10:00', country: 'US', indicator: 'ISM Manufacturing', actual: '49.3', forecast: '48.8', prior: '47.4' },
  { id: 3, time: '07:00', country: 'DE', indicator: 'Industrial Production', actual: '-0.4%', forecast: '0.1%', prior: '1.2%' },
  { id: 4, time: '04:30', country: 'GB', indicator: 'GDP (QoQ)', actual: '0.3%', forecast: '0.2%', prior: '-0.1%' },
  { id: 5, time: '09:45', country: 'EU', indicator: 'ECB Rate Decision', actual: '4.50%', forecast: '4.50%', prior: '4.50%' },
  { id: 6, time: '21:30', country: 'JP', indicator: 'CPI (YoY)', actual: '2.8%', forecast: '2.7%', prior: '2.6%' },
  { id: 7, time: '09:30', country: 'CN', indicator: 'PMI Manufacturing', actual: '50.2', forecast: '49.8', prior: '49.5' },
  { id: 8, time: '08:30', country: 'US', indicator: 'Core CPI (MoM)', actual: '0.3%', forecast: '0.3%', prior: '0.4%' },
  { id: 9, time: '10:00', country: 'US', indicator: 'Consumer Confidence', actual: '102.0', forecast: '104.0', prior: '104.7' },
  { id: 10, time: '14:00', country: 'US', indicator: 'FOMC Minutes', actual: '—', forecast: '—', prior: '—' },
  { id: 11, time: '07:00', country: 'GB', indicator: 'BOE Rate Decision', actual: '5.25%', forecast: '5.25%', prior: '5.25%' },
  { id: 12, time: '08:30', country: 'CA', indicator: 'Employment Change', actual: '37.3K', forecast: '25.0K', prior: '-2.8K' },
];

const FLAGS: Record<string, string> = { US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳', CA: '🇨🇦' };

const COLS: DenseColumn[] = [
  { key: 'time', header: 'Time', width: '50px' },
  { key: 'flag', header: '', width: '24px', format: (v) => String(v) },
  { key: 'country', header: 'Cty', width: '30px' },
  { key: 'indicator', header: 'Indicator', width: '2fr' },
  { key: 'actual', header: 'Actual', width: '60px', align: 'right' },
  { key: 'forecast', header: 'Fcst', width: '60px', align: 'right' },
  { key: 'prior', header: 'Prior', width: '60px', align: 'right' },
];

export function FnECO() {
  const rows = EVENTS.map((e) => ({ ...e, flag: FLAGS[e.country] ?? e.country }));
  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="ECO • Economic Calendar" />
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" />
    </div>
  );
}
