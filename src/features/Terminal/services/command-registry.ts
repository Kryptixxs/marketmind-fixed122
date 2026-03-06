export type NavItem = {
  path: string;
  label: string;
  desc: string;
};

export type TopSymbol = {
  sym: string;
  label: string;
  category: string;
};

export type WorkspaceFunction = {
  code: 'BMON' | 'FLOW' | 'MACRO' | 'RISK';
  label: string;
};

export type SymbolFunctionIntent = {
  aliases: string[];
  path: string;
  label: string;
};

export type BloombergFunction = {
  code: string;
  label: string;
  path: string;
  desc: string;
};

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', desc: 'Market workspace' },
  { path: '/charts', label: 'Markets / Charts', desc: 'Technical analysis' },
  { path: '/screener', label: 'Screener', desc: 'Filter instruments' },
  { path: '/portfolio', label: 'Portfolio', desc: 'Position analytics' },
  { path: '/calendar', label: 'Economic Calendar', desc: 'Events & earnings' },
  { path: '/news', label: 'Intelligence Wire', desc: 'Market news' },
  { path: '/confluences', label: 'Quant Engine', desc: 'Confluence analysis' },
  { path: '/algo', label: 'Algo Lab', desc: 'Backtesting' },
  { path: '/tools', label: 'Tools', desc: 'Calculators' },
];

export const ROUTE_ALIASES: Record<string, string> = {
  dashboard: '/dashboard',
  home: '/dashboard',
  charts: '/charts',
  markets: '/charts',
  screener: '/screener',
  screen: '/screener',
  portfolio: '/portfolio',
  port: '/portfolio',
  calendar: '/calendar',
  cal: '/calendar',
  news: '/news',
  wire: '/news',
  confluences: '/confluences',
  quant: '/confluences',
  algo: '/algo',
  backtest: '/algo',
  tools: '/tools',
  options: '/tools/options',
  forex: '/tools/forex',
  futures: '/tools/futures',
  settings: '/account',
  account: '/account',
  billing: '/billing',
};

export const TOP_SYMBOLS: TopSymbol[] = [
  { sym: 'NAS100', label: 'Nasdaq 100', category: 'Index' },
  { sym: 'SPX500', label: 'S&P 500', category: 'Index' },
  { sym: 'US30', label: 'Dow Jones', category: 'Index' },
  { sym: 'CRUDE', label: 'Crude Oil', category: 'Commodity' },
  { sym: 'GOLD', label: 'Gold', category: 'Commodity' },
  { sym: 'AAPL', label: 'Apple Inc.', category: 'Equity' },
  { sym: 'MSFT', label: 'Microsoft', category: 'Equity' },
  { sym: 'NVDA', label: 'NVIDIA', category: 'Equity' },
  { sym: 'TSLA', label: 'Tesla Inc.', category: 'Equity' },
  { sym: 'BTCUSD', label: 'Bitcoin', category: 'Crypto' },
  { sym: 'ETHUSD', label: 'Ethereum', category: 'Crypto' },
  { sym: 'EURUSD', label: 'EUR/USD', category: 'Forex' },
];

export const WORKSPACE_FUNCTIONS: WorkspaceFunction[] = [
  { code: 'BMON', label: 'Market Monitor' },
  { code: 'FLOW', label: 'Order Flow' },
  { code: 'MACRO', label: 'Macro Board' },
  { code: 'RISK', label: 'Risk Console' },
];

export const BLOOMBERG_FUNCTIONS: BloombergFunction[] = [
  { code: 'WEI', label: 'World Equity Indices', path: '/dashboard', desc: 'Cross-asset monitor' },
  { code: 'ECO', label: 'Economic Calendar', path: '/calendar', desc: 'Macro releases and events' },
  { code: 'TOP', label: 'Top News', path: '/news', desc: 'Headline wire and desk feed' },
  { code: 'NI', label: 'News Search', path: '/news', desc: 'Filtered intelligence flow' },
  { code: 'GP', label: 'General Price Chart', path: '/charts', desc: 'Technical charting view' },
  { code: 'PORT', label: 'Portfolio Monitor', path: '/portfolio', desc: 'Exposure and risk view' },
  { code: 'BMAP', label: 'Market Map', path: '/screener', desc: 'Relative movers and sectors' },
  { code: 'MOV', label: 'Top Movers', path: '/screener', desc: 'Volatility and trend leaders' },
  { code: 'BTMM', label: 'Money Markets', path: '/dashboard', desc: 'Rates and liquidity board' },
];

export const WORKSPACE_ALIASES: Record<string, WorkspaceFunction['code']> = {
  bmon: 'BMON',
  flow: 'FLOW',
  macro: 'MACRO',
  risk: 'RISK',
};

export const BLOOMBERG_ALIAS_TO_PATH: Record<string, string> = BLOOMBERG_FUNCTIONS.reduce(
  (acc, fn) => {
    acc[fn.code.toLowerCase()] = fn.path;
    return acc;
  },
  {} as Record<string, string>
);

export const SYMBOL_FUNCTIONS: SymbolFunctionIntent[] = [
  { aliases: ['GP', 'CHART', 'G', 'TRADE'], path: '/charts', label: 'CHART' },
  { aliases: ['NEWS', 'NW'], path: '/news', label: 'NEWS' },
  { aliases: ['RISK', 'PORT'], path: '/portfolio', label: 'RISK' },
  { aliases: ['OPT', 'OPTIONS'], path: '/tools/options', label: 'OPTIONS' },
  { aliases: ['FA', 'FIN', 'FINANCIALS'], path: '/tools', label: 'FINANCIALS' },
];

export function resolveRouteAlias(value: string): string | null {
  const normalized = value.toLowerCase();
  return ROUTE_ALIASES[normalized] ?? BLOOMBERG_ALIAS_TO_PATH[normalized] ?? null;
}

export function resolveWorkspaceAlias(value: string): WorkspaceFunction['code'] | null {
  return WORKSPACE_ALIASES[value.toLowerCase()] ?? null;
}

export function resolveSymbolFunction(alias: string): SymbolFunctionIntent | null {
  const normalized = alias.toUpperCase();
  return SYMBOL_FUNCTIONS.find((f) => f.aliases.includes(normalized)) ?? null;
}

export function resolveBloombergFunction(alias: string): BloombergFunction | null {
  const normalized = alias.toUpperCase();
  return BLOOMBERG_FUNCTIONS.find((f) => f.code === normalized) ?? null;
}

export function commandHints(): string[] {
  const routeHints = Object.keys(ROUTE_ALIASES).map((k) => `go ${k}`);
  const workspaceHints = WORKSPACE_FUNCTIONS.map((w) => `go ${w.code.toLowerCase()}`);
  const bloombergHints = BLOOMBERG_FUNCTIONS.map((f) => `go ${f.code.toLowerCase()}`);
  const symbolHints = ['AAPL GP', 'SPX500 GP', 'EURUSD NEWS', 'BTCUSD GP', 'NVDA OPT', 'TSLA FA'];
  return Array.from(new Set([...workspaceHints, ...bloombergHints, ...routeHints, ...symbolHints, 'help', 'clear']));
}

export function dispatchSymbol(symbol: string) {
  window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: symbol.toUpperCase() }));
}

export function dispatchWorkspace(name: WorkspaceFunction['code']) {
  window.dispatchEvent(new CustomEvent('vantage-workspace-preset', { detail: name }));
}

export function dispatchFunctionCode(code: string) {
  window.dispatchEvent(new CustomEvent('vantage-function-code', { detail: code.toUpperCase() }));
}
