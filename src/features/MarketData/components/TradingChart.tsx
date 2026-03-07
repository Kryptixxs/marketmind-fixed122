'use client';

import { useMemo } from 'react';
import { TerminalChart } from '@/components/charts/TerminalChart';

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function normalize(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => clamp01((v - min) / (max - min)));
}

export function TradingChart({
  data,
  symbol = '',
  height,
  compact = false,
}: {
  data: ChartData[];
  symbol?: string;
  height?: number;
  compact?: boolean;
}) {
  const series = useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => a.time - b.time);
    const unique: ChartData[] = [];
    for (const d of sorted) {
      if (!unique.length || d.time > unique[unique.length - 1]!.time) unique.push(d);
    }
    return unique;
  }, [data]);

  const closes = series.map((d) => d.close);
  const closesNorm = normalize(closes);
  const lows = series.map((d) => d.low);
  const highs = series.map((d) => d.high);
  const lowMin = lows.length ? Math.min(...lows) : 0;
  const highMax = highs.length ? Math.max(...highs) : 1;
  const range = Math.max(0.0001, highMax - lowMin);
  const normPrice = (v: number) => clamp01((v - lowMin) / range);
  const ma9 = series.map((_, i) => {
    const start = Math.max(0, i - 8);
    const w = closes.slice(start, i + 1);
    return w.reduce((acc, v) => acc + v, 0) / Math.max(1, w.length);
  });
  const ma9Norm = normalize(ma9);
  const candles = series.map((d, i) => ({
    open: closesNorm[Math.max(i - 1, 0)] ?? 0.5,
    high: normPrice(d.high),
    low: normPrice(d.low),
    close: closesNorm[i] ?? 0.5,
  }));

  const chartHeight = height ?? (compact ? 220 : 340);
  const last = closes.at(-1) ?? 0;
  const prev = closes.at(-2) ?? last;
  const pct = prev !== 0 ? (((last - prev) / prev) * 100).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col w-full min-w-0 min-h-0" style={{ height: `${chartHeight}px` }}>
      <TerminalChart
        type="candles"
        series={closesNorm}
        secondary={ma9Norm}
        candles={candles}
        labels={series.map((d) => `${new Date(d.time).toISOString().slice(11, 16)}`)}
        metricLabel={symbol || 'CHART'}
        metricValue={`${last.toFixed(2)} ${pct.startsWith('-') ? '' : '+'}${pct}%`}
      />
    </div>
  );
}
