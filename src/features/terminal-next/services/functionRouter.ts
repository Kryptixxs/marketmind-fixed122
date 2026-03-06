import { FUNCTION_MODULES } from '../function-modules';
import { FunctionModuleContext, FunctionModuleDefinition } from '../function-modules/moduleTypes';
import { FunctionCode } from '../types';

const FALLBACK: FunctionModuleDefinition = {
  code: 'EXEC',
  title: 'Fallback',
  track: 'A',
  latencyBudgetMs: 3,
  isDeferred: false,
  getRows: () => [['Status', 'No module mapped']],
};

export function resolveFunctionModule(code: FunctionCode): FunctionModuleDefinition {
  return FUNCTION_MODULES.find((m) => m.code === code) ?? FALLBACK;
}

export function resolveFunctionDeck(code: FunctionCode, ctx: FunctionModuleContext): Array<[string, string]> {
  const moduleDef = resolveFunctionModule(code);
  return moduleDef.getRows(ctx);
}
