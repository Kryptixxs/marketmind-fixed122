import { ExecutionContextInput, MacroExecutionState, ModuleDataModel, RiskBias } from '../../types';

function parseNumber(value: string | undefined, fallback = 0): number {
  if (!value) return fallback;
  const cleaned = value.replace(/[^\d.+-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tableValue(model: ModuleDataModel, section: string, key: string): string | undefined {
  return model.table[section]?.find((row) => row.key === key)?.value;
}

function computeRiskBias(input: {
  regimeState: ExecutionContextInput['regimeState'];
  riskOnScore: number;
  volatilityAlert: boolean;
  liquidityStress: boolean;
}): RiskBias {
  if (input.regimeState === 'RISK_OFF' || input.liquidityStress || input.volatilityAlert) return 'REDUCE';
  if (input.regimeState === 'RISK_ON' && input.riskOnScore > 0.35) return 'ADD';
  return 'HEDGE';
}

export function buildExecutionContextFromMarket(model: ModuleDataModel): ExecutionContextInput {
  const regimeRaw = (tableValue(model, 'regimeSnapshot', 'Regime') ?? 'TRANSITION').toUpperCase();
  const regimeState: ExecutionContextInput['regimeState'] =
    regimeRaw.includes('RISK ON') ? 'RISK_ON' : regimeRaw.includes('RISK OFF') ? 'RISK_OFF' : 'TRANSITION';
  const riskOnScore = parseNumber(tableValue(model, 'regimeSnapshot', 'RiskOnScore'));
  const volatilityAlert = (tableValue(model, 'flowPositioning', 'VolExpansionAlert') ?? 'OFF').includes('ON');
  const liquidityStress = (tableValue(model, 'flowPositioning', 'LiquidityStress') ?? 'OFF').includes('ON');
  const breadthDeterioration = (tableValue(model, 'flowPositioning', 'BreadthDeterioration') ?? 'OFF').includes('ON');

  const throttleBase = regimeState === 'RISK_OFF' ? 0.82 : regimeState === 'TRANSITION' ? 0.92 : 1;
  const throttleLevel = Math.max(0.7, Math.min(1.08, throttleBase - (liquidityStress ? 0.08 : 0) - (volatilityAlert ? 0.05 : 0)));
  const participationCap = Math.max(0.08, Math.min(0.32, (regimeState === 'RISK_ON' ? 0.22 : regimeState === 'TRANSITION' ? 0.18 : 0.12) - (liquidityStress ? 0.02 : 0)));
  const urgencyModifier = Math.max(0.7, Math.min(1.2, (regimeState === 'RISK_ON' ? 1.03 : regimeState === 'TRANSITION' ? 0.96 : 0.88) - (volatilityAlert ? 0.08 : 0)));
  const riskBias = computeRiskBias({ regimeState, riskOnScore, volatilityAlert, liquidityStress });

  return {
    regimeState,
    riskBias,
    urgencyModifier,
    participationCap,
    throttleLevel,
    riskOnScore,
    volatilityAlert,
    liquidityStress,
    breadthDeterioration,
  };
}

export function toMacroExecutionState(input: ExecutionContextInput): MacroExecutionState {
  return {
    regimeState: input.regimeState,
    riskBias: input.riskBias,
    urgencyModifier: input.urgencyModifier,
    participationCap: input.participationCap,
    throttleLevel: input.throttleLevel,
  };
}
