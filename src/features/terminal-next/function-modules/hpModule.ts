import { FunctionModuleDefinition } from './moduleTypes';

export const hpModule: FunctionModuleDefinition = {
  code: 'HP',
  title: 'Headline Panel',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ state }) => [
    ['Headline', state.headlines[0] ?? 'No headline'],
    ['Sentiment', 'Constructive'],
    ['Catalyst', 'Macro data'],
    ['Impact', 'Moderate'],
    ['DeskFocus', state.activeSymbol],
  ],
};
