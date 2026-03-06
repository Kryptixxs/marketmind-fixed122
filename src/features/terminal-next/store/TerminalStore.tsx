'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { SimulationEngine } from '../services/simulator';
import { parseCommand } from '../services/commandParser';
import type {
  TerminalState, TickBatch, Quote, Bar, TapePrint, Order, Position,
  Alert, FeedItem, RiskMetrics, DepthSnapshot, RegimeState,
} from '../types';
import { INSTRUMENTS } from '../types';

// ── Risk Selectors (pure functions) ──────────────────────────────────
function computeRisk(
  positions: Record<string, Position>,
  quotes: Record<string, Quote>,
  regime: RegimeState,
  returns: number[],
): RiskMetrics {
  const posArr = Object.values(positions).filter(p => p.qty !== 0);
  let gross = 0, net = 0, totalMv = 0;

  for (const p of posArr) {
    const q = quotes[p.symbol];
    const mv = Math.abs(p.qty * (q?.last || p.avgCost));
    gross += mv;
    net += p.qty * (q?.last || p.avgCost);
    totalMv += mv;
  }

  const concentration = posArr.length > 0
    ? Math.max(...posArr.map(p => {
        const q = quotes[p.symbol];
        return Math.abs(p.qty * (q?.last || p.avgCost)) / (totalMv || 1);
      }))
    : 0;

  const n = returns.length;
  const mean = n > 0 ? returns.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n > 1 ? returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (n - 1) : 0;
  const realizedVol = Math.sqrt(variance) * Math.sqrt(252);
  const sharpe = realizedVol > 0 ? (mean * 252) / realizedVol : 0;
  const var95 = gross * realizedVol * 1.645 / Math.sqrt(252);

  const momentum = n >= 5 ? returns.slice(-5).reduce((a, b) => a + b, 0) : 0;

  return {
    grossExposure: gross,
    netExposure: net,
    realizedVol,
    impliedVolProxy: regime.volBps / 100,
    intradayVaR: var95,
    sharpeProxy: sharpe,
    concentration,
    momentumScore: momentum * 10000,
    liquidityScore: 0.7 + Math.random() * 0.3,
    regimeLabel: regime.current,
    benchmarkCorrelation: 0.6 + Math.random() * 0.3,
  };
}

// ── Zustand Store ────────────────────────────────────────────────────
interface TerminalActions {
  applyTick: (batch: TickBatch) => void;
  setActiveSymbol: (symbol: string) => void;
  addFeedItem: (item: FeedItem) => void;
  executeCommand: (input: string) => void;
  addOrder: (order: Order) => void;
  updatePosition: (fill: Order) => void;
  setRunning: (running: boolean) => void;
  toggleRunning: () => void;
}

type TerminalStore = TerminalState & TerminalActions;

const initialQuotes: Record<string, Quote> = {};
for (const inst of INSTRUMENTS) {
  initialQuotes[inst.symbol] = {
    symbol: inst.symbol, bid: inst.basePrice, ask: inst.basePrice,
    last: inst.basePrice, prevClose: inst.basePrice,
    change: 0, changePct: 0, high: inst.basePrice, low: inst.basePrice,
    volume: 0, tickId: 0,
  };
}

const TAPE_MAX = 100;
const FEED_MAX = 200;
const ALERT_MAX = 50;

const useTerminalStore = create<TerminalStore>((set, get) => ({
  clock: { tickId: 0, epochMs: Date.now(), cadenceMs: 800 },
  running: false,
  activeSymbol: 'AAPL',
  symbols: INSTRUMENTS.map(i => i.symbol),
  quotes: initialQuotes,
  bars: {},
  depth: {},
  tape: [],
  regime: { current: 'mean-revert', driftBps: 0, volBps: 5, transitionProb: 0.05, ticksInRegime: 0 },
  orders: [],
  positions: {},
  alerts: [],
  feed: [],
  risk: {
    grossExposure: 0, netExposure: 0, realizedVol: 0, impliedVolProxy: 0,
    intradayVaR: 0, sharpeProxy: 0, concentration: 0, momentumScore: 0,
    liquidityScore: 0.8, regimeLabel: 'mean-revert', benchmarkCorrelation: 0.7,
  },
  commandLog: [],
  functionContext: 'COCKPIT',

  applyTick: (batch: TickBatch) => set(state => {
    const newQuotes = { ...state.quotes };
    for (const q of batch.quotes) {
      newQuotes[q.symbol] = q;
    }

    const newBars = { ...state.bars };
    for (const bar of batch.bars) {
      const sym = state.activeSymbol;
      if (!newBars[sym]) newBars[sym] = [];
      newBars[sym] = [...newBars[sym].slice(-500), bar];
    }

    const newDepth = { ...state.depth };
    newDepth[batch.depth.symbol] = batch.depth;

    const newTape = [...state.tape, ...batch.prints].slice(-TAPE_MAX);
    const newAlerts = [...state.alerts, ...batch.alerts].slice(-ALERT_MAX);
    const newFeed = [...state.feed, ...batch.headlines].slice(-FEED_MAX);

    let newOrders = [...state.orders];
    const newPositions = { ...state.positions };

    for (const fill of batch.fills) {
      const idx = newOrders.findIndex(o => o.id === fill.id);
      if (idx >= 0) {
        newOrders[idx] = fill;
      } else {
        newOrders.push(fill);
      }

      // Update position
      const pos = newPositions[fill.symbol] || {
        symbol: fill.symbol, qty: 0, avgCost: 0,
        marketValue: 0, unrealizedPnl: 0, realizedPnl: 0, side: 'FLAT' as const,
      };

      const sign = fill.side === 'BUY' ? 1 : -1;
      const fillQty = fill.filledQty * sign;
      const newQty = pos.qty + fillQty;
      const cost = fill.avgFillPx * Math.abs(fillQty);

      if (Math.sign(pos.qty) === Math.sign(fillQty) || pos.qty === 0) {
        const totalCost = pos.avgCost * Math.abs(pos.qty) + cost;
        pos.avgCost = Math.abs(newQty) > 0 ? totalCost / Math.abs(newQty) : 0;
      } else {
        const closedQty = Math.min(Math.abs(pos.qty), Math.abs(fillQty));
        pos.realizedPnl += (fill.avgFillPx - pos.avgCost) * closedQty * Math.sign(pos.qty);
      }

      pos.qty = newQty;
      pos.side = newQty > 0 ? 'LONG' : newQty < 0 ? 'SHORT' : 'FLAT';
      const mktPx = newQuotes[fill.symbol]?.last || fill.avgFillPx;
      pos.marketValue = Math.abs(pos.qty) * mktPx;
      pos.unrealizedPnl = pos.qty * (mktPx - pos.avgCost);
      newPositions[fill.symbol] = pos;
    }

    newOrders = newOrders.slice(-100);

    // Update unrealized PnL for all positions
    for (const sym of Object.keys(newPositions)) {
      const p = newPositions[sym];
      const q = newQuotes[sym];
      if (q && p.qty !== 0) {
        p.marketValue = Math.abs(p.qty) * q.last;
        p.unrealizedPnl = p.qty * (q.last - p.avgCost);
      }
    }

    return {
      clock: batch.clock,
      quotes: newQuotes,
      bars: newBars,
      depth: newDepth,
      tape: newTape,
      alerts: newAlerts,
      feed: newFeed,
      orders: newOrders,
      positions: newPositions,
      regime: batch.regime,
    };
  }),

  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),

  addFeedItem: (item) => set(state => ({
    feed: [...state.feed, item].slice(-FEED_MAX),
  })),

  executeCommand: (input: string) => {
    const result = parseCommand(input);
    const state = get();
    const now = Date.now();

    const feedItem: FeedItem = {
      id: `CMD-${now}`,
      type: 'command',
      message: `> ${input}  →  ${result.message}`,
      epochMs: now,
      tickId: state.clock.tickId,
    };

    set(s => ({
      commandLog: [...s.commandLog, input].slice(-50),
      feed: [...s.feed, feedItem].slice(-FEED_MAX),
    }));

    if (result.type === 'NAV' && result.payload?.symbol) {
      set({ activeSymbol: result.payload.symbol as string });
    }
  },

  addOrder: (order: Order) => set(state => ({
    orders: [...state.orders, order],
  })),

  updatePosition: () => {},

  setRunning: (running) => set({ running }),
  toggleRunning: () => set(state => ({ running: !state.running })),
}));

// ── Context Provider ─────────────────────────────────────────────────
const EngineContext = createContext<SimulationEngine | null>(null);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine(42, 800));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = useTerminalStore(s => s.running);
  const applyTick = useTerminalStore(s => s.applyTick);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        const batch = engineRef.current.tick();
        applyTick(batch);
      }, 800);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, applyTick]);

  // Auto-start simulation
  useEffect(() => {
    useTerminalStore.getState().setRunning(true);
  }, []);

  return (
    <EngineContext.Provider value={engineRef.current}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngine(): SimulationEngine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error('useEngine must be used within TerminalProvider');
  return engine;
}

export { useTerminalStore };
