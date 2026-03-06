'use client';

import { useCallback } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Earnings Calendar', 'Surprise', 'Guidance'];

export function EarningsModule() {
  const { state } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const buildRows = useCallback(
    (subtab: string) => {
      if (subtab === 'Earnings Calendar') {
        return [
          ['T+1', ref?.earningsDates[0] ?? 'N/A'],
          ['T+2', ref?.earningsDates[1] ?? 'N/A'],
          ['DeskFocus', state.activeSymbol],
          ['Regime', state.risk.regime],
        ];
      }
      if (subtab === 'Surprise') {
        return [
          ['EPS Surprise', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`],
          ['Revenue Surprise', `${(state.microstructure.imbalance * 100).toFixed(1)}%`],
          ['Signal', state.microstructure.orderFlowImbalance >= 0 ? 'POSITIVE' : 'NEGATIVE'],
        ];
      }
      return [['Guidance Tone', 'Neutral-Positive'], ['Revision Dispersion', 'Medium'], ['Uncertainty', `${state.risk.impliedVolProxy}%`]];
    },
    [ref?.earningsDates, state.activeSymbol, state.microstructure.imbalance, state.microstructure.orderFlowImbalance, state.risk.impliedVolProxy, state.risk.regime],
  );

  return <NestedModuleShell moduleCode="WEI" title="EARNINGS MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
