// ── Simulation Clock ─────────────────────────────────────────────────
export interface SimulationClock {
  tickId: number;
  epochMs: number;
  cadenceMs: number;
}

// ── Regime Model ─────────────────────────────────────────────────────
export type RegimeType = 'trend-up' | 'trend-down' | 'mean-revert' | 'vol-expansion';

export interface RegimeState {
  current: RegimeType;
  driftBps: number;       // basis points per tick
  volBps: number;         // volatility in basis points
  transitionProb: number; // probability of regime change per tick
  ticksInRegime: number;
}

// ── Price / Quote ────────────────────────────────────────────────────
export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  prevClose: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  tickId: number;
}

export interface Bar {
  symbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Depth / Order Book ───────────────────────────────────────────────
export interface DepthLevel {
  price: number;
  size: number;
  orders: number;
  cumulative: number;
}

export interface DepthSnapshot {
  symbol: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
  spread: number;
  spreadBps: number;
  imbalance: number; // -1 to 1 (bid-heavy to ask-heavy)
  tickId: number;
}

// ── Time & Sales (Tape) ──────────────────────────────────────────────
export type TapeSide = 'buy' | 'sell';
export type TapeCondition = 'normal' | 'sweep' | 'block' | 'odd-lot';

export interface TapePrint {
  id: string;
  symbol: string;
  price: number;
  size: number;
  side: TapeSide;
  condition: TapeCondition;
  epochMs: number;
  tickId: number;
  aboveBid: boolean;
}

// ── Orders & Blotter ─────────────────────────────────────────────────
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MKT' | 'LMT' | 'STP';
export type OrderStatus = 'WORKING' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  filledQty: number;
  price: number;
  avgFillPx: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  tickId: number;
}

export interface Position {
  symbol: string;
  qty: number;
  avgCost: number;
  marketValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  side: 'LONG' | 'SHORT' | 'FLAT';
}

// ── Alerts ───────────────────────────────────────────────────────────
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  symbol?: string;
  epochMs: number;
  tickId: number;
}

// ── Feed / Headlines ─────────────────────────────────────────────────
export type FeedType = 'headline' | 'system' | 'execution' | 'command';

export interface FeedItem {
  id: string;
  type: FeedType;
  message: string;
  symbol?: string;
  epochMs: number;
  tickId: number;
}

// ── Tick Batch (atomic engine output) ────────────────────────────────
export interface TickBatch {
  clock: SimulationClock;
  quotes: Quote[];
  bars: Bar[];
  depth: DepthSnapshot;
  prints: TapePrint[];
  fills: Order[];
  alerts: Alert[];
  headlines: FeedItem[];
  regime: RegimeState;
}

// ── Command System ───────────────────────────────────────────────────
export type CommandResultType = 'NAV' | 'DATA' | 'EXEC' | 'ERROR' | 'INFO';

export interface CommandResult {
  type: CommandResultType;
  message: string;
  payload?: Record<string, unknown>;
}

// ── Risk Metrics (derived) ───────────────────────────────────────────
export interface RiskMetrics {
  grossExposure: number;
  netExposure: number;
  realizedVol: number;
  impliedVolProxy: number;
  intradayVaR: number;
  sharpeProxy: number;
  concentration: number;
  momentumScore: number;
  liquidityScore: number;
  regimeLabel: string;
  benchmarkCorrelation: number;
}

// ── Store State ──────────────────────────────────────────────────────
export interface TerminalState {
  // Clock
  clock: SimulationClock;
  running: boolean;

  // Market
  activeSymbol: string;
  symbols: string[];
  quotes: Record<string, Quote>;
  bars: Record<string, Bar[]>;
  depth: Record<string, DepthSnapshot>;
  tape: TapePrint[];
  regime: RegimeState;

  // Execution
  orders: Order[];
  positions: Record<string, Position>;

  // Feed
  alerts: Alert[];
  feed: FeedItem[];

  // Risk
  risk: RiskMetrics;

  // UI Context
  commandLog: string[];
  functionContext: string;
}

// ── Instrument Metadata ──────────────────────────────────────────────
export interface Instrument {
  symbol: string;
  name: string;
  assetClass: 'equity' | 'index' | 'commodity' | 'crypto' | 'forex' | 'fixed-income';
  tickSize: number;
  lotSize: number;
  basePrice: number;
  currency: string;
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'AAPL',   name: 'Apple Inc.',        assetClass: 'equity',     tickSize: 0.01, lotSize: 100, basePrice: 257, currency: 'USD' },
  { symbol: 'NVDA',   name: 'NVIDIA Corp.',      assetClass: 'equity',     tickSize: 0.01, lotSize: 100, basePrice: 183, currency: 'USD' },
  { symbol: 'MSFT',   name: 'Microsoft Corp.',   assetClass: 'equity',     tickSize: 0.01, lotSize: 100, basePrice: 419, currency: 'USD' },
  { symbol: 'TSLA',   name: 'Tesla Inc.',        assetClass: 'equity',     tickSize: 0.01, lotSize: 100, basePrice: 398, currency: 'USD' },
  { symbol: 'AMZN',   name: 'Amazon.com',        assetClass: 'equity',     tickSize: 0.01, lotSize: 100, basePrice: 216, currency: 'USD' },
  { symbol: 'GOOGL',  name: 'Alphabet Inc.',     assetClass: 'equity',     tickSize: 0.01, lotSize: 100, basePrice: 175, currency: 'USD' },
  { symbol: 'SPX',    name: 'S&P 500 Index',     assetClass: 'index',      tickSize: 0.25, lotSize: 1,   basePrice: 5830, currency: 'USD' },
  { symbol: 'NDX',    name: 'Nasdaq 100 Index',  assetClass: 'index',      tickSize: 0.25, lotSize: 1,   basePrice: 20500, currency: 'USD' },
  { symbol: 'BTCUSD', name: 'Bitcoin',           assetClass: 'crypto',     tickSize: 0.01, lotSize: 1,   basePrice: 68900, currency: 'USD' },
  { symbol: 'ETHUSD', name: 'Ethereum',          assetClass: 'crypto',     tickSize: 0.01, lotSize: 1,   basePrice: 3850, currency: 'USD' },
  { symbol: 'EURUSD', name: 'Euro/Dollar',       assetClass: 'forex',      tickSize: 0.0001, lotSize: 100000, basePrice: 1.0845, currency: 'USD' },
  { symbol: 'GC',     name: 'Gold Futures',      assetClass: 'commodity',  tickSize: 0.10, lotSize: 100, basePrice: 2650, currency: 'USD' },
  { symbol: 'CL',     name: 'Crude Oil WTI',     assetClass: 'commodity',  tickSize: 0.01, lotSize: 1000, basePrice: 79.5, currency: 'USD' },
  { symbol: 'UST10Y', name: '10Y Treasury',      assetClass: 'fixed-income', tickSize: 0.001, lotSize: 1, basePrice: 4.08, currency: 'USD' },
];
