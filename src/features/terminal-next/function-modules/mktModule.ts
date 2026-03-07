import { FunctionModuleDefinition } from './moduleTypes';

export const mktModule: FunctionModuleDefinition = {
  code: 'MKT',
  title: 'Market',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ state }) => [
    ['Advance', `${state.quotes.filter((q) => q.pct >= 0).length}`],
    ['Decline', `${state.quotes.filter((q) => q.pct < 0).length}`],
    ['Focus', state.activeSymbol],
  ],
};
