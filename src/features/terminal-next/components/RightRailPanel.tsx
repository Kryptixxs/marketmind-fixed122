'use client';

import React from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const panelStyle: React.CSSProperties = {
  background: '#0c1221',
  border: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  overflow: 'auto',
  height: '100%',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '2px 6px',
  borderBottom: '1px solid #1e293b33',
};

interface MetricRow {
  label: string;
  getValue: (r: ReturnType<typeof useTerminalStore.getState>['risk']) => string;
  getColor?: (r: ReturnType<typeof useTerminalStore.getState>['risk']) => string;
}

const metrics: MetricRow[] = [
  {
    label: 'GROSS EXPOSURE',
    getValue: (r) => `$${r.grossExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    getColor: (r) => (r.grossExposure > 100000 ? '#f59e0b' : '#e2e8f0'),
  },
  {
    label: 'NET EXPOSURE',
    getValue: (r) => `$${r.netExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    getColor: (r) => (r.netExposure >= 0 ? '#10b981' : '#ef4444'),
  },
  {
    label: 'REALIZED VOL',
    getValue: (r) => `${(r.realizedVol * 100).toFixed(2)}%`,
    getColor: (r) => (r.realizedVol > 0.3 ? '#ef4444' : r.realizedVol > 0.2 ? '#f59e0b' : '#e2e8f0'),
  },
  {
    label: 'IMPLIED VOL PROXY',
    getValue: (r) => `${(r.impliedVolProxy * 100).toFixed(2)}%`,
    getColor: (r) => (r.impliedVolProxy > 0.3 ? '#ef4444' : '#e2e8f0'),
  },
  {
    label: 'INTRADAY VaR',
    getValue: (r) => `$${r.intradayVaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    getColor: (r) => (r.intradayVaR > 10000 ? '#ef4444' : r.intradayVaR > 5000 ? '#f59e0b' : '#e2e8f0'),
  },
  {
    label: 'SHARPE PROXY',
    getValue: (r) => r.sharpeProxy.toFixed(3),
    getColor: (r) => (r.sharpeProxy > 1 ? '#10b981' : r.sharpeProxy < 0 ? '#ef4444' : '#e2e8f0'),
  },
  {
    label: 'CONCENTRATION',
    getValue: (r) => `${(r.concentration * 100).toFixed(1)}%`,
    getColor: (r) => (r.concentration > 0.5 ? '#f59e0b' : '#e2e8f0'),
  },
  {
    label: 'MOMENTUM SCORE',
    getValue: (r) => r.momentumScore.toFixed(2),
    getColor: (r) => (r.momentumScore > 0 ? '#10b981' : r.momentumScore < 0 ? '#ef4444' : '#e2e8f0'),
  },
  {
    label: 'LIQUIDITY SCORE',
    getValue: (r) => r.liquidityScore.toFixed(3),
    getColor: (r) => (r.liquidityScore < 0.5 ? '#ef4444' : r.liquidityScore < 0.7 ? '#f59e0b' : '#10b981'),
  },
  {
    label: 'REGIME',
    getValue: (r) => r.regimeLabel.toUpperCase(),
    getColor: (r) =>
      r.regimeLabel === 'trend-up'
        ? '#10b981'
        : r.regimeLabel === 'trend-down'
          ? '#ef4444'
          : r.regimeLabel === 'vol-expansion'
            ? '#f59e0b'
            : '#3b82f6',
  },
  {
    label: 'BENCHMARK CORR',
    getValue: (r) => r.benchmarkCorrelation.toFixed(3),
    getColor: (r) =>
      r.benchmarkCorrelation > 0.8 ? '#f59e0b' : '#e2e8f0',
  },
];

export default function RightRailPanel() {
  const risk = useTerminalStore((s) => s.risk);

  return (
    <div style={panelStyle}>
      <div
        style={{
          padding: '3px 6px',
          borderBottom: '1px solid #1e293b',
          color: '#e2e8f0',
          fontSize: 9,
          fontWeight: 700,
          background: '#060a13',
        }}
      >
        RISK TELEMETRY
      </div>
      {metrics.map((m) => (
        <div key={m.label} style={rowStyle}>
          <span style={{ color: '#94a3b8', fontSize: 9 }}>{m.label}</span>
          <span style={{ color: m.getColor?.(risk) ?? '#e2e8f0', fontWeight: 600 }}>
            {m.getValue(risk)}
          </span>
        </div>
      ))}
    </div>
  );
}
