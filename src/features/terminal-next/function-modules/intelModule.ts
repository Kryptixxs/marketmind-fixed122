import { FunctionModuleDefinition } from './moduleTypes';

export const intelModule: FunctionModuleDefinition = {
  code: 'INTEL',
  title: 'Intelligence',
  track: 'B',
  latencyBudgetMs: 5,
  isDeferred: true,
  getRows: ({ risk, micro }) => [
    ['Entity', 'Overview'],
    ['Relationships', 'Supply Chain'],
    ['OFI', `${(micro.orderFlowImbalance * 100).toFixed(1)}%`],
    ['Regime', risk.regime],
    ['VaR', risk.intradayVar.toFixed(0)],
    ['Beta', risk.beta.toFixed(2)],
  ],
};
