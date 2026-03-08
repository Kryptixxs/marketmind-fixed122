'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { useTerminalOS } from '../TerminalOSContext';
import { makeSecurity } from '../entities/types';

const mkPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

function seedOf(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }

export function FnGMOV({ panelIdx }: { panelIdx: number }) {
  const { state } = useTerminalStore();
  const rows = useMemo(() => {
    const universe = ['AAPL', 'MSFT', 'NVDA', 'META', 'AMZN', 'GOOGL', 'TSLA', 'JPM', 'XOM', 'CVX', 'SPY', 'QQQ', 'IWM', 'TLT', 'GLD', 'BTC'];
    return universe.map((u, i) => {
      const pct = ((seedOf(u) + state.tick * (i + 3)) % 220) / 20 - 5.5;
      return { id: u, ticker: u, universe: i < 10 ? 'EQ' : 'XA', last: (90 + ((seedOf(u) + i) % 400)).toFixed(2), pct };
    }).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  }, [state.tick]);
  const cols: DenseColumn[] = [
    { key: 'ticker', header: 'Ticker', width: '70px', entity: (r) => makeSecurity(`${String(r.ticker)} US Equity`, String(r.ticker)) },
    { key: 'universe', header: 'Uni', width: '38px' },
    { key: 'last', header: 'Last', width: '70px', align: 'right' },
    { key: 'pct', header: '%', width: '62px', align: 'right', tone: true, format: (v) => mkPct(Number(v)) },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="GMOV • Global Movers" right={<StatusBadge label="LIVE" variant="live" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" /></div>;
}

export function FnSECH({ panelIdx }: { panelIdx: number }) {
  const sectors = ['Tech', 'Fin', 'Energy', 'HC', 'Ind', 'ConsD', 'ConsS', 'Comm', 'Mat', 'Util', 'REIT'];
  const rows = sectors.map((s, i) => {
    const pct = ((seedOf(s) + i * 11) % 140) / 20 - 3.2;
    return { id: s, sector: s, pct, breadth: `${20 + (i * 3) % 65}/${80 + (i * 7) % 120}`, heat: '█'.repeat(Math.max(2, Math.min(10, Math.round(Math.abs(pct) * 2.2)))) };
  });
  const cols: DenseColumn[] = [
    { key: 'sector', header: 'Sector', width: '1fr' },
    { key: 'pct', header: '%', width: '60px', align: 'right', tone: true, format: (v) => mkPct(Number(v)) },
    { key: 'breadth', header: 'Br', width: '70px', align: 'right' },
    { key: 'heat', header: 'Heat', width: '84px' },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="SECH • Sector Heat" right={<StatusBadge label="SIM" variant="sim" />} /><DenseTable columns={cols} rows={rows as unknown as Record<string, unknown>[]} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" compact /></div>;
}

export function FnRFCM({ panelIdx }: { panelIdx: number }) {
  const rows = [
    { id: 'r1', bucket: 'Rates', item: 'US10Y', value: '4.21%', chg: '+2bp' },
    { id: 'r2', bucket: 'Rates', item: 'US2Y', value: '4.71%', chg: '+1bp' },
    { id: 'r3', bucket: 'FX', item: 'DXY', value: '103.42', chg: '+0.21%' },
    { id: 'r4', bucket: 'FX', item: 'EURUSD', value: '1.0812', chg: '-0.11%' },
    { id: 'r5', bucket: 'Cmdty', item: 'WTI', value: '79.35', chg: '+0.84%' },
    { id: 'r6', bucket: 'Cmdty', item: 'Gold', value: '2189', chg: '+0.47%' },
    { id: 'r7', bucket: 'Cmdty', item: 'Copper', value: '4.15', chg: '-0.33%' },
  ];
  const cols: DenseColumn[] = [
    { key: 'bucket', header: 'Set', width: '56px' },
    { key: 'item', header: 'Inst', width: '1fr' },
    { key: 'value', header: 'Value', width: '70px', align: 'right' },
    { key: 'chg', header: 'Chg', width: '62px', align: 'right' },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="RFCM • Rates/FX/Commod Snapshot" right={<StatusBadge label="LIVE" variant="live" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" compact /></div>;
}

export function FnCRSP({ panelIdx }: { panelIdx: number }) {
  const rows = [
    { id: 'c1', spread: 'IG OAS', value: '118bp', d1: '+2', w1: '+6' },
    { id: 'c2', spread: 'HY OAS', value: '362bp', d1: '+8', w1: '+16' },
    { id: 'c3', spread: 'EMBI', value: '305bp', d1: '+4', w1: '+10' },
    { id: 'c4', spread: 'FRA-OIS', value: '24bp', d1: '-1', w1: '+2' },
    { id: 'c5', spread: '2s10s', value: '-46bp', d1: '+1', w1: '+5' },
  ];
  const cols: DenseColumn[] = [
    { key: 'spread', header: 'Spread', width: '1fr' },
    { key: 'value', header: 'Lvl', width: '62px', align: 'right' },
    { key: 'd1', header: '1D', width: '42px', align: 'right' },
    { key: 'w1', header: '1W', width: '42px', align: 'right' },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="CRSP • Credit Spreads Snapshot" right={<StatusBadge label="SIM" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" compact /></div>;
}

export function FnNINT({ panelIdx }: { panelIdx: number }) {
  const rows = [
    { id: 'n1', theme: 'Rates path', intensity: 92, impacted: 'TLT, KRE, SPX' },
    { id: 'n2', theme: 'AI capex', intensity: 88, impacted: 'NVDA, AVGO, AMZN' },
    { id: 'n3', theme: 'Energy supply', intensity: 76, impacted: 'XOM, CVX, CL1' },
    { id: 'n4', theme: 'China policy', intensity: 72, impacted: 'FXI, BABA, CNY' },
    { id: 'n5', theme: 'Credit stress', intensity: 63, impacted: 'HYG, IEF, JPM' },
    { id: 'n6', theme: 'Election risk', intensity: 58, impacted: 'VIX, DXY, Gold' },
  ];
  const cols: DenseColumn[] = [
    { key: 'theme', header: 'Theme', width: '1fr' },
    { key: 'intensity', header: 'Int', width: '44px', align: 'right' },
    { key: 'impacted', header: 'Most impacted', width: '1.2fr' },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="NINT • News Intensity + Impacted" right={<StatusBadge label="LIVE" variant="live" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" compact /></div>;
}

export function FnCAL24({ panelIdx }: { panelIdx: number }) {
  const rows = [
    { id: 'k1', time: '08:30 ET', event: 'US CPI', exp: '3.2%', imp: 'HIGH' },
    { id: 'k2', time: '10:00 ET', event: 'ISM Services', exp: '52.1', imp: 'MED' },
    { id: 'k3', time: '14:00 ET', event: 'FOMC Minutes', exp: '—', imp: 'HIGH' },
    { id: 'k4', time: '02:00 ET', event: 'EU PPI', exp: '-0.2%', imp: 'MED' },
    { id: 'k5', time: '21:30 ET', event: 'China CPI', exp: '0.4%', imp: 'HIGH' },
  ];
  const cols: DenseColumn[] = [
    { key: 'time', header: 'Time', width: '64px' },
    { key: 'event', header: 'Event', width: '1fr' },
    { key: 'exp', header: 'Exp', width: '58px', align: 'right' },
    { key: 'imp', header: 'Imp', width: '52px' },
  ];
  return <div className="flex flex-col h-full min-h-0"><PanelSubHeader title="CAL24 • Next 24h Calendar" right={<StatusBadge label="SIM" variant="sim" />} /><DenseTable columns={cols} rows={rows} rowKey="id" panelIdx={panelIdx} className="flex-1 min-h-0" compact /></div>;
}

