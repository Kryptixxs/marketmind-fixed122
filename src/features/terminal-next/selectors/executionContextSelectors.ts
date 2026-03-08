import { OverrideReason, TerminalState } from '../types';

export type ExecutionMode = 'MACRO_CONTROLLED' | 'MANUAL_OVERRIDE';

export type ExecutionPolicy = {
  mode: ExecutionMode;
  symbol: string;
  urgencyMultiplier: number;
  participationRate: number;
  routingAggressiveness: number;
  maxNotional: number;
  maxSlippageBps: number;
  killSwitch: boolean;
  reasonCode?: OverrideReason;
  expiresAt?: number;
};

const HARD_GUARDRAILS = {
  maxNotional: 3_000_000,
  maxSlippageBps: 35,
} as const;

export function getActiveSymbolOverride(state: TerminalState) {
  return state.executionControls.symbolOverrides[state.activeSymbol];
}

export function getExecutionMode(state: TerminalState): ExecutionMode {
  const activeOverride = getActiveSymbolOverride(state);
  return activeOverride?.isActive ? 'MANUAL_OVERRIDE' : 'MACRO_CONTROLLED';
}

export function selectExecutionPolicy(state: TerminalState): ExecutionPolicy {
  const mode = getExecutionMode(state);
  const macro = state.executionControls.macro;
  const override = getActiveSymbolOverride(state);
  const urgencyMultiplier =
    mode === 'MANUAL_OVERRIDE'
      ? Math.min(1.35, macro.urgencyModifier * 1.18)
      : macro.urgencyModifier;
  const participationRate =
    mode === 'MANUAL_OVERRIDE'
      ? Math.min(0.42, macro.participationCap * 1.35)
      : macro.participationCap;
  const routingAggressiveness =
    mode === 'MANUAL_OVERRIDE'
      ? Math.min(1.2, 1 + (1 - macro.throttleLevel) * 0.2)
      : Math.max(0.8, macro.throttleLevel);
  const killSwitch = state.risk.intradayVar > 2_500_000 || state.risk.concentration > 65;
  return {
    mode,
    symbol: state.activeSymbol,
    urgencyMultiplier,
    participationRate,
    routingAggressiveness,
    maxNotional: HARD_GUARDRAILS.maxNotional,
    maxSlippageBps: HARD_GUARDRAILS.maxSlippageBps,
    killSwitch,
    reasonCode: override?.reasonCode,
    expiresAt: override?.expiresAt,
  };
}
