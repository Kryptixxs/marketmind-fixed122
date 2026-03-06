'use client';

import { useCallback } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Skew', 'Surface', 'Greeks'];

export function OptionsAnalyticsModule() {
  const { state } = useTerminalStore();
  const buildRows = useCallback(
    (subtab: string) => {
      if (subtab === 'Skew') return [['25D RR', '1.8'], ['25D BF', '0.7'], ['IVx', `${state.risk.impliedVolProxy}%`], ['Mode', 'Scaffold']];
      if (subtab === 'Surface') return [['Tenors', '1W/1M/3M'], ['Smile', 'Deterministic'], ['Status', 'Deferred track B'], ['Clock', new Date(state.tickMs).toISOString().slice(11, 19)]];
      return [['Delta', '0.42'], ['Gamma', '0.08'], ['Vega', '0.21'], ['Theta', '-0.03']];
    },
    [state.risk.impliedVolProxy, state.tickMs],
  );

  return <NestedModuleShell moduleCode="OVME" title="OPTIONS ANALYTICS MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
