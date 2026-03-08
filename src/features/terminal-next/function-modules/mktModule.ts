import { FunctionModuleDefinition } from './moduleTypes';
import { buildMarketDataModel } from '../modules/market/buildMarketDataModel';

export const mktModule: FunctionModuleDefinition = {
  code: 'MKT',
  title: 'Market',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: ({ state }) => {
    const model = buildMarketDataModel(state);
    const rows = model.table.regimeSnapshot.slice(0, 4);
    return rows.map((row) => [row.key, row.value]);
  },
};
