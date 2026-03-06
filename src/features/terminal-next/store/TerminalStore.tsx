'use client';

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { parseCommand } from '../services/commandParser';
import { buildTickBatch, getUniverseSymbols, seedQuotes } from '../services/simulator';
import { resolveFunctionDeck } from '../services/functionRouter';
import { DeltaState, FunctionCode, TerminalState } from '../types';
import { deriveRiskSnapshot } from '../selectors/riskSelectors';

type TerminalAction =
  | { type: 'TICK' }
  | { type: 'SET_COMMAND'; payload: string }
  | { type: 'EXECUTE_COMMAND'; payload?: string }
  | { type: 'SET_FUNCTION'; payload: FunctionCode }
  | { type: 'SET_ANALYTICS_TAB'; payload: TerminalState['analyticsTab'] }
  | { type: 'SET_RIGHT_TAB'; payload: TerminalState['rightRailTab'] }
  | { type: 'SET_FEED_TAB'; payload: TerminalState['feedTab'] }
  | { type: 'SET_SYMBOL'; payload: string };

type TerminalContextType = {
  state: TerminalState;
  dispatch: React.Dispatch<TerminalAction>;
  deckRows: Array<[string, string]>;
  deskStats: {
    adv: number;
    dec: number;
    breadth: number;
    avgMove: number;
    spread: number;
    latency: number;
  };
  clocks: { ny: string; ldn: string; hkg: string; tky: string };
};

const SIM_CADENCE_MS = 900;
const MIN_CADENCE_MS = 600;
const MAX_CADENCE_MS = 1000;
const SAFE_CADENCE_MS = Math.max(MIN_CADENCE_MS, Math.min(MAX_CADENCE_MS, SIM_CADENCE_MS));

const TerminalContext = createContext<TerminalContextType | null>(null);

function getClockStrings(tickMs: number) {
  const d = new Date(tickMs);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const s = d.getUTCSeconds();
  const mk = (o: number) => `${String((h + o + 24) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return { ny: mk(-4), ldn: mk(0), hkg: mk(8), tky: mk(9) };
}

function emptyDelta(): DeltaState {
  return {
    changedSymbols: [],
    priceFlash: {},
    tapePulseIds: [],
    pnlFlash: {},
    alertPulse: false,
  };
}

function buildDelta(prev: TerminalState, next: Pick<TerminalState, 'quotes' | 'blotter' | 'tape' | 'alerts'>): DeltaState {
  const changedSymbols: string[] = [];
  const priceFlash: Record<string, 'up' | 'down' | null> = {};
  const prevQuote = new Map(prev.quotes.map((q) => [q.symbol, q.last]));
  for (const q of next.quotes) {
    const old = prevQuote.get(q.symbol);
    if (old == null || old === q.last) continue;
    changedSymbols.push(q.symbol);
    priceFlash[q.symbol] = q.last > old ? 'up' : 'down';
  }

  const pnlFlash: Record<string, 'up' | 'down' | null> = {};
  const prevPnl = new Map(prev.blotter.map((b) => [b.id, b.pnl]));
  for (const row of next.blotter) {
    const old = prevPnl.get(row.id);
    if (old == null || old === row.pnl) continue;
    pnlFlash[row.id] = row.pnl > old ? 'up' : 'down';
  }

  const prevAlertTop = prev.alerts[0] ?? '';
  const nextAlertTop = next.alerts[0] ?? '';
  return {
    changedSymbols,
    priceFlash,
    tapePulseIds: next.tape.slice(0, 4).map((t) => t.id),
    pnlFlash,
    alertPulse: prevAlertTop !== nextAlertTop,
  };
}

const initialState: TerminalState = {
  seed: 31051990,
  tick: 0,
  tickMs: 1_711_800_000_000,
  activeSymbol: 'AAPL US',
  commandInput: 'AAPL US EQUITY DES GO',
  security: { ticker: 'AAPL', market: 'US', assetClass: 'EQUITY' },
  functionCode: 'DES',
  analyticsTab: 'OVERVIEW',
  rightRailTab: 'DEPTH',
  feedTab: 'NEWS',
  quotes: seedQuotes(),
  orderBook: [],
  tape: [],
  blotter: [],
  executionEvents: [],
  alerts: [],
  headlines: [],
  systemFeed: [
    'TERMINAL ONLINE / SIMULATED LIVE MODE',
    'WORKFLOW: <SECURITY> <ASSET> <FUNCTION> GO',
    'CTRL+L FOCUS INPUT / ENTER EXECUTE',
  ],
  barsBySymbol: Object.fromEntries(getUniverseSymbols().map((s) => [s, []])),
  microstructure: {
    insideSpreadBps: 0,
    imbalance: 0,
    orderFlowImbalance: 0,
    sweep: { active: false, side: 'NONE', intensity: 0, text: 'NONE' },
  },
  risk: {
    intradayVar: 0,
    grossExposure: 0,
    netExposure: 0,
    concentration: 0,
    beta: 1,
    corrToBenchmark: 0,
    realizedVol: 0,
    impliedVolProxy: 0,
    regime: 'TREND',
    exposureBySector: [],
  },
  delta: emptyDelta(),
};

function applyTick(state: TerminalState, nextTick: number): TerminalState {
  const batch = buildTickBatch(state, nextTick);
  const nextActiveSymbol = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''}`;
  const risk = deriveRiskSnapshot({
    quotes: batch.quotes,
    blotter: batch.blotter,
    barsBySymbol: batch.barsBySymbol,
    micro: batch.micro,
    activeSymbol: nextActiveSymbol,
  });
  const delta = buildDelta(state, {
    quotes: batch.quotes,
    blotter: batch.blotter,
    tape: batch.tape,
    alerts: batch.alerts,
  });

  const executionLines = batch.executionEvents.map((e) => `EXEC ${e.symbol} ${e.status} ${e.fillQty}@${e.fillPrice.toFixed(2)} ${e.source}`);

  return {
    ...state,
    tick: batch.tick,
    tickMs: batch.tickMs,
    quotes: batch.quotes,
    orderBook: batch.orderBook,
    tape: batch.tape,
    blotter: batch.blotter,
    executionEvents: batch.executionEvents,
    alerts: batch.alerts,
    headlines: batch.headlines,
    barsBySymbol: batch.barsBySymbol,
    microstructure: batch.micro,
    risk,
    activeSymbol: nextActiveSymbol,
    delta,
    systemFeed: [...executionLines, ...state.systemFeed].slice(0, 30),
  };
}

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  if (action.type === 'TICK') return applyTick(state, state.tick + 1);

  if (action.type === 'SET_COMMAND') return { ...state, commandInput: action.payload };

  if (action.type === 'SET_FUNCTION') {
    const normalized = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${state.security.assetClass} ${action.payload} GO`;
    return {
      ...state,
      functionCode: action.payload,
      commandInput: normalized,
      systemFeed: [`FUNCTION SWITCHED TO ${action.payload}`, ...state.systemFeed].slice(0, 30),
    };
  }

  if (action.type === 'SET_ANALYTICS_TAB') return { ...state, analyticsTab: action.payload };
  if (action.type === 'SET_RIGHT_TAB') return { ...state, rightRailTab: action.payload };
  if (action.type === 'SET_FEED_TAB') return { ...state, feedTab: action.payload };

  if (action.type === 'SET_SYMBOL') {
    const [ticker, market = ''] = action.payload.split(' ');
    const assetClass = market === 'Index' ? 'EQUITY' : market === 'Curncy' ? 'CURNCY' : market === 'Govt' ? 'GOVT' : 'EQUITY';
    return {
      ...state,
      security: { ticker, market, assetClass },
      activeSymbol: `${ticker}${market ? ` ${market}` : ''}`,
      commandInput: `${ticker}${market ? ` ${market}` : ''} ${assetClass} ${state.functionCode} GO`,
      systemFeed: [`SYMBOL CONTEXT -> ${ticker}${market ? ` ${market}` : ''}`, ...state.systemFeed].slice(0, 30),
    };
  }

  if (action.type === 'EXECUTE_COMMAND') {
    const raw = action.payload ?? state.commandInput;
    const result = parseCommand(raw);
    if (!result.ok) {
      return {
        ...state,
        commandInput: result.normalized,
        systemFeed: [`REJECTED: ${result.error}`, ...state.systemFeed].slice(0, 30),
      };
    }

    return {
      ...state,
      commandInput: result.normalized,
      security: result.security,
      activeSymbol: `${result.security.ticker}${result.security.market ? ` ${result.security.market}` : ''}`,
      functionCode: result.functionCode,
      systemFeed: [`LOADED ${result.normalized}`, ...state.systemFeed].slice(0, 30),
    };
  }

  return state;
}

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(terminalReducer, initialState, (seedState) => applyTick(seedState, 1));

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), SAFE_CADENCE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        const input = document.getElementById('terminal-command-input') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
      if (e.key === 'Escape') dispatch({ type: 'SET_COMMAND', payload: '' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo<TerminalContextType>(() => {
    const adv = state.quotes.filter((q) => q.pct > 0).length;
    const dec = state.quotes.filter((q) => q.pct < 0).length;
    const breadth = state.quotes.length ? (adv / state.quotes.length) * 100 : 0;
    const avgMove = state.quotes.reduce((acc, q) => acc + Math.abs(q.pct), 0) / Math.max(1, state.quotes.length);
    const spread = state.microstructure.insideSpreadBps;
    const latency = 8 + Math.round(Math.abs(Math.sin(state.tick * 0.08)) * 18);
    return {
      state,
      dispatch,
      deckRows: resolveFunctionDeck(state.functionCode, { state, risk: state.risk, micro: state.microstructure }),
      deskStats: { adv, dec, breadth, avgMove, spread, latency },
      clocks: getClockStrings(state.tickMs),
    };
  }, [state]);

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
}

export function useTerminalStore() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error('useTerminalStore must be used inside TerminalProvider');
  return ctx;
}
