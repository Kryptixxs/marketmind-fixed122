import type { ReactNode } from 'react';

export type FunctionCode = 'EXEC' | 'ESC' | 'DES' | 'FA' | 'WEI' | 'HP' | 'YAS' | 'TOP' | 'ECO' | 'NI' | 'OVME' | 'PORT' | 'NEWS' | 'CAL' | 'SEC' | 'MKT' | 'INTEL' | 'IMAP' | 'FXC' | 'GC' | 'CN' | 'OQ' | 'IB';
export type TerminalFunction = 'EXEC' | 'DES' | 'FA' | 'HP' | 'WEI' | 'YAS' | 'OVME' | 'PORT' | 'NEWS' | 'CAL' | 'SEC' | 'MKT' | 'INTEL' | 'IMAP' | 'ECO' | 'FXC' | 'GC' | 'IB';

export type AssetClass = 'EQUITY' | 'CORP' | 'GOVT' | 'CMDTY' | 'CURNCY';

export type SecurityContext = {
  ticker: string;
  market: string;
  assetClass: AssetClass;
};

export type Quote = {
  symbol: string;
  name: string;
  last: number;
  pct: number;
  abs: number;
  high: number;
  low: number;
  volumeM: number;
  betaToSPX: number;
  corrToSPX: number;
  corrToNDX: number;
  liquidityScore: number;
  momentum: number;
};

export type OrderBookLevel = {
  level: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  cumBidSize: number;
  cumAskSize: number;
  bidHeat: number;
  askHeat: number;
};

export type TapePrint = {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  aggressive: boolean;
  isSweep: boolean;
};

export type BlotterRow = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  avg: number;
  last: number;
  pnl: number;
  status: 'WORKING' | 'FILLED' | 'PARTIAL';
};

export type ExecutionEvent = {
  id: string;
  symbol: string;
  status: 'WORKING' | 'PARTIAL' | 'FILLED';
  fillQty: number;
  fillPrice: number;
  source: 'TAPE' | 'DEPTH';
  ts: number;
  mode?: 'MACRO_CONTROLLED' | 'MANUAL_OVERRIDE';
  reasonCode?: OverrideReason;
};

export type IntradayBar = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  ma9: number;
  ma21: number;
};

export type ReferenceDailyBar = {
  date: string;
  close: number;
  volume: number;
};

export type ReferenceSecurityProfile = {
  symbol: string;
  sector: string;
  industry: string;
  marketCapBn: number;
  floatBn: number;
  country: string;
  exchange: string;
  ratings: { sp: string; moodys: string; fitch: string };
  earningsDates: string[];
  dailyBars: ReferenceDailyBar[];
};

export type VolatilityRegime = 'TREND' | 'MEAN_REVERT' | 'VOL_EXPANSION';

export type SweepIndicator = {
  active: boolean;
  side: 'BUY' | 'SELL' | 'NONE';
  intensity: number;
  text: string;
};

export type MicrostructureStats = {
  insideSpreadBps: number;
  imbalance: number;
  orderFlowImbalance: number;
  sweep: SweepIndicator;
};

export type RiskSnapshot = {
  intradayVar: number;
  grossExposure: number;
  netExposure: number;
  concentration: number;
  beta: number;
  corrToBenchmark: number;
  realizedVol: number;
  impliedVolProxy: number;
  regime: VolatilityRegime;
  exposureBySector: Array<{ sector: string; value: number; pctChange?: number }>;
};

export type DeltaState = {
  changedSymbols: string[];
  priceFlash: Record<string, 'up' | 'down' | null>;
  tapePulseIds: string[];
  pnlFlash: Record<string, 'up' | 'down' | null>;
  alertPulse: boolean;
};

export type CommandResult =
  | {
      ok: true;
      normalized: string;
      security: SecurityContext;
      functionCode: FunctionCode;
      activeFunction: TerminalFunction;
    }
  | {
      ok: false;
      error: string;
      normalized: string;
    };

export type AnalyticsTab = 'OVERVIEW' | 'FACTORS' | 'EVENTS';
export type RightRailTab = 'DEPTH' | 'TAPE' | 'ALERTS';
export type FeedTab = 'NEWS' | 'SYSTEM';

export type StreamClock = {
  quotes: number;
  depth: number;
  execution: number;
  feed: number;
};

export type StagedStreamState = {
  quotesReadyAt: number;
  depthReadyAt: number;
  executionReadyAt: number;
  feedReadyAt: number;
  commitSeq: number;
};

export type ModuleTableRow = {
  key: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'accent' | 'warning';
};

export type ModuleChartData = {
  key: string;
  question: string;
  series: number[];
  secondary?: number[];
  labels?: string[];
  timeframes?: { label: '5D' | '1M' | '3M'; series: number[] }[];
};

export type ModuleDataModel = {
  moduleCode: FunctionCode;
  asOfTs: number;
  table: Record<string, ModuleTableRow[]>;
  charts: Record<string, ModuleChartData>;
};

export type TerminalBandKey = 'primary' | 'secondary' | 'tertiary';
export type PanelType =
  | 'VERDICT'
  | 'SNAPSHOT'
  | 'DIAGNOSTIC'
  | 'FLOW'
  | 'VULNERABILITY'
  | 'ORDER_STATE'
  | 'HISTORICAL';

export type TerminalPanelDefinition = {
  id: string;
  type: PanelType;
  question: string;
  priority: number;
  content: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export type TerminalBandDefinition = {
  key: TerminalBandKey;
  panels: TerminalPanelDefinition[];
};

export type TerminalModuleDefinition = {
  code: TerminalFunction;
  primaryDecision: string;
  bands: {
    primary: TerminalBandDefinition;
    secondary: TerminalBandDefinition;
    tertiary: TerminalBandDefinition;
  };
};

export type RegimeState = 'RISK_ON' | 'TRANSITION' | 'RISK_OFF';
export type RiskBias = 'ADD' | 'REDUCE' | 'HEDGE';
export type OverrideReason =
  | 'URGENT_NEWS'
  | 'LIQUIDITY_WINDOW'
  | 'BLOCK_OPPORTUNITY'
  | 'CLIENT_MANDATE'
  | 'RISK_UNWIND'
  | 'VOL_DISLOCATION'
  | 'OTHER';

export type ExecutionContextInput = {
  regimeState: RegimeState;
  riskBias: RiskBias;
  urgencyModifier: number;
  participationCap: number;
  throttleLevel: number;
  riskOnScore: number;
  volatilityAlert: boolean;
  liquidityStress: boolean;
  breadthDeterioration: boolean;
};

export type SymbolOverrideEntry = {
  isActive: boolean;
  reasonCode: OverrideReason;
  otherReasonText?: string;
  expiresAt: number;
  initiatedAt: number;
  initiatedBy: string;
};

export type SymbolOverrideState = Record<string, SymbolOverrideEntry | undefined>;

export type MacroExecutionState = {
  regimeState: RegimeState;
  riskBias: RiskBias;
  urgencyModifier: number;
  participationCap: number;
  throttleLevel: number;
};

export type ExecutionControlState = {
  macro: MacroExecutionState;
  symbolOverrides: SymbolOverrideState;
};

export type OverrideAuditEvent = {
  id: string;
  ts: number;
  symbol: string;
  action: 'ACTIVATED' | 'EXPIRED' | 'CANCELLED';
  reasonCode: OverrideReason;
  regimeState: RegimeState;
  ttlMs: number;
  initiatedBy: string;
  otherReasonText?: string;
  performanceDeltaBps?: number;
};

export type TerminalState = {
  seed: number;
  tick: number;
  tickMs: number;
  activeSymbol: string;
  commandInput: string;
  security: SecurityContext;
  functionCode: FunctionCode;
  activeFunction: TerminalFunction;
  activeSubTab?: string;
  drillPath: string[];
  analyticsTab: AnalyticsTab;
  rightRailTab: RightRailTab;
  feedTab: FeedTab;
  quotes: Quote[];
  orderBook: OrderBookLevel[];
  tape: TapePrint[];
  blotter: BlotterRow[];
  executionEvents: ExecutionEvent[];
  alerts: string[];
  headlines: string[];
  systemFeed: string[];
  barsBySymbol: Record<string, IntradayBar[]>;
  microstructure: MicrostructureStats;
  risk: RiskSnapshot;
  referenceBySymbol: Record<string, ReferenceSecurityProfile>;
  delta: DeltaState;
  streamClock: StreamClock;
  staged: StagedStreamState;
  intelFilters?: { country?: string; date?: string };
  marketUi?: {
    activeBand: 'REGIME' | 'DRIVERS' | 'FLOW';
    deepDetailExpanded: boolean;
  };
  executionControls: ExecutionControlState;
  overrideAuditTrail: OverrideAuditEvent[];
  workerAnalytics?: {
    vwapBySymbol: Record<string, number>;
    macdBySymbol: Record<string, number>;
    arbitrageSpreads: Array<{ left: string; right: string; spread: number }>;
    workerLatencyMs: number;
    uiFps: number;
  };
};
