import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { findOrderBlocks, findUnmitigatedFVGs } from './tech-math';
import { ChartOverlay } from '@/features/MarketData/components/TradingChart';

export function calculateInstitutionalOverlays(history: OHLCV[]): ChartOverlay[] {
  if (!history || history.length < 20) return [];

  const overlays: ChartOverlay[] = [];
  const currentPrice = history[history.length - 1].close;

  // 1. ICT Order Blocks (OB) - Labeled lines
  const obs = findOrderBlocks(history);
  obs.slice(-2).forEach(ob => {
    overlays.push({
      id: `ob-${ob.index}`,
      type: 'level',
      price: ob.type === 'BULLISH' ? ob.bottom : ob.top,
      color: ob.type === 'BULLISH' ? '#3e89fa' : '#ff3131',
      label: `${ob.type === 'BULLISH' ? '+OB' : '-OB'}`,
      style: 0
    });
  });

  // 2. Fair Value Gaps (FVG) - Range boxes
  const fvgs = findUnmitigatedFVGs(history);
  fvgs.slice(-2).forEach(fvg => {
    overlays.push({
      id: `fvg-${fvg.formedIndex}`,
      type: 'box',
      price: fvg.top,
      price2: fvg.bottom,
      color: fvg.type === 'BISI' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 82, 82, 0.3)',
      label: 'FVG',
    });
  });

  // 3. Session High/Lows - Labeled levels
  // NY Session (13:30 - 20:30 UTC)
  const nyBars = history.filter(b => {
    const h = new Date(b.timestamp).getUTCHours();
    return h >= 13 && h <= 20;
  });

  if (nyBars.length > 0) {
    const nyHigh = Math.max(...nyBars.map(b => b.high));
    const nyLow = Math.min(...nyBars.map(b => b.low));
    
    overlays.push({
      id: 'ny-high',
      type: 'level',
      price: nyHigh,
      color: '#ff3333',
      label: 'NY High',
      style: 1
    });
    overlays.push({
      id: 'ny-low',
      type: 'level',
      price: nyLow,
      color: '#00ff9d',
      label: 'NY Low',
      style: 1
    });
  }

  // London Session (08:00 - 14:00 UTC)
  const londonBars = history.filter(b => {
    const h = new Date(b.timestamp).getUTCHours();
    return h >= 8 && h <= 14;
  });

  if (londonBars.length > 0) {
    const lonHigh = Math.max(...londonBars.map(b => b.high));
    overlays.push({
      id: 'lon-high',
      type: 'level',
      price: lonHigh,
      color: '#9c27b0',
      label: 'London High',
      style: 1
    });
  }

  return overlays;
}