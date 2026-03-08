'use client';

import { useTerminalStore } from '../store/TerminalStore';
import type { Quote } from '../types';

/**
 * useMarketData – Golden Source for market data.
 * Provides 50 fake tickers with prices updating every 500ms via random walk.
 * All components pull from this central store (via TerminalStore).
 */
export function useMarketData(): {
  quotes: Quote[];
  tickMs: number;
} {
  const { state } = useTerminalStore();
  return {
    quotes: state.quotes,
    tickMs: state.tickMs,
  };
}
