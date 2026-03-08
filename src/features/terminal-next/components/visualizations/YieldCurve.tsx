'use client';

import React, { memo, useRef, useEffect, useState } from 'react';

const MATURITIES = ['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'] as const;

const CURRENT_CURVE = [5.42, 5.38, 5.32, 5.28, 4.95, 4.62, 4.48, 4.65];
const MONTH_AGO_CURVE = [5.35, 5.32, 5.28, 5.22, 4.92, 4.58, 4.42, 4.55];

const BLOOMBERG_BLUE = '#0068FF';
const AMBER = '#FFB000';

export interface YieldCurveProps {
  className?: string;
  height?: number;
}

export const YieldCurve = memo(function YieldCurve({
  className = '',
  height = 200,
}: YieldCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dim, setDim] = useState({ w: 400, h: height });

  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDim({ w: el.clientWidth || 400, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dim.w;
    const h = dim.h;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const padLeft = 44;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 28;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const allY = [...CURRENT_CURVE, ...MONTH_AGO_CURVE];
    const yMin = Math.min(...allY) - 0.1;
    const yMax = Math.max(...allY) + 0.1;

    const xToPx = (i: number) => padLeft + (i / (MATURITIES.length - 1)) * chartW;
    const yToPx = (y: number) => padTop + chartH - ((y - yMin) / (yMax - yMin)) * chartH;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(51,51,51,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = padTop + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padLeft, yy);
      ctx.lineTo(w - padRight, yy);
      ctx.stroke();
    }
    for (let i = 0; i < MATURITIES.length; i++) {
      const xx = xToPx(i);
      ctx.beginPath();
      ctx.moveTo(xx, padTop);
      ctx.lineTo(xx, h - padBottom);
      ctx.stroke();
    }

    ctx.font = '10px "JetBrains Mono", "Roboto Mono", monospace';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = yMin + ((yMax - yMin) * (4 - i)) / 4;
      ctx.fillText(y.toFixed(2) + '%', padLeft - 6, yToPx(y) + 4);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    MATURITIES.forEach((m, i) => {
      ctx.fillText(m, xToPx(i), h - 8);
    });

    ctx.lineWidth = 2;

    ctx.strokeStyle = BLOOMBERG_BLUE;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(xToPx(0), yToPx(CURRENT_CURVE[0]!));
    for (let i = 1; i < CURRENT_CURVE.length; i++) {
      ctx.lineTo(xToPx(i), yToPx(CURRENT_CURVE[i]!));
    }
    ctx.stroke();

    ctx.strokeStyle = AMBER;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xToPx(0), yToPx(MONTH_AGO_CURVE[0]!));
    for (let i = 1; i < MONTH_AGO_CURVE.length; i++) {
      ctx.lineTo(xToPx(i), yToPx(MONTH_AGO_CURVE[i]!));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = BLOOMBERG_BLUE;
    ctx.textAlign = 'left';
    ctx.fillText('Current', w - padRight - 70, padTop + 10);
    ctx.strokeStyle = AMBER;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w - padRight - 80, padTop + 10);
    ctx.lineTo(w - padRight - 55, padTop + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = AMBER;
    ctx.fillText('1M Ago', w - padRight - 50, padTop + 10);
  }, [height, dim]);

  return (
    <div
      className={`flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#000000] border border-[#333] font-mono ${className}`}
    >
      <div className="flex-none flex items-center justify-between px-2 py-1 border-b border-[#333]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFB000]">
          GC • Yield Curve
        </span>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <canvas ref={canvasRef} className="w-full" style={{ height: `${height}px` }} />
      </div>
    </div>
  );
});
