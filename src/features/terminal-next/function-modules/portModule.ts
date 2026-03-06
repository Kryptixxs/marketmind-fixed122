import { FunctionModuleDefinition } from './moduleTypes';

export const portModule: FunctionModuleDefinition = {
  code: 'PORT',
  title: 'Portfolio',
  track: 'B',
  latencyBudgetMs: 8,
  isDeferred: true,
  getRows: ({ risk }) => [
    ['Track', 'Deferred (Phase B)'],
    ['Gate', 'Cockpit acceptance pending'],
    ['Gross', `${risk.grossExposure}`],
    ['Net', `${risk.netExposure}`],
    ['Status', 'Scaffold only'],
  ],
};
