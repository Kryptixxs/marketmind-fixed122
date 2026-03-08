'use client';

import { memo, useMemo } from 'react';

export type TerminalChartType = 'line' | 'area' | 'bar' | 'heatmap' | 'depth' | 'matrix' | 'surface' | 'ladder' | 'candles';

export interface TerminalCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TerminalChartProps {
  type: TerminalChartType;
  series?: number[];
  secondary?: number[];
  matrix?: number[][];
  candles?: TerminalCandle[];
  labels?: string[];
  metricLabel?: string;
  metricValue?: string;
  showHeader?: boolean;
  className?: string;
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

const GRID = '#1e293b'; // slate-800
const AXIS = '#334155'; // slate-700
const TICK = '#64748b'; // slate-500
const POS = '#10b981';  // emerald-500
const NEG = '#f43f5e';  // rose-500
const CYAN = '#0ea5e9'; // sky-500
const YEL = '#eab308';  // yellow-500
const BG = 'transparent';

export const TerminalChart = memo(function TerminalChart({
  type,
  series = [],
  secondary = [],
  matrix,
  candles = [],
  labels = [],
  metricLabel,
  metricValue,
  showHeader = false, // Default to compact (no header) unless explicitly requested
  className,
}: TerminalChartProps) {
  const primaryNorm = useMemo(() => normalize(series), [series]);
  const secondaryNorm = useMemo(() => normalize(secondary.length ? secondary : series), [secondary, series]);
  const matrixFlat = useMemo(() => {
    if (matrix?.length) {
      return matrix.map((row) => row.map((v) => clamp01(v)));
    }
    const fallback = primaryNorm.length ? primaryNorm : [0.5];
    const rows = 4;
    const cols = 8;
    const out: number[][] = [];
    for (let r = 0; r < rows; r += 1) {
      out.push([]);
      for (let c = 0; c < cols; c += 1) out[r]!.push(fallback[(r * cols + c) % fallback.length] ?? 0.5);
    }
    return out;
  }, [matrix, primaryNorm]);

  const points = useMemo(
    () =>
      primaryNorm.map((v, i) => {
        const x = primaryNorm.length <= 1 ? 0 : (i / (primaryNorm.length - 1)) * 100;
        const y = 100 - v * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }),
    [primaryNorm],
  );

  const secondPoints = useMemo(
    () =>
      secondaryNorm.map((v, i) => {
        const x = secondaryNorm.length <= 1 ? 0 : (i / (secondaryNorm.length - 1)) * 100;
        const y = 100 - v * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }),
    [secondaryNorm],
  );

  const renderGrid = (
    <>
      {[20, 40, 60, 80].map((v) => (
        <line key={`h-${v}`} x1={0} y1={v} x2={100} y2={v} stroke={GRID} strokeWidth="0.4" opacity="0.55" />
      ))}
      {[20, 40, 60, 80].map((v) => (
        <line key={`v-${v}`} x1={v} y1={0} x2={v} y2={100} stroke={GRID} strokeWidth="0.4" opacity="0.55" />
      ))}
      <line x1={0} y1={100} x2={100} y2={100} stroke={AXIS} strokeWidth="0.8" />
      <line x1={0} y1={0} x2={0} y2={100} stroke={AXIS} strokeWidth="0.8" />
    </>
  );

  const baseClass = `flex flex-col w-full h-full min-w-0 min-h-0 relative bg-transparent ${className ?? ''}`;

  return (
    <div className={baseClass}>
      {showHeader && (
        <div className="flex-none h-4 px-1 border-b border-slate-800 text-[9px] text-slate-500 flex items-center justify-between">
          <span className="truncate font-mono tracking-tight">{metricLabel ?? type.toUpperCase()}</span>
          <span className="font-mono tracking-tight">{metricValue ?? '--'}</span>
        </div>
      )}
      <div className="flex-1 w-full min-w-0 min-h-0 relative">
        {type === 'matrix' || type === 'heatmap' || type === 'surface' ? (
          <div className="grid grid-cols-8 grid-rows-4 gap-[1px] p-[1px] h-full w-full">
            {matrixFlat.flatMap((row, ridx) =>
              row.map((v, cidx) => (
                <div
                  key={`${ridx}-${cidx}`}
                  className="border border-slate-900"
                  title={`${labels[ridx * row.length + cidx] ?? `R${ridx + 1}C${cidx + 1}`}: ${(v * 100).toFixed(1)}`}
                  style={{
                    backgroundColor:
                      v >= 0.8 ? '#059669' : // emerald-600
                      v >= 0.6 ? '#0284c7' : // sky-600
                      v >= 0.4 ? '#d97706' : // amber-600
                      v >= 0.2 ? '#e11d48' : '#881337', // rose-600 to rose-900
                  }}
                />
              )),
            )}
          </div>
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100" fill={BG} />
            {renderGrid}
            {(type === 'line' || type === 'area' || type === 'depth' || type === 'ladder') && points.length > 1 ? (
              <>
                {type === 'area' ? <polygon points={`0,100 ${points.join(' ')} 100,100`} fill="rgba(14,165,233,0.15)" /> : null}
                <polyline fill="none" stroke={type === 'depth' ? POS : CYAN} strokeWidth="1.6" points={points.join(' ')} />
                {secondPoints.length > 1 ? <polyline fill="none" stroke={YEL} strokeWidth="1.1" opacity="0.85" points={secondPoints.join(' ')} /> : null}
                {(type === 'depth' || type === 'ladder') && primaryNorm.length ? (
                  primaryNorm.map((v, i) => {
                    const x = primaryNorm.length <= 1 ? 0 : (i / (primaryNorm.length - 1)) * 100;
                    return <line key={`d-${i}`} x1={0} y1={100 - v * 100} x2={x} y2={100 - v * 100} stroke={i % 2 ? CYAN : POS} strokeWidth="0.8" opacity="0.85" />;
                  })
                ) : null}
              </>
            ) : null}
            {type === 'bar' && primaryNorm.length ? (
              primaryNorm.map((v, i) => {
                const w = Math.max(1, 92 / primaryNorm.length);
                const x = 4 + (i / Math.max(1, primaryNorm.length)) * 92;
                const h = Math.max(1, v * 94);
                return <rect key={`b-${i}`} x={x} y={100 - h} width={w} height={h} fill={secondaryNorm[i] != null && secondaryNorm[i]! < 0.5 ? NEG : POS} />;
              })
            ) : null}
            {type === 'candles' && candles.length ? (
              candles.slice(-42).map((c, i, arr) => {
                const x = 4 + (i / Math.max(1, arr.length - 1)) * 92;
                const width = Math.max(1, 54 / arr.length);
                const up = c.close >= c.open;
                const yO = 100 - clamp01(c.open) * 100;
                const yC = 100 - clamp01(c.close) * 100;
                const yH = 100 - clamp01(c.high) * 100;
                const yL = 100 - clamp01(c.low) * 100;
                return (
                  <g key={`c-${i}`}>
                    <line x1={x} y1={yH} x2={x} y2={yL} stroke={up ? POS : NEG} strokeWidth="0.8" />
                    <rect x={x - width / 2} y={Math.min(yO, yC)} width={width} height={Math.max(1, Math.abs(yC - yO))} fill={up ? '#047857' : '#be123c'} stroke={up ? POS : NEG} strokeWidth="0.4" />
                  </g>
                );
              })
            ) : null}
            <text x="98" y="10" textAnchor="end" fill={TICK} fontSize="5" className="font-mono">{labels.at(-1)?.slice(0, 8) ?? 'T'}</text>
          </svg>
        )}
      </div>
    </div>
  );
});
