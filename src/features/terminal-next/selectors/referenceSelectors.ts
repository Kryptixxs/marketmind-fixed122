import { ReferenceSecurityProfile, TerminalState } from '../types';

export function selectActiveReferenceProfile(state: TerminalState): ReferenceSecurityProfile | null {
  return state.referenceBySymbol[state.activeSymbol] ?? null;
}
