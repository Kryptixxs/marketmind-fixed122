'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, StatusBadge } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';

const CCYS = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
const BASE_RATES: Record<string, number> = { EURUSD: 1.087, GBPUSD: 1.264, USDJPY: 151.3, USDCHF: 0.882, AUDUSD: 0.654, USDCAD: 1.362, NZDUSD: 0.598 };

function getRate(from: string, to: string, tick: number): number {
  if (from === to) return 1;
  const key = `${from}${to}`;
  const revKey = `${to}${from}`;
  const base = BASE_RATES[key] ?? (BASE_RATES[revKey] ? 1 / BASE_RATES[revKey] : 1 + (tick % 50) / 1000);
  const noise = ((tick * 7 + key.charCodeAt(0)) % 100 - 50) / 50000;
  return base + noise;
}

export function FnFXC() {
  const { state } = useTerminalStore();

  const matrix = useMemo(() => {
    return CCYS.map((from) => ({
      ccy: from,
      ...Object.fromEntries(CCYS.map((to) => [to, getRate(from, to, state.tick)])),
    }));
  }, [state.tick]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="FXC • FX Cross Matrix" right={<StatusBadge label="SIM" variant="sim" />} />
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar" style={{ fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny }}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={{ padding: DENSITY.pad2, color: DENSITY.accentAmber, textAlign: 'left', position: 'sticky', top: 0, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}` }}></th>
              {CCYS.map((c) => (
                <th key={c} style={{ padding: DENSITY.pad2, color: DENSITY.accentAmber, textAlign: 'right', position: 'sticky', top: 0, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}`, minWidth: 55 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.ccy}>
                <td style={{ padding: DENSITY.pad2, color: DENSITY.accentAmber, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>{row.ccy}</td>
                {CCYS.map((to) => {
                  const val = row[to] as number;
                  return (
                    <td key={to} className="tabular-nums" style={{ padding: DENSITY.pad2, textAlign: 'right', color: row.ccy === to ? DENSITY.textMuted : DENSITY.textPrimary, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: row.ccy === to ? '#050505' : undefined }}>
                      {val.toFixed(row.ccy === to ? 0 : 4)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
