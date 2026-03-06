import { FunctionModuleDefinition } from './moduleTypes';

export const desModule: FunctionModuleDefinition = {
  code: 'DES',
  title: 'Description',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ risk }) => [
    ['Sector', 'Technology'],
    ['MktCap', '$3.1T'],
    ['52W', '144.8 - 213.2'],
    ['Beta', `${risk.beta.toFixed(2)}`],
    ['Regime', risk.regime],
  ],
};
