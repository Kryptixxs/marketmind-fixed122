import { FunctionModuleDefinition } from './moduleTypes';

export const yasModule: FunctionModuleDefinition = {
  code: 'YAS',
  title: 'Yield Analysis',
  track: 'A',
  latencyBudgetMs: 4,
  isDeferred: false,
  getRows: ({ micro }) => [
    ['YTW', '4.91%'],
    ['Duration', '7.18'],
    ['Convexity', '0.90'],
    ['Spread', `${micro.insideSpreadBps}bp`],
    ['Sweep', micro.sweep.text],
  ],
};
