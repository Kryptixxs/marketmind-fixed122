import { FunctionModuleDefinition } from './moduleTypes';

export const newsModule: FunctionModuleDefinition = {
  code: 'NEWS',
  title: 'News',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ state }) => [
    ['Headlines', `${state.headlines.length}`],
    ['System', `${state.systemFeed.length}`],
    ['Focus', state.activeSymbol],
  ],
};
