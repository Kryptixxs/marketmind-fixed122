'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, StatusBadge } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';

const SECTORS = [
  { name: 'Technology', weight: 30 }, { name: 'Healthcare', weight: 13 },
  { name: 'Financials', weight: 12 }, { name: 'Consumer Disc', weight: 11 },
  { name: 'Communication', weight: 9 }, { name: 'Industrials', weight: 8 },
  { name: 'Consumer Staples', weight: 6 }, { name: 'Energy', weight: 4 },
  { name: 'Utilities', weight: 3 }, { name: 'Real Estate', weight: 2 },
  { name: 'Materials', weight: 2 },
];

function color(pct: number): string {
  if (pct > 1.5) return '#006600';
  if (pct > 0.5) return '#004400';
  if (pct > 0) return '#002200';
  if (pct > -0.5) return '#220000';
  if (pct > -1.5) return '#440000';
  return '#660000';
}

export function FnIMAP() {
  const { state } = useTerminalStore();
  const data = useMemo(() => SECTORS.map((s, i) => {
    const pct = ((state.tick * 7 + i * 31) % 400 - 200) / 100;
    return { ...s, pct };
  }), [state.tick]);

  const total = data.reduce((a, d) => a + d.weight, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="IMAP • Sector Heatmap" right={<StatusBadge label="SIM" variant="sim" />} />
      <div className="flex-1 min-h-0 flex flex-wrap content-start" style={{ padding: 1 }}>
        {data.map((d) => {
          const pct = (d.weight / total) * 100;
          return (
            <div
              key={d.name}
              style={{ width: `${pct}%`, minWidth: 60, height: `${Math.max(30, pct * 1.5)}%`, background: color(d.pct), border: `1px solid ${DENSITY.gridlineColor}`, padding: DENSITY.pad2, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}
            >
              <span style={{ fontSize: DENSITY.fontSizeTiny, color: '#fff', fontWeight: 700, fontFamily: DENSITY.fontFamily }}>{d.name}</span>
              <span className="tabular-nums" style={{ fontSize: DENSITY.fontSizeTiny, color: d.pct >= 0 ? DENSITY.accentGreen : DENSITY.accentRed, fontFamily: DENSITY.fontFamily }}>
                {d.pct >= 0 ? '+' : ''}{d.pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
