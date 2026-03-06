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

export const WORKSPACE_ALIASES: Record<string, WorkspaceFunction['code']> = {
  bmon: 'BMON',
  flow: 'FLOW',
  macro: 'MACRO',
  risk: 'RISK',
};

export const SYMBOL_FUNCTIONS: SymbolFunctionIntent[] = [
  { aliases: ['GP', 'CHART', 'G', 'TRADE'], path: '/charts', label: 'CHART' },
  { aliases: ['NEWS', 'NW'], path: '/news', label: 'NEWS' },
  { aliases: ['RISK', 'PORT'], path: '/portfolio', label: 'RISK' },
  { aliases: ['OPT', 'OPTIONS'], path: '/tools/options', label: 'OPTIONS' },
  { aliases: ['FA', 'FIN', 'FINANCIALS'], path: '/tools', label: 'FINANCIALS' },
];

export function resolveRouteAlias(value: string): string | null {
  return ROUTE_ALIASES[value.toLowerCase()] ?? null;
}

export function resolveWorkspaceAlias(value: string): WorkspaceFunction['code'] | null {
  return WORKSPACE_ALIASES[value.toLowerCase()] ?? null;
}

export function resolveSymbolFunction(alias: string): SymbolFunctionIntent | null {
  const normalized = alias.toUpperCase();
  return SYMBOL_FUNCTIONS.find((f) => f.aliases.includes(normalized)) ?? null;
}

export function dispatchSymbol(symbol: string) {
  window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: symbol.toUpperCase() }));
}

export function dispatchWorkspace(name: WorkspaceFunction['code']) {
  window.dispatchEvent(new CustomEvent('vantage-workspace-preset', { detail: name }));
}
