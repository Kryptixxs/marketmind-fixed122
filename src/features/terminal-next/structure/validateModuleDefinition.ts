import { TERMINAL_STRUCTURE_POLICY } from '../constants/layoutDensity';
import { TerminalBandKey, TerminalModuleDefinition, TerminalPanelDefinition } from '../types';

function trimmedPanels(key: TerminalBandKey, panels: TerminalPanelDefinition[]) {
  const cap = TERMINAL_STRUCTURE_POLICY.maxPanels[key];
  const sorted = [...panels].sort((a, b) => b.priority - a.priority);
  return sorted.slice(0, cap);
}

export function validateModuleDefinition(input: TerminalModuleDefinition): TerminalModuleDefinition {
  const decision = input.primaryDecision.trim();
  if (!decision) {
    throw new Error(`Module ${input.code} missing primary decision string`);
  }
  return {
    ...input,
    bands: {
      primary: {
        ...input.bands.primary,
        panels: trimmedPanels('primary', input.bands.primary.panels),
      },
      secondary: {
        ...input.bands.secondary,
        panels: trimmedPanels('secondary', input.bands.secondary.panels),
      },
      tertiary: {
        ...input.bands.tertiary,
        panels: trimmedPanels('tertiary', input.bands.tertiary.panels).map((p) =>
          p.type === 'HISTORICAL' || p.collapsible ? { ...p, collapsible: true, defaultCollapsed: true } : p,
        ),
      },
    },
  };
}
