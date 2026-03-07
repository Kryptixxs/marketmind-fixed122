import { FunctionModuleDefinition } from './moduleTypes';

export const calModule: FunctionModuleDefinition = {
  code: 'CAL',
  title: 'Calendar',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ state }) => [
    ['Earnings', state.referenceBySymbol[state.activeSymbol]?.earningsDates?.[0] ?? 'N/A'],
    ['Focus', state.activeSymbol],
  ],
};
