'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const THEME = {
  background: '#000205',
  grid: 'rgba(43, 63, 95, 0.35)',
  axis: '#2b3f5f',
  text: '#8aa2bf',
  positive: '#4ce0a5',
  negative: '#ff7ca3',
  cyan: '#63c8ff',
  ma9: '#f4cf6b',
  ma21: '#d18cff',
};

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const chartHeight = height ?? (compact ? 220 : 340);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.max(0, Math.floor(nextWidth)));
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  const series = useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => a.time - b.time);
    const unique: ChartData[] = [];
    for (const d of sorted) {
      if (unique.length === 0 || d.time > unique[unique.length - 1].time) unique.push(d);
    }
    return unique;
  }, [data]);

  const domain = useMemo(() => {
    if (!series.length) return { min: 0, max: 1, range: 1, maxVol: 1 };
    const min = Math.min(...series.map((d) => d.low));
    const max = Math.max(...series.map((d) => d.high));
    const range = Math.max(0.0001, max - min);
    const maxVol = Math.max(1, ...series.map((d) => Math.abs(d.high - d.low)));
    return { min, max, range, maxVol };
  }, [series]);

  const padding = { t: 16, r: 64, b: 20, l: 8 };
  const innerW = Math.max(1, (width || 1) - padding.l - padding.r);
  const innerH = Math.max(1, chartHeight - padding.t - padding.b);
  const candleW = Math.max(1, Math.min(compact ? 7 : 10, innerW / Math.max(1, series.length) * 0.62));
  const xAt = (i: number) => padding.l + (i / Math.max(1, series.length - 1)) * innerW;
  const yAt = (price: number) => padding.t + ((domain.max - price) / domain.range) * innerH;

  const ma = (period: number) => series.map((_, i) => {
    const start = Math.max(0, i - period + 1);
    const window = series.slice(start, i + 1);
    const value = window.reduce((acc, b) => acc + b.close, 0) / window.length;
    return { i, value };
  });
  const vwap = series.map((_, i) => {
    const window = series.slice(0, i + 1);
    const pv = window.reduce((acc, b) => acc + ((b.high + b.low + b.close) / 3), 0);
    return { i, value: pv / window.length };
  });
  const linePoints = (rows: Array<{ i: number; value: number }>) => rows.map((r) => `${xAt(r.i)},${yAt(r.value)}`).join(' ');
  const priceTicks = Array.from({ length: 6 }, (_, i) => domain.max - (domain.range / 5) * i);

  const style = { height: `${chartHeight}px` };
  return (
    <div ref={containerRef} className="w-full bg-black" style={style}>
      <svg width={Math.max(1, width)} height={chartHeight} viewBox={`0 0 ${Math.max(1, width)} ${chartHeight}`} preserveAspectRatio="none">
        <rect x="0" y="0" width={Math.max(1, width)} height={chartHeight} fill={THEME.background} />
        {symbol ? <text x={8} y={12} fill={THEME.text} fontSize={compact ? 8 : 9}>{symbol}</text> : null}
        {priceTicks.map((p, i) => {
          const y = yAt(p);
          return (
            <g key={`tick-${i}`}>
              <line x1={padding.l} y1={y} x2={padding.l + innerW} y2={y} stroke={THEME.grid} strokeWidth="1" />
              <text x={padding.l + innerW + 4} y={y + 3} fill={THEME.text} fontSize={compact ? 8 : 9}>{p.toFixed(2)}</text>
            </g>
          );
        })}

        {series.map((c, i) => {
          const x = xAt(i);
          const openY = yAt(c.open);
          const closeY = yAt(c.close);
          const highY = yAt(c.high);
          const lowY = yAt(c.low);
          const up = c.close >= c.open;
          return (
            <g key={`${c.time}-${i}`}>
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={up ? THEME.positive : THEME.negative} strokeWidth="1" />
              <rect
                x={x - candleW / 2}
                y={Math.min(openY, closeY)}
                width={candleW}
                height={Math.max(1, Math.abs(closeY - openY))}
                fill={up ? '#1f5a41' : '#59243a'}
                stroke={up ? THEME.positive : THEME.negative}
                strokeWidth="0.8"
              />
            </g>
          );
        })}

        <polyline fill="none" stroke={THEME.cyan} strokeWidth={compact ? 1.2 : 1.5} points={linePoints(vwap)} />
        <polyline fill="none" stroke={THEME.ma9} strokeWidth="1" points={linePoints(ma(9))} />
        <polyline fill="none" stroke={THEME.ma21} strokeWidth="1" points={linePoints(ma(21))} />

        <line x1={padding.l + innerW} y1={padding.t} x2={padding.l + innerW} y2={padding.t + innerH} stroke={THEME.axis} strokeWidth="1" />
      </svg>
    </div>
  );
}
