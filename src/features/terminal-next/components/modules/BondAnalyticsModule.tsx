'use client';

import { useCallback } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Yield', 'Duration', 'Spread'];

export function BondAnalyticsModule() {
  const { state } = useTerminalStore();
  const buildRows = useCallback(
    (subtab: string) => {
      if (subtab === 'Yield') return [['YTM', '4.86%'], ['YTW', '4.91%'], ['CurveNode', '10Y'], ['Regime', state.risk.regime]];
      if (subtab === 'Duration') return [['Duration', '7.18'], ['Convexity', '0.90'], ['DV01', '$18.3k'], ['Beta', `${state.risk.beta}`]];
      return [['OAS', '186 bps'], ['ZSpread', '172 bps'], ['InsideSpread', `${state.microstructure.insideSpreadBps}bp`], ['Sweep', state.microstructure.sweep.text]];
    },
    [state.microstructure.insideSpreadBps, state.microstructure.sweep.text, state.risk.beta, state.risk.regime],
  );

  return <NestedModuleShell moduleCode="YAS" title="BOND ANALYTICS MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
