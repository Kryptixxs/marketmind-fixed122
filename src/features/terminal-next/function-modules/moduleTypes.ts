import { FunctionCode, MicrostructureStats, RiskSnapshot, TerminalState } from '../types';

export type FunctionModuleContext = {
  state: TerminalState;
  risk: RiskSnapshot;
  micro: MicrostructureStats;
};

export type FunctionModuleDefinition = {
  code: FunctionCode;
  title: string;
  track: 'A' | 'B';
  latencyBudgetMs: number;
  isDeferred: boolean;
  getRows: (ctx: FunctionModuleContext) => Array<[string, string]>;
};
