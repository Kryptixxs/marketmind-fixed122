'use client';

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { parseCommand } from '../services/commandParser';
import { routeSearch } from '../services/searchRouter';
import {
  buildDepthTapeStream,
  buildExecutionStream,
  buildFeedStream,
  buildQuotesStream,
  getUniverseSymbols,
  seedQuotes,
  seedReferenceProfiles,
} from '../services/simulator';
import { resolveFunctionDeck } from '../services/functionRouter';
import { DeltaState, FunctionCode, TerminalFunction, TerminalState } from '../types';
import { deriveRiskSnapshot } from '../selectors/riskSelectors';
import { TAPE_MAX_ROWS, SYSTEM_FEED_MAX_ROWS } from '@/lib/panel-limits';

type TerminalAction =
  | { type: 'TICK_QUOTES' }
  | { type: 'TICK_DEPTH_TAPE' }
  | { type: 'TICK_EXECUTION' }
  | { type: 'TICK_FEED' }
  | { type: 'SET_COMMAND'; payload: string }
  | { type: 'EXECUTE_COMMAND'; payload?: string }
  | { type: 'SET_FUNCTION'; payload: FunctionCode }
  | { type: 'SET_ACTIVE_FUNCTION'; payload: TerminalFunction }
  | { type: 'SET_ACTIVE_SUBTAB'; payload?: string }
  | { type: 'SET_ANALYTICS_TAB'; payload: TerminalState['analyticsTab'] }
  | { type: 'SET_RIGHT_TAB'; payload: TerminalState['rightRailTab'] }
  | { type: 'SET_FEED_TAB'; payload: TerminalState['feedTab'] }
  | { type: 'SET_SYMBOL'; payload: string }
  | { type: 'SET_INTEL_FILTERS'; payload: { country?: string; date?: string } | undefined };

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

const STREAM_CADENCE = {
  quotes: 240,
  depth: 420,
  execution: 820,
  feed: 1600,
} as const;

const TerminalContext = createContext<TerminalContextType | null>(null);

function toActiveFunction(code: FunctionCode): TerminalFunction {
  if (['DES', 'FA', 'HP', 'WEI', 'YAS', 'OVME', 'PORT', 'NEWS', 'CAL', 'SEC', 'MKT', 'INTEL'].includes(code)) return code as TerminalFunction;
  return 'EXEC';
}

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
    tapePulseIds: next.tape.slice(0, 6).map((t) => t.id),
    pnlFlash,
    alertPulse: prevAlertTop !== nextAlertTop,
  };
}

function activeSymbolPrefix(state: TerminalState) {
  return `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''}`;
}

function activeQuoteFrom(state: TerminalState) {
  const prefix = activeSymbolPrefix(state);
  return state.quotes.find((q) => q.symbol.startsWith(prefix)) ?? state.quotes[0];
}

function deriveNext(state: TerminalState, patch: Partial<TerminalState>): TerminalState {
  const merged = { ...state, ...patch };
  const risk = deriveRiskSnapshot({
    quotes: merged.quotes,
    blotter: merged.blotter,
    barsBySymbol: merged.barsBySymbol,
    micro: merged.microstructure,
    activeSymbol: merged.activeSymbol,
  });
  const delta = buildDelta(state, {
    quotes: merged.quotes,
    blotter: merged.blotter,
    tape: merged.tape,
    alerts: merged.alerts,
  });
  return { ...merged, risk, delta };
}

function nextStaged(state: TerminalState, key: 'quotesReadyAt' | 'depthReadyAt' | 'executionReadyAt' | 'feedReadyAt', tickMs: number) {
  return {
    ...state.staged,
    [key]: tickMs,
    commitSeq: state.staged.commitSeq + 1,
  };
}

const initialState: TerminalState = {
  seed: 31051990,
  tick: 0,
  tickMs: 1_711_800_000_000,
  activeSymbol: 'AAPL US',
  commandInput: 'AAPL US EXEC GO',
  security: { ticker: 'AAPL', market: 'US', assetClass: 'EQUITY' },
  functionCode: 'DES',
  activeFunction: 'EXEC',
  activeSubTab: undefined,
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
  referenceBySymbol: seedReferenceProfiles(31051990),
  delta: emptyDelta(),
  streamClock: { quotes: 0, depth: 0, execution: 0, feed: 0 },
  staged: { quotesReadyAt: 0, depthReadyAt: 0, executionReadyAt: 0, feedReadyAt: 0, commitSeq: 0 },
  drillPath: [],
};

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  if (action.type === 'TICK_QUOTES') {
    const streamTick = state.streamClock.quotes + 1;
    const batch = buildQuotesStream(state.seed, streamTick, STREAM_CADENCE.quotes);
    return deriveNext(state, {
      tick: streamTick,
      tickMs: batch.tickMs,
      quotes: batch.quotes,
      activeSymbol: activeSymbolPrefix(state),
      streamClock: { ...state.streamClock, quotes: streamTick },
      staged: nextStaged(state, 'quotesReadyAt', batch.tickMs),
    });
  }

  if (action.type === 'TICK_DEPTH_TAPE') {
    const streamTick = state.streamClock.depth + 1;
    const quote = activeQuoteFrom(state);
    const batch = buildDepthTapeStream(state.seed, streamTick, state.tickMs, quote?.last ?? 100);
    const accumulatedTape = [...batch.tape, ...state.tape].slice(0, TAPE_MAX_ROWS);
    return deriveNext(state, {
      orderBook: batch.orderBook,
      tape: accumulatedTape,
      microstructure: batch.micro,
      streamClock: { ...state.streamClock, depth: streamTick },
      staged: nextStaged(state, 'depthReadyAt', state.tickMs),
    });
  }

  if (action.type === 'TICK_EXECUTION') {
    const streamTick = state.streamClock.execution + 1;
    const batch = buildExecutionStream(streamTick, state.tickMs, state.quotes, state.blotter, state.tape, state.barsBySymbol);
    const executionLines = batch.executionEvents.map((e) => `EXEC ${e.symbol} ${e.status} ${e.fillQty}@${e.fillPrice.toFixed(2)} ${e.source}`);
    return deriveNext(state, {
      blotter: batch.blotter,
      executionEvents: batch.executionEvents,
      barsBySymbol: batch.barsBySymbol,
      systemFeed: [...executionLines, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
      streamClock: { ...state.streamClock, execution: streamTick },
      staged: nextStaged(state, 'executionReadyAt', state.tickMs),
    });
  }

  if (action.type === 'TICK_FEED') {
    const streamTick = state.streamClock.feed + 1;
    const batch = buildFeedStream(streamTick, state.microstructure.sweep.active);
    return deriveNext(state, {
      headlines: batch.headlines,
      alerts: batch.alerts,
      systemFeed: [`FEED ROTATE -> H${streamTick}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
      streamClock: { ...state.streamClock, feed: streamTick },
      staged: nextStaged(state, 'feedReadyAt', state.tickMs),
    });
  }

  if (action.type === 'SET_COMMAND') return { ...state, commandInput: action.payload };

  if (action.type === 'SET_FUNCTION') {
    const activeFunction = toActiveFunction(action.payload);
    const normalized = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${action.payload} GO`;
    return {
      ...state,
      functionCode: action.payload,
      activeFunction,
      activeSubTab: undefined,
      commandInput: normalized,
      systemFeed: [`FUNCTION CONTEXT -> ${activeFunction}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
    };
  }

  if (action.type === 'SET_ACTIVE_FUNCTION') {
    const command = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${action.payload} GO`;
    return {
      ...state,
      functionCode: action.payload,
      activeFunction: action.payload,
      activeSubTab: undefined,
      commandInput: command,
      systemFeed: [`FUNCTION CONTEXT -> ${action.payload}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
    };
  }

  if (action.type === 'SET_ACTIVE_SUBTAB') return { ...state, activeSubTab: action.payload };
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
      commandInput: `${ticker}${market ? ` ${market}` : ''} ${state.activeFunction} GO`,
      systemFeed: [`SYMBOL CONTEXT -> ${ticker}${market ? ` ${market}` : ''}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
    };
  }

  if (action.type === 'SET_INTEL_FILTERS') {
    return { ...state, intelFilters: action.payload };
  }

  if (action.type === 'EXECUTE_COMMAND') {
    let raw = action.payload ?? state.commandInput;
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    const intent = routeSearch(trimmed);

    if (intent.type === 'INTEL_ENTITY') {
      const entity = intent.entity;
      const filters = intent.filters;
      const normalized = `${entity} INTEL GO`;
      return {
        ...state,
        commandInput: normalized,
        security: { ticker: entity, market: '', assetClass: 'EQUITY' },
        activeSymbol: entity,
        functionCode: 'INTEL',
        activeFunction: 'INTEL',
        activeSubTab: undefined,
        intelFilters: filters,
        systemFeed: [`LOADED ${normalized}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
      };
    }

    if (intent.type === 'TICKER' && intent.ticker) {
      raw = `${intent.ticker}${intent.market ? ` ${intent.market}` : ''} EXEC GO`;
    }

    const compact = raw.replace(/\s+/g, ' ').trim().toUpperCase();
    if (compact && !compact.endsWith(' GO')) {
      const guess = state.quotes.find(
        (q) =>
          q.symbol.toUpperCase().startsWith(compact)
          || q.symbol.toUpperCase().includes(compact)
          || q.name.toUpperCase().includes(compact),
      );
      if (guess) raw = `${guess.symbol} ${state.activeFunction} GO`;
    }
    const result = parseCommand(raw);
    if (!result.ok) {
      if (intent.type === 'UNKNOWN' && trimmed) {
        const entity = trimmed.split(/\s+/)[0] ?? trimmed;
        return {
          ...state,
          commandInput: `${entity} INTEL GO`,
          security: { ticker: entity, market: '', assetClass: 'EQUITY' },
          activeSymbol: entity,
          functionCode: 'INTEL',
          activeFunction: 'INTEL',
          activeSubTab: undefined,
          intelFilters: undefined,
          systemFeed: [`FALLBACK INTEL: ${entity}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
        };
      }
      return {
        ...state,
        commandInput: result.normalized,
        systemFeed: [`REJECTED: ${result.error}`, ...state.systemFeed].slice(0, SYSTEM_FEED_MAX_ROWS),
      };
    }

    const transitionLine = result.activeFunction !== state.activeFunction ? `FUNCTION CONTEXT -> ${result.activeFunction}` : '';
    return {
      ...state,
      commandInput: result.normalized,
      security: result.security,
      activeSymbol: `${result.security.ticker}${result.security.market ? ` ${result.security.market}` : ''}`,
      functionCode: result.functionCode,
      activeFunction: result.activeFunction,
      activeSubTab: undefined,
      intelFilters: result.activeFunction === 'INTEL' ? state.intelFilters : undefined,
      systemFeed: [transitionLine, `LOADED ${result.normalized}`, ...state.systemFeed].filter(Boolean).slice(0, SYSTEM_FEED_MAX_ROWS),
    };
  }

  return state;
}

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(terminalReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'TICK_QUOTES' });
    dispatch({ type: 'TICK_DEPTH_TAPE' });
    dispatch({ type: 'TICK_EXECUTION' });
    dispatch({ type: 'TICK_FEED' });

    const quotesId = window.setInterval(() => dispatch({ type: 'TICK_QUOTES' }), STREAM_CADENCE.quotes);
    const depthId = window.setInterval(() => dispatch({ type: 'TICK_DEPTH_TAPE' }), STREAM_CADENCE.depth);
    const executionId = window.setInterval(() => dispatch({ type: 'TICK_EXECUTION' }), STREAM_CADENCE.execution);
    const feedId = window.setInterval(() => dispatch({ type: 'TICK_FEED' }), STREAM_CADENCE.feed);
    return () => {
      window.clearInterval(quotesId);
      window.clearInterval(depthId);
      window.clearInterval(executionId);
      window.clearInterval(feedId);
    };
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
    const latency = 8 + ((state.staged.commitSeq * 3) % 19);
    return {
      state,
      dispatch,
      deckRows: resolveFunctionDeck(state.activeFunction, { state, risk: state.risk, micro: state.microstructure }),
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
