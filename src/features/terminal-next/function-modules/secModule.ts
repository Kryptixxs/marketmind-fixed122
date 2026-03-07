import { FunctionModuleDefinition } from './moduleTypes';

export const secModule: FunctionModuleDefinition = {
  code: 'SEC',
  title: 'SEC Filings',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ state }) => [
    ['10-K', 'Annual'],
    ['10-Q', 'Quarterly'],
    ['8-K', 'Current'],
    ['Focus', state.activeSymbol],
  ],
};
