'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, StatusBadge } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';
import { useDrill } from '../entities/DrillContext';
import { openContextMenu } from '../ui/ContextMenu';

const CCYS = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
const BASE_RATES: Record<string, number> = { EURUSD: 1.087, GBPUSD: 1.264, USDJPY: 151.3, USDCHF: 0.882, AUDUSD: 0.654, USDCAD: 1.362, NZDUSD: 0.598 };

function getRate(from: string, to: string, tick: number): number {
  if (from === to) return 1;
  const key = `${from}${to}`;
  const revKey = `${to}${from}`;
  const base = BASE_RATES[key] ?? (BASE_RATES[revKey] ? 1 / BASE_RATES[revKey]! : 1 + (tick % 50) / 1000);
  const noise = ((tick * 7 + key.charCodeAt(0)) % 100 - 50) / 50000;
  return base + noise;
}

export function FnFXC({ panelIdx = 0 }: { panelIdx?: number }) {
  const { state } = useTerminalStore();
  const { drill } = useDrill();

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
                  const isDiag = row.ccy === to;
                  const pair = isDiag ? null : `${row.ccy}${to} Curncy`;
                  return (
                    <td key={to}
                      className={`tabular-nums ${!isDiag ? 'cursor-pointer hover:bg-[#0a1520]' : ''}`}
                      style={{ padding: DENSITY.pad2, textAlign: 'right', color: isDiag ? DENSITY.textMuted : DENSITY.textPrimary, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: isDiag ? '#050505' : undefined }}
                      onClick={!isDiag ? (e) => {
                        const entity = { kind: 'FX' as const, id: pair!, display: pair!, payload: { pair: pair! } };
                        drill(entity, e.shiftKey ? 'OPEN_IN_NEW_PANEL' : 'OPEN_IN_PLACE', panelIdx);
                      } : undefined}
                      onContextMenu={!isDiag ? (e) => {
                        e.preventDefault();
                        const entity = { kind: 'FX' as const, id: pair!, display: pair!, payload: { pair: pair! } };
                        openContextMenu(e, entity, panelIdx);
                      } : undefined}
                      title={!isDiag ? `${row.ccy}/${to} — Click: DES  •  Right-click: actions` : undefined}
                    >
                      {val.toFixed(isDiag ? 0 : 4)}
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
