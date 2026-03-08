'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity } from '../entities/types';

const MOVER_COLS: DenseColumn[] = [
  { key: 'symbol', header: 'Symbol', width: '80px' },
  { key: 'name', header: 'Name', width: '2fr' },
  { key: 'last', header: 'Last', width: '70px', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'pct', header: '%Chg', width: '60px', align: 'right', tone: true, format: (v) => { const n = Number(v); return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; } },
  { key: 'vol', header: 'Vol(M)', width: '55px', align: 'right', format: (v) => Number(v).toFixed(1) },
];

const REGIME_COLORS: Record<string, string> = {
  TREND: DENSITY.accentGreen,
  MEAN_REVERT: DENSITY.accentAmber,
  VOL_EXPANSION: DENSITY.accentRed,
};

export function FnMKT({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const { drill } = useDrill();
  const regime = state.risk.regime;
  const breadth = state.quotes.length > 0
    ? (state.quotes.filter((q) => q.pct > 0).length / state.quotes.length) * 100
    : 50;

  const movers = useMemo(() => {
    return [...state.quotes]
      .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
      .slice(0, 15)
      .map((q) => ({ id: q.symbol, symbol: q.symbol.split(' ')[0], name: q.name, last: q.last, pct: q.pct, vol: q.volumeM }));
  }, [state.quotes]);

  const sectorPcts = useMemo(() => {
    const sectors = ['Tech', 'Fin', 'Health', 'Energy', 'Industrial', 'Consumer', 'Comm', 'Materials'];
    return sectors.map((s, i) => ({
      name: s,
      pct: ((state.tick * (i + 1) * 7) % 400 - 200) / 100,
    }));
  }, [state.tick]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-auto terminal-scrollbar" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title="MKT • Market Context" right={<StatusBadge label="LIVE" variant="live" />} />

      {/* Regime + breadth strip */}
      <div style={{ padding: `${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}`, display: 'flex', gap: 16, background: DENSITY.bgSurface }}>
        <div>
          <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase' }}>REGIME</div>
          <div style={{ color: REGIME_COLORS[regime] ?? DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>{regime}</div>
        </div>
        <div>
          <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase' }}>BREADTH</div>
          <div style={{ color: breadth > 50 ? DENSITY.accentGreen : DENSITY.accentRed, fontSize: DENSITY.fontSizeDefault, fontWeight: 700 }}>{breadth.toFixed(1)}% ADV</div>
        </div>
        <div>
          <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase' }}>ADV/DEC</div>
          <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>
            <span style={{ color: DENSITY.accentGreen }}>{state.quotes.filter((q) => q.pct > 0).length}</span>
            {' / '}
            <span style={{ color: DENSITY.accentRed }}>{state.quotes.filter((q) => q.pct < 0).length}</span>
          </div>
        </div>
        <div>
          <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase' }}>AVG MOVE</div>
          <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>
            {(state.quotes.reduce((a, q) => a + Math.abs(q.pct), 0) / Math.max(1, state.quotes.length)).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sector summary */}
      <div style={{ padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', marginBottom: 2 }}>SECTOR SUMMARY</div>
        <div className="flex flex-wrap gap-1">
          {sectorPcts.map((s) => (
            <div key={s.name} style={{ display: 'flex', gap: 3, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily }}>
              <span style={{ color: DENSITY.textDim }}>{s.name}</span>
              <span style={{ color: s.pct >= 0 ? DENSITY.accentGreen : DENSITY.accentRed }}>
                {(s.pct >= 0 ? '+' : '') + s.pct.toFixed(2) + '%'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top movers table */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ padding: `1px ${DENSITY.pad4}px`, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.borderColor}` }}>TOP MOVERS</div>
        <DenseTable columns={MOVER_COLS} rows={movers} rowKey="id"
          panelIdx={panelIdx}
          rowEntity={(row) => makeSecurity(row.id as string, row.name as string)}
          compact
        />
      </div>
    </div>
  );
}
