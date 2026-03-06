import { FunctionModuleDefinition } from './moduleTypes';

export const faModule: FunctionModuleDefinition = {
  code: 'FA',
  title: 'Fundamental Analysis',
  track: 'A',
  latencyBudgetMs: 4,
  isDeferred: false,
  getRows: () => [
    ['GrossMgn', '45.6%'],
    ['OpMgn', '30.3%'],
    ['ROE', '152.7%'],
    ['Debt/EBITDA', '1.8x'],
    ['FCFYield', '3.6%'],
  ],
};
