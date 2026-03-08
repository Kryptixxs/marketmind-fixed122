'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, StatusBadge } from '../primitives';

function seededRandom(seed: number): number { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); }

const TENORS = ['1M', '3M', '6M', '2Y', '5Y', '10Y', '30Y'];
const TENOR_LABELS = ['1M', '3M', '6M', '2Y', '5Y', '10Y', '30Y'];

function generateYieldCurve(seed: number): number[] {
  // Base inversion-aware curve (inverted when 2Y > 10Y)
  const shortEnd = 5.0 + (seededRandom(seed) - 0.5) * 0.5;
  const midEnd = 4.8 + (seededRandom(seed + 1) - 0.5) * 0.3;
  const longEnd = 4.5 + (seededRandom(seed + 2) - 0.5) * 0.3;
  return [
    shortEnd + 0.2,           // 1M
    shortEnd + 0.1,           // 3M
    shortEnd,                  // 6M
    midEnd,                    // 2Y
    midEnd - 0.1,             // 5Y
    longEnd,                   // 10Y
    longEnd + 0.2,            // 30Y
  ];
}

export function FnGC({ panelIdx = 0 }: { panelIdx?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCurve = generateYieldCurve(42);
  const priorCurve = generateYieldCurve(42 + 30);
  const isInverted = (currentCurve[3] ?? 0) > (currentCurve[5] ?? 0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const W = Math.floor(container.getBoundingClientRect().width);
    const H = Math.floor(container.getBoundingClientRect().height);
    if (W < 10 || H < 10) return;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = DENSITY.bgBase;
    ctx.fillRect(0, 0, W, H);

    const PAD = 36;
    const plotW = W - PAD;
    const plotH = H - PAD;

    // Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(PAD, (plotH / 8) * i); ctx.lineTo(W, (plotH / 8) * i); ctx.stroke();
    }

    const allVals = [...currentCurve, ...priorCurve];
    const minY = Math.min(...allVals) - 0.3;
    const maxY = Math.max(...allVals) + 0.3;
    const rangeY = maxY - minY;
    const n = currentCurve.length;

    const toX = (i: number) => PAD + (i / (n - 1)) * (plotW - PAD / 2);
    const toY = (v: number) => plotH - ((v - minY) / rangeY) * plotH;

    // Prior curve (grey dashed)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    priorCurve.forEach((v, i) => { const x = toX(i); const y = toY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.setLineDash([]);

    // Current curve (amber)
    ctx.strokeStyle = DENSITY.accentAmber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    currentCurve.forEach((v, i) => { const x = toX(i); const y = toY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();

    // Data points
    currentCurve.forEach((v, i) => {
      const x = toX(i), y = toY(v);
      ctx.fillStyle = DENSITY.accentAmber;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Labels — tenor on x-axis
    ctx.font = `8px ${DENSITY.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = DENSITY.textMuted;
    TENOR_LABELS.forEach((label, i) => {
      ctx.fillText(label, toX(i), plotH + 12);
    });

    // Yield labels on y-axis
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const v = minY + (rangeY / 5) * i;
      const y = toY(v);
      ctx.fillStyle = DENSITY.textMuted;
      ctx.fillText(v.toFixed(2) + '%', PAD - 2, y + 3);
    }

    // Inversion label
    if (isInverted) {
      ctx.fillStyle = DENSITY.accentRed;
      ctx.font = `9px ${DENSITY.fontFamily}`;
      ctx.textAlign = 'right';
      ctx.fillText('INVERTED', W - 4, 12);
    } else {
      ctx.fillStyle = DENSITY.accentGreen;
      ctx.font = `9px ${DENSITY.fontFamily}`;
      ctx.textAlign = 'right';
      ctx.fillText('NORMAL', W - 4, 12);
    }

    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = DENSITY.accentAmber;
    ctx.fillText('CURRENT', PAD + 4, 12);
    ctx.fillStyle = '#444';
    ctx.fillText('1M AGO', PAD + 70, 12);
  }, [currentCurve, priorCurve, isInverted]);

  useEffect(() => { paint(); }, [paint]);
  useEffect(() => { const ro = new ResizeObserver(() => paint()); if (containerRef.current) ro.observe(containerRef.current); return () => ro.disconnect(); }, [paint]);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title="GC • Yield Curve" right={<StatusBadge label={isInverted ? 'INVERTED' : 'NORMAL'} variant={isInverted ? 'stale' : 'live'} />} />
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="absolute inset-0" style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
