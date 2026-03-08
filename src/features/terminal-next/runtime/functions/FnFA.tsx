'use client';

import React, { useMemo, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }
function fmtB(n: number) { return n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n.toLocaleString(); }

const TABS = ['Income Stmt', 'Balance Sheet', 'Cash Flow'] as const;

const IS_ROWS = ['Revenue', 'COGS', 'Gross Profit', 'SG&A', 'R&D', 'Operating Income', 'Interest Expense', 'Pre-Tax Income', 'Tax Provision', 'Net Income', 'EPS (Diluted)', 'Shares Out (M)'];
const BS_ROWS = ['Cash & Equiv', 'Short-Term Inv', 'Accounts Recv', 'Total Assets', 'Current Liab', 'Long-Term Debt', 'Total Liab', 'Stockholder Equity', 'Book Value/Share'];
const CF_ROWS = ['Operating CF', 'CapEx', 'Free Cash Flow', 'Dividends Paid', 'Share Repurchases', 'Net Change in Cash'];

const COLS: DenseColumn[] = [
  { key: 'item', header: 'Item', width: '2fr' },
  { key: 'y0', header: 'FY2024', width: '80px', align: 'right', format: (v) => fmtB(Number(v)) },
  { key: 'y1', header: 'FY2023', width: '80px', align: 'right', format: (v) => fmtB(Number(v)) },
  { key: 'y2', header: 'FY2022', width: '80px', align: 'right', format: (v) => fmtB(Number(v)) },
  { key: 'chg', header: 'YoY %', width: '60px', align: 'right', tone: true, format: (v) => { const n = Number(v); return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'; } },
];

export function FnFA({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const [tab, setTab] = useState<(typeof TABS)[number]>('Income Stmt');

  const items = tab === 'Income Stmt' ? IS_ROWS : tab === 'Balance Sheet' ? BS_ROWS : CF_ROWS;

  const rows = useMemo(() => items.map((item, i) => {
    const seed = h(ticker) + h(item);
    const base = (seed % 80 + 5) * 1e9;
    const y0 = base * (1 + ((seed % 20) - 10) / 100);
    const y1 = base * (1 - ((seed % 15) - 5) / 100);
    const y2 = base * (1 - ((seed % 25) - 10) / 100);
    const chg = ((y0 - y1) / Math.abs(y1)) * 100;
    return { id: i, item, y0, y1, y2, chg };
  }), [ticker, tab]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`FA • Financial Analysis — ${ticker}`} />
      <div className="flex items-center flex-none" style={{ height: 18, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`, gap: 0 }}>
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-2 h-full" style={{ background: tab === t ? DENSITY.bgBase : 'transparent', color: tab === t ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily, borderRight: `1px solid ${DENSITY.gridlineColor}` }}>{t}</button>
        ))}
      </div>
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0" />
    </div>
  );
}
