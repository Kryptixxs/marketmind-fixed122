import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { findOrderBlocks, findUnmitigatedFVGs } from './tech-math';
import { ChartOverlay } from '@/features/MarketData/components/TradingChart';

export function calculateInstitutionalOverlays(history: OHLCV[]): ChartOverlay[] {
  if (!history || history.length < 20) return [];

  const overlays: ChartOverlay[] = [];
  const currentPrice = history[history.length - 1].close;

  // 1. ICT Order Blocks (OB)
  const obs = findOrderBlocks(history);
  obs.slice(-2).forEach(ob => {
    overlays.push({
      type: 'level',
      price: ob.type === 'BULLISH' ? ob.bottom : ob.top,
      color: ob.type === 'BULLISH' ? '#3e89fa' : '#ff3131',
      label: `${ob.type === 'BULLISH' ? '+' : '-'}OB`,
      style: 0
    });
  });

  // 2. Fair Value Gaps (FVG)
  const fvgs = findUnmitigatedFVGs(history);
  fvgs.slice(-2).forEach(fvg => {
    overlays.push({
      type: 'level',
      price: fvg.type === 'BISI' ? fvg.bottom : fvg.top,
      color: fvg.type === 'BISI' ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 82, 82, 0.5)',
      label: 'FVG',
      style: 2
    });
  });

  // 3. Session High/Lows (Ported from Corey's Script)
  const now = new Date();
  const currentUtcHour = now.getUTCHours();
  
  // NY Session (13:30 - 20:30 UTC approx)
  const nyBars = history.filter(b => {
    const h = new Date(b.timestamp).getUTCHours();
    return h >= 13 && h <= 20;
  });

  if (nyBars.length > 0) {
    const nyHigh = Math.max(...nyBars.map(b => b.high));
    const nyLow = Math.min(...nyBars.map(b => b.low));
    
    overlays.push({
      type: 'level',
      price: nyHigh,
      color: '#ff3333',
      label: 'NY HIGH',
      style: 1
    });
    overlays.push({
      type: 'level',
      price: nyLow,
      color: '#00ff9d',
      label: 'NY LOW',
      style: 1
    });
  }

  return overlays;
}