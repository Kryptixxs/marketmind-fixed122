import { FunctionModuleDefinition } from './moduleTypes';

export const execModule: FunctionModuleDefinition = {
  code: 'EXEC',
  title: 'Execution Cockpit',
  track: 'A',
  latencyBudgetMs: 2,
  isDeferred: false,
  getRows: ({ risk, micro }) => [
    ['Mode', 'Execution Fast Path'],
    ['VaR', `${risk.intradayVar}`],
    ['Gross', `${risk.grossExposure}`],
    ['Spread', `${micro.insideSpreadBps}bp`],
    ['OFI', `${(micro.orderFlowImbalance * 100).toFixed(1)}%`],
  ],
};
