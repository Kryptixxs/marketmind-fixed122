'use client';

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
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
import { DeltaState, FunctionCode, OverrideAuditEvent, OverrideReason, TerminalFunction, TerminalState } from '../types';
import { deriveRiskSnapshot } from '../selectors/riskSelectors';
import { buildMarketDataModel } from '../modules/market/buildMarketDataModel';
import { buildExecutionContextFromMarket, toMacroExecutionState } from '../modules/market/buildExecutionContextFromMarket';
import { selectExecutionPolicy } from '../selectors/executionContextSelectors';
import { loadPersistedState, savePersistedState } from '../services/terminalPersistence';
import { generateFakeHeadline } from '../services/fakeNewsGenerator';

type TerminalAction =
  | { type: 'TICK_QUOTES' }
  | { type: 'TICK_QUOTES_FROM_WORKER'; payload: { streamTick: number; tickMs: number; quotes: TerminalState['quotes'] } }
  | {
      type: 'TICK_MARKET_SNAPSHOT';
      payload: {
        streamTick: number;
        tickMs: number;
        quotes: TerminalState['quotes'];
        analytics: NonNullable<TerminalState['workerAnalytics']>;
        emittedAt: number;
      };
    }
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
  | { type: 'SET_MARKET_ACTIVE_BAND'; payload: 'REGIME' | 'DRIVERS' | 'FLOW' }
  | { type: 'TOGGLE_MARKET_DEEP_DETAIL' }
  | {
      type: 'ACTIVATE_SYMBOL_OVERRIDE';
      payload: {
        symbol: string;
        reasonCode: OverrideReason;
        ttlMs: number;
        initiatedBy: string;
        otherReasonText?: string;
      };
    }
  | { type: 'CANCEL_SYMBOL_OVERRIDE'; payload: { symbol: string; initiatedBy: string } }
  | { type: 'SET_SYMBOL'; payload: string }
  | { type: 'TICKER_SELECTED'; payload: string }
  | { type: 'SET_INTEL_FILTERS'; payload: { country?: string; date?: string } | undefined }
  | { type: 'PUSH_HEADLINE'; payload: string }
  | { type: 'SET_UI_FPS'; payload: number };

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

/** 200ms mock tick cadence for high-frequency simulation */
const MOCK_QUOTES_MS = 200;

function getQuotesCadence() {
  if (typeof window === 'undefined') return MOCK_QUOTES_MS;
  if (!process.env.NEXT_PUBLIC_API_URL) return MOCK_QUOTES_MS;
  return localStorage.getItem('vantage-simulate-500') === 'true' ? MOCK_QUOTES_MS : 240;
}

const STREAM_CADENCE = {
  get quotes() { return getQuotesCadence(); },
  depth: 420,
  execution: 820,
  feed: 1600,
};

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
    tapePulseIds: next.tape.map((t) => t.id),
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
  const withRiskDelta = { ...merged, risk, delta };
  const marketModel = buildMarketDataModel(withRiskDelta);
  const executionInput = buildExecutionContextFromMarket(marketModel);
  return {
    ...withRiskDelta,
    executionControls: {
      ...(withRiskDelta.executionControls ?? { symbolOverrides: {} }),
      macro: toMacroExecutionState(executionInput),
      symbolOverrides: withRiskDelta.executionControls?.symbolOverrides ?? {},
    },
  };
}

function nextStaged(state: TerminalState, key: 'quotesReadyAt' | 'depthReadyAt' | 'executionReadyAt' | 'feedReadyAt', tickMs: number) {
  return {
    ...state.staged,
    [key]: tickMs,
    commitSeq: state.staged.commitSeq + 1,
  };
}

function buildOverrideAuditEvent(args: {
  action: OverrideAuditEvent['action'];
  symbol: string;
  reasonCode: OverrideReason;
  ts: number;
  regimeState: TerminalState['executionControls']['macro']['regimeState'];
  ttlMs: number;
  initiatedBy: string;
  otherReasonText?: string;
}): OverrideAuditEvent {
  return {
    id: `override-${args.action}-${args.symbol}-${args.ts}`,
    ts: args.ts,
    symbol: args.symbol,
    action: args.action,
    reasonCode: args.reasonCode,
    regimeState: args.regimeState,
    ttlMs: args.ttlMs,
    initiatedBy: args.initiatedBy,
    otherReasonText: args.otherReasonText,
  };
}

function expireOverrides(state: TerminalState, nowTs: number): {
  symbolOverrides: TerminalState['executionControls']['symbolOverrides'];
  events: OverrideAuditEvent[];
  feedLines: string[];
} {
  const events: OverrideAuditEvent[] = [];
  const feedLines: string[] = [];
  const nextOverrides: TerminalState['executionControls']['symbolOverrides'] = { ...state.executionControls.symbolOverrides };
  for (const [symbol, override] of Object.entries(state.executionControls.symbolOverrides)) {
    if (!override?.isActive) continue;
    if (override.expiresAt > nowTs) continue;
    const ttlMs = Math.max(0, override.expiresAt - override.initiatedAt);
    const event = buildOverrideAuditEvent({
      action: 'EXPIRED',
      symbol,
      reasonCode: override.reasonCode,
      ts: nowTs,
      regimeState: state.executionControls.macro.regimeState,
      ttlMs,
      initiatedBy: override.initiatedBy,
      otherReasonText: override.otherReasonText,
    });
    events.push(event);
    feedLines.push(`OVERRIDE EXPIRED ${symbol} ${override.reasonCode}`);
    delete nextOverrides[symbol];
  }
  return { symbolOverrides: nextOverrides, events, feedLines };
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
  marketUi: {
    activeBand: 'REGIME',
    deepDetailExpanded: false,
  },
  executionControls: {
    macro: {
      regimeState: 'TRANSITION',
      riskBias: 'HEDGE',
      urgencyModifier: 1,
      participationCap: 0.18,
      throttleLevel: 0.92,
    },
    symbolOverrides: {},
  },
  overrideAuditTrail: [],
  workerAnalytics: {
    vwapBySymbol: {},
    macdBySymbol: {},
    arbitrageSpreads: [],
    workerLatencyMs: 0,
    uiFps: 60,
  },
};

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  if (action.type === 'TICK_QUOTES') {
    const streamTick = state.streamClock.quotes + 1;
    const batch = buildQuotesStream(state.seed, streamTick, STREAM_CADENCE.quotes);
    const expiry = expireOverrides(state, batch.tickMs);
    return deriveNext(state, {
      tick: streamTick,
      tickMs: batch.tickMs,
      quotes: batch.quotes,
      activeSymbol: activeSymbolPrefix(state),
      executionControls: { ...state.executionControls, symbolOverrides: expiry.symbolOverrides },
      overrideAuditTrail: [...expiry.events, ...state.overrideAuditTrail],
      systemFeed: [...expiry.feedLines, ...state.systemFeed],
      streamClock: { ...state.streamClock, quotes: streamTick },
      staged: nextStaged(state, 'quotesReadyAt', batch.tickMs),
    });
  }

  if (action.type === 'TICK_QUOTES_FROM_WORKER') {
    const { streamTick, tickMs, quotes } = action.payload;
    const expiry = expireOverrides(state, tickMs);
    return deriveNext(state, {
      tick: streamTick,
      tickMs,
      quotes,
      activeSymbol: activeSymbolPrefix(state),
      executionControls: { ...state.executionControls, symbolOverrides: expiry.symbolOverrides },
      overrideAuditTrail: [...expiry.events, ...state.overrideAuditTrail],
      systemFeed: [...expiry.feedLines, ...state.systemFeed],
      streamClock: { ...state.streamClock, quotes: streamTick },
      staged: nextStaged(state, 'quotesReadyAt', tickMs),
    });
  }

  if (action.type === 'TICK_MARKET_SNAPSHOT') {
    const { streamTick, tickMs, quotes, analytics, emittedAt } = action.payload;
    const expiry = expireOverrides(state, tickMs);
    const latency = Math.max(0, Date.now() - emittedAt);
    return deriveNext(state, {
      tick: streamTick,
      tickMs,
      quotes,
      workerAnalytics: {
        ...analytics,
        workerLatencyMs: latency,
        uiFps: state.workerAnalytics?.uiFps ?? 60,
      },
      activeSymbol: activeSymbolPrefix(state),
      executionControls: { ...state.executionControls, symbolOverrides: expiry.symbolOverrides },
      overrideAuditTrail: [...expiry.events, ...state.overrideAuditTrail],
      systemFeed: [...expiry.feedLines, ...state.systemFeed],
      streamClock: { ...state.streamClock, quotes: streamTick },
      staged: nextStaged(state, 'quotesReadyAt', tickMs),
    });
  }

  if (action.type === 'TICK_DEPTH_TAPE') {
    const streamTick = state.streamClock.depth + 1;
    const quote = activeQuoteFrom(state);
    const batch = buildDepthTapeStream(state.seed, streamTick, state.tickMs, quote?.last ?? 100);
    const accumulatedTape = [...batch.tape, ...state.tape];
    const expiry = expireOverrides(state, state.tickMs);
    return deriveNext(state, {
      orderBook: batch.orderBook,
      tape: accumulatedTape,
      microstructure: batch.micro,
      executionControls: { ...state.executionControls, symbolOverrides: expiry.symbolOverrides },
      overrideAuditTrail: [...expiry.events, ...state.overrideAuditTrail],
      systemFeed: [...expiry.feedLines, ...state.systemFeed],
      streamClock: { ...state.streamClock, depth: streamTick },
      staged: nextStaged(state, 'depthReadyAt', state.tickMs),
    });
  }

  if (action.type === 'TICK_EXECUTION') {
    const streamTick = state.streamClock.execution + 1;
    const policy = selectExecutionPolicy(state);
    const batch = buildExecutionStream(streamTick, state.tickMs, state.quotes, state.blotter, state.tape, state.barsBySymbol, {
      mode: policy.mode,
      symbol: policy.symbol,
      urgencyMultiplier: policy.urgencyMultiplier,
      participationRate: policy.participationRate,
      routingAggressiveness: policy.routingAggressiveness,
      maxNotional: policy.maxNotional,
      maxSlippageBps: policy.maxSlippageBps,
      killSwitch: policy.killSwitch,
      reasonCode: policy.reasonCode,
    });
    const expiry = expireOverrides(state, state.tickMs);
    const executionLines = batch.executionEvents.map((e) => `EXEC ${e.symbol} ${e.status} ${e.fillQty}@${e.fillPrice.toFixed(2)} ${e.source} ${e.mode ?? 'MACRO_CONTROLLED'}`);
    const guardrailLine = policy.killSwitch ? `EXEC GUARDRAIL KILL_SWITCH ACTIVE ${policy.symbol}` : '';
    return deriveNext(state, {
      blotter: batch.blotter,
      executionEvents: batch.executionEvents,
      barsBySymbol: batch.barsBySymbol,
      executionControls: { ...state.executionControls, symbolOverrides: expiry.symbolOverrides },
      overrideAuditTrail: [...expiry.events, ...state.overrideAuditTrail],
      systemFeed: [guardrailLine, ...executionLines, ...expiry.feedLines, ...state.systemFeed].filter(Boolean),
      streamClock: { ...state.streamClock, execution: streamTick },
      staged: nextStaged(state, 'executionReadyAt', state.tickMs),
    });
  }

  if (action.type === 'TICK_FEED') {
    const streamTick = state.streamClock.feed + 1;
    const batch = buildFeedStream(streamTick, state.microstructure.sweep.active);
    const expiry = expireOverrides(state, state.tickMs);
    return deriveNext(state, {
      headlines: batch.headlines,
      alerts: batch.alerts,
      executionControls: { ...state.executionControls, symbolOverrides: expiry.symbolOverrides },
      overrideAuditTrail: [...expiry.events, ...state.overrideAuditTrail],
      systemFeed: [`FEED ROTATE -> H${streamTick}`, ...expiry.feedLines, ...state.systemFeed],
      streamClock: { ...state.streamClock, feed: streamTick },
      staged: nextStaged(state, 'feedReadyAt', state.tickMs),
    });
  }

  if (action.type === 'SET_COMMAND') return { ...state, commandInput: action.payload };

  if (action.type === 'PUSH_HEADLINE') {
    return { ...state, headlines: [action.payload, ...state.headlines].slice(0, 72) };
  }

  if (action.type === 'SET_UI_FPS') {
    return {
      ...state,
      workerAnalytics: {
        ...(state.workerAnalytics ?? {
          vwapBySymbol: {},
          macdBySymbol: {},
          arbitrageSpreads: [],
          workerLatencyMs: 0,
          uiFps: 60,
        }),
        uiFps: action.payload,
      },
    };
  }

  if (action.type === 'SET_FUNCTION') {
    const activeFunction = toActiveFunction(action.payload);
    const normalized = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${action.payload} GO`;
    return {
      ...state,
      functionCode: action.payload,
      activeFunction,
      activeSubTab: action.payload === 'ESC' ? 'ESC' : undefined,
      commandInput: normalized,
      systemFeed: [`FUNCTION CONTEXT -> ${activeFunction}`, ...state.systemFeed],
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
      systemFeed: [`FUNCTION CONTEXT -> ${action.payload}`, ...state.systemFeed],
    };
  }

  if (action.type === 'SET_ACTIVE_SUBTAB') return { ...state, activeSubTab: action.payload };
  if (action.type === 'SET_ANALYTICS_TAB') return { ...state, analyticsTab: action.payload };
  if (action.type === 'SET_RIGHT_TAB') return { ...state, rightRailTab: action.payload };
  if (action.type === 'SET_FEED_TAB') return { ...state, feedTab: action.payload };
  if (action.type === 'SET_MARKET_ACTIVE_BAND') {
    return { ...state, marketUi: { ...(state.marketUi ?? { deepDetailExpanded: false }), activeBand: action.payload } };
  }
  if (action.type === 'TOGGLE_MARKET_DEEP_DETAIL') {
    return {
      ...state,
      marketUi: {
        activeBand: state.marketUi?.activeBand ?? 'REGIME',
        deepDetailExpanded: !(state.marketUi?.deepDetailExpanded ?? false),
      },
    };
  }

  if (action.type === 'ACTIVATE_SYMBOL_OVERRIDE') {
    const nowTs = state.tickMs;
    const ttlMs = Math.min(15 * 60_000, Math.max(5 * 60_000, action.payload.ttlMs));
    const symbol = action.payload.symbol;
    const overrideEntry = {
      isActive: true,
      reasonCode: action.payload.reasonCode,
      expiresAt: nowTs + ttlMs,
      initiatedAt: nowTs,
      initiatedBy: action.payload.initiatedBy,
      otherReasonText: action.payload.otherReasonText,
    };
    const event = buildOverrideAuditEvent({
      action: 'ACTIVATED',
      symbol,
      reasonCode: action.payload.reasonCode,
      ts: nowTs,
      regimeState: state.executionControls.macro.regimeState,
      ttlMs,
      initiatedBy: action.payload.initiatedBy,
      otherReasonText: action.payload.otherReasonText,
    });
    return {
      ...state,
      executionControls: {
        ...state.executionControls,
        symbolOverrides: {
          ...state.executionControls.symbolOverrides,
          [symbol]: overrideEntry,
        },
      },
      overrideAuditTrail: [event, ...state.overrideAuditTrail],
      systemFeed: [`OVERRIDE ACTIVE ${symbol} ${action.payload.reasonCode} TTL ${Math.round(ttlMs / 60_000)}m`, ...state.systemFeed],
    };
  }

  if (action.type === 'CANCEL_SYMBOL_OVERRIDE') {
    const nowTs = state.tickMs;
    const current = state.executionControls.symbolOverrides[action.payload.symbol];
    if (!current?.isActive) return state;
    const ttlMs = Math.max(0, current.expiresAt - current.initiatedAt);
    const event = buildOverrideAuditEvent({
      action: 'CANCELLED',
      symbol: action.payload.symbol,
      reasonCode: current.reasonCode,
      ts: nowTs,
      regimeState: state.executionControls.macro.regimeState,
      ttlMs,
      initiatedBy: action.payload.initiatedBy,
      otherReasonText: current.otherReasonText,
    });
    const nextOverrides = { ...state.executionControls.symbolOverrides };
    delete nextOverrides[action.payload.symbol];
    return {
      ...state,
      executionControls: { ...state.executionControls, symbolOverrides: nextOverrides },
      overrideAuditTrail: [event, ...state.overrideAuditTrail],
      systemFeed: [`OVERRIDE CANCELLED ${action.payload.symbol} ${current.reasonCode}`, ...state.systemFeed],
    };
  }

  if (action.type === 'SET_SYMBOL' || action.type === 'TICKER_SELECTED') {
    const [ticker, market = ''] = action.payload.split(' ');
    const assetClass = market === 'Index' ? 'EQUITY' : market === 'Curncy' ? 'CURNCY' : market === 'Govt' ? 'GOVT' : 'EQUITY';
    return {
      ...state,
      security: { ticker, market, assetClass },
      activeSymbol: `${ticker}${market ? ` ${market}` : ''}`,
      commandInput: `${ticker}${market ? ` ${market}` : ''} ${state.activeFunction} GO`,
      systemFeed: [`SYMBOL CONTEXT -> ${ticker}${market ? ` ${market}` : ''}`, ...state.systemFeed],
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
        systemFeed: [`LOADED ${normalized}`, ...state.systemFeed],
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
          systemFeed: [`FALLBACK INTEL: ${entity}`, ...state.systemFeed],
        };
      }
      return {
        ...state,
        commandInput: result.normalized,
        systemFeed: [`REJECTED: ${result.error}`, ...state.systemFeed],
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
      activeSubTab: result.functionCode === 'ESC' ? 'ESC' : undefined,
      intelFilters: result.activeFunction === 'INTEL' ? state.intelFilters : undefined,
      systemFeed: [transitionLine, `LOADED ${result.normalized}`, ...state.systemFeed].filter(Boolean),
    };
  }

  return state;
}

function mergeInitialState(base: TerminalState): TerminalState {
  const persisted = loadPersistedState();
  if (!persisted.activeSymbol && !persisted.functionCode && !persisted.activeFunction) return base;
  const [ticker, market = ''] = (persisted.activeSymbol ?? base.activeSymbol).split(' ');
  const assetClass = market === 'Index' ? 'EQUITY' : market === 'Curncy' ? 'CURNCY' : market === 'Govt' ? 'GOVT' : 'EQUITY';
  const functionCode = (persisted.functionCode ?? base.functionCode) as FunctionCode;
  const activeFunction = (persisted.activeFunction ?? toActiveFunction(functionCode)) as TerminalFunction;
  const activeSymbol = persisted.activeSymbol ?? base.activeSymbol;
  const commandInput = `${activeSymbol} ${activeFunction} GO`;
  return {
    ...base,
    activeSymbol,
    commandInput,
    functionCode,
    activeFunction,
    security: { ticker: ticker || base.security.ticker, market: market || base.security.market, assetClass },
  };
}

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () => mergeInitialState(initialState));

  const streamTickRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    dispatch({ type: 'TICK_DEPTH_TAPE' });
    dispatch({ type: 'TICK_EXECUTION' });
    dispatch({ type: 'TICK_FEED' });

    const worker = new Worker(new URL('../workers/bpipe.worker.ts', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent) => {
      if (e.data?.type === 'MARKET_SNAPSHOT') {
        dispatch({ type: 'TICK_MARKET_SNAPSHOT', payload: e.data.payload });
      }
    };
    worker.onerror = () => {
      streamTickRef.current = 0;
    };

    const seed = 31051990;
    worker.postMessage({
      type: 'START',
      seed,
      intervalMs: STREAM_CADENCE.quotes,
      activeSymbols: ['AAPL US', 'MSFT US', 'NVDA US', 'SPY US', 'QQQ US'],
    });

    const depthId = window.setInterval(() => dispatch({ type: 'TICK_DEPTH_TAPE' }), STREAM_CADENCE.depth);
    const executionId = window.setInterval(() => dispatch({ type: 'TICK_EXECUTION' }), STREAM_CADENCE.execution);
    const feedId = window.setInterval(() => dispatch({ type: 'TICK_FEED' }), STREAM_CADENCE.feed);
    const newsId = window.setInterval(() => dispatch({ type: 'PUSH_HEADLINE', payload: generateFakeHeadline() }), 30_000);
    return () => {
      worker.postMessage({ type: 'STOP' });
      workerRef.current?.terminate();
      workerRef.current = null;
      window.clearInterval(depthId);
      window.clearInterval(executionId);
      window.clearInterval(feedId);
      window.clearInterval(newsId);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        const input = (document.getElementById('command-center-input')
          || document.getElementById('terminal-command-input')) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
      if (e.key === 'Escape') dispatch({ type: 'SET_COMMAND', payload: '' });
      if (state.activeFunction !== 'MKT') return;
      if (e.key === '1') dispatch({ type: 'SET_MARKET_ACTIVE_BAND', payload: 'REGIME' });
      if (e.key === '2') dispatch({ type: 'SET_MARKET_ACTIVE_BAND', payload: 'DRIVERS' });
      if (e.key === '3') dispatch({ type: 'SET_MARKET_ACTIVE_BAND', payload: 'FLOW' });
      if (e.key.toLowerCase() === 'd') dispatch({ type: 'TOGGLE_MARKET_DEEP_DETAIL' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.activeFunction]);

  useEffect(() => {
    savePersistedState({ activeSymbol: state.activeSymbol, functionCode: state.functionCode, activeFunction: state.activeFunction });
  }, [state.activeSymbol, state.functionCode, state.activeFunction]);

  useEffect(() => {
    const onSymbolChange = (e: Event) => {
      const sym = (e as CustomEvent<string>).detail;
      if (sym) dispatch({ type: 'SET_SYMBOL', payload: sym.includes(' ') ? sym : `${sym} US` });
    };
    window.addEventListener('vantage-symbol-change', onSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', onSymbolChange);
  }, [dispatch]);

  useEffect(() => {
    let rafId = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last));
        dispatch({ type: 'SET_UI_FPS', payload: fps });
        const flashMs = fps < 50 ? 120 : 200;
        document.documentElement.style.setProperty('--terminal-flash-ms', `${flashMs}ms`);
        frames = 0;
        last = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [dispatch]);

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
