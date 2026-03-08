'use client';

import React, { useMemo, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, type DenseColumn } from '../primitives';
import { loadAlertRules, addAlertRule } from '../../services/alertMonitor';
import { useTerminalStore } from '../../store/TerminalStore';
import { makeSecurity } from '../entities/types';

const COLS: DenseColumn[] = [
  { key: 'symbol', header: 'Symbol', width: '90px' },
  { key: 'condition', header: 'Condition', width: '80px' },
  { key: 'status', header: 'Status', width: '60px' },
  { key: 'created', header: 'Created', width: '1fr', format: (v) => new Date(Number(v)).toLocaleString() },
];

export function FnALRT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const [input, setInput] = useState('');
  const rules = useMemo(() => loadAlertRules(), [state.tickMs]);
  const quoteMap = useMemo(() => new Map(state.quotes.map((q) => [q.symbol, q.last])), [state.quotes]);

  const rows = rules.map((r) => {
    const px = quoteMap.get(r.symbol);
    const triggered = px != null && (r.op === '>' ? px > r.value : px < r.value);
    return { id: r.id, symbol: r.symbol, condition: `${r.op} ${r.value}`, status: triggered ? 'TRIGGERED' : 'ACTIVE', created: r.createdAt };
  });

  const handleAdd = () => {
    if (input.trim()) { addAlertRule(input); setInput(''); }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="ALRT • Alerts Monitor" />
      <div className="flex items-center flex-none" style={{ height: DENSITY.commandBarHeightPx, background: '#111', borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="ALERT IF SPY > 510" className="flex-1 bg-transparent outline-none" style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={handleAdd} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>ADD</button>
      </div>
      {rows.length === 0 && (
        <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily }}>
          NO ALERTS — TYPE &quot;ALERT IF SPY &gt; 510&quot; ABOVE TO CREATE ONE
        </div>
      )}
      <DenseTable columns={COLS} rows={rows} rowKey="id" className="flex-1 min-h-0"
        panelIdx={panelIdx}
        rowEntity={(row) => makeSecurity(row.symbol as string)}
      />
    </div>
  );
}
