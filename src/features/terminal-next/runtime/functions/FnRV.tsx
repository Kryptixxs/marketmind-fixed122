'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { useTerminalStore } from '../../store/TerminalStore';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }
function seededRandom(seed: number): number { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); }

const TF_DAYS: Record<string, number> = { '5D': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '3Y': 756, '5Y': 1260, MAX: 2520 };
const TF_OPTIONS = ['5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];

function generateSeries(ticker: string, days: number) {
  const seed = h(ticker);
  let p = 100;
  const out: number[] = [];
  for (let i = 0; i <= days; i++) {
    if (new Date(Date.now() - i * 86400000).getDay() % 6 === 0) continue;
    p = Math.max(50, p + (seededRandom(seed + i) - 0.5) * 3 + Math.sin(i / 40) * 0.4);
    out.push(p);
  }
  return out;
}

export function FnRV({ panelIdx }: { panelIdx: number }) {
  const { panels, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const ticker = p.activeSecurity.split(' ')[0] ?? 'AAPL';
  const days = TF_DAYS[p.timeframe] ?? 252;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [benchmark, setBenchmark] = useState('SPX');

  const secSeries = useMemo(() => generateSeries(ticker, days), [ticker, days]);
  const bmkSeries = useMemo(() => generateSeries(benchmark, days), [benchmark, days]);

  // Normalize both to 100 at start
  const normalize = (s: number[]) => {
    const base = s[0] ?? 1;
    return s.map((v) => (v / base) * 100);
  };
  const normSec = useMemo(() => normalize(secSeries), [secSeries]);
  const normBmk = useMemo(() => normalize(bmkSeries), [bmkSeries]);

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

    // Grid
    ctx.strokeStyle = DENSITY.gridlineColor;
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath(); ctx.moveTo(0, (H / 10) * i); ctx.lineTo(W, (H / 10) * i); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((W / 10) * i, 0); ctx.lineTo((W / 10) * i, H); ctx.stroke();
    }
    // 100 line
    ctx.strokeStyle = DENSITY.borderColor;
    ctx.setLineDash([4, 4]);
    const all = [...normSec, ...normBmk];
    const minV = Math.min(...all), maxV = Math.max(...all), rangeV = maxV - minV || 1;
    const toY = (v: number) => H - ((v - minV) / rangeV) * H;
    const toX = (i: number, n: number) => (i / Math.max(1, n - 1)) * W;
    const y100 = toY(100);
    ctx.beginPath(); ctx.moveTo(0, y100); ctx.lineTo(W, y100); ctx.stroke();
    ctx.setLineDash([]);

    // Benchmark line (grey)
    ctx.strokeStyle = DENSITY.textDim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    normBmk.forEach((v, i) => { const x = toX(i, normBmk.length); const y = toY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();

    // Security line (blue)
    ctx.strokeStyle = DENSITY.accentBlue;
    ctx.lineWidth = 1;
    ctx.beginPath();
    normSec.forEach((v, i) => { const x = toX(i, normSec.length); const y = toY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();

    // Labels
    ctx.font = `8px ${DENSITY.fontFamily}`;
    ctx.fillStyle = DENSITY.accentBlue;
    ctx.fillText(ticker, 4, 12);
    ctx.fillStyle = DENSITY.textDim;
    ctx.fillText(benchmark, 4, 22);
    ctx.fillStyle = DENSITY.textMuted;
    ctx.fillText('100 = base', W - 55, y100 - 2);
  }, [normSec, normBmk, ticker, benchmark]);

  useEffect(() => { paint(); }, [paint]);
  useEffect(() => { const ro = new ResizeObserver(() => paint()); if (containerRef.current) ro.observe(containerRef.current); return () => ro.disconnect(); }, [paint]);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`RV • Relative Value — ${ticker} vs ${benchmark}`} right={
        <div className="flex items-center gap-1">
          {TF_OPTIONS.map((tf) => (
            <button key={tf} type="button" onClick={() => dispatchPanel(panelIdx, { type: 'SET_TIMEFRAME', tf })}
              style={{ background: p.timeframe === tf ? DENSITY.bgSurfaceAlt : 'none', color: p.timeframe === tf ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: '8px', border: `1px solid ${p.timeframe === tf ? DENSITY.accentAmber : DENSITY.gridlineColor}`, padding: '0 3px', cursor: 'pointer' }}>{tf}</button>
          ))}
          <input value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{ width: 44, background: DENSITY.bgBase, border: `1px solid ${DENSITY.gridlineColor}`, color: DENSITY.accentAmber, fontSize: '8px', padding: '0 2px', outline: 'none' }} />
        </div>
      } />
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="absolute inset-0" style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
