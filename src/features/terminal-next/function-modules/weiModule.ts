import { FunctionModuleDefinition } from './moduleTypes';

export const weiModule: FunctionModuleDefinition = {
  code: 'WEI',
  title: 'World Equity Indices',
  track: 'A',
  latencyBudgetMs: 4,
  isDeferred: false,
  getRows: ({ risk, micro }) => [
    ['RV', `${risk.realizedVol}%`],
    ['IVx', `${risk.impliedVolProxy}%`],
    ['Corr', `${risk.corrToBenchmark}`],
    ['Spread', `${micro.insideSpreadBps}bp`],
    ['OFI', `${(micro.orderFlowImbalance * 100).toFixed(1)}%`],
  ],
};
