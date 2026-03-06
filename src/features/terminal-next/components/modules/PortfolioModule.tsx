'use client';

import { useCallback } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Exposure', 'Risk', 'Concentration'];

export function PortfolioModule() {
  const { state } = useTerminalStore();
  const buildRows = useCallback(
    (subtab: string) => {
      if (subtab === 'Exposure') {
        return [
          ['Gross', `${state.risk.grossExposure}`],
          ['Net', `${state.risk.netExposure}`],
          ['Beta', `${state.risk.beta}`],
          ['Corr', `${state.risk.corrToBenchmark}`],
        ];
      }
      if (subtab === 'Risk') {
        return [
          ['Intraday VaR', `${state.risk.intradayVar}`],
          ['RealizedVol', `${state.risk.realizedVol}%`],
          ['ImpliedVol', `${state.risk.impliedVolProxy}%`],
          ['Regime', state.risk.regime],
        ];
      }
      return state.risk.exposureBySector.slice(0, 7).map((x) => [x.sector, `${x.value}`]);
    },
    [state.risk],
  );

  return <NestedModuleShell moduleCode="PORT" title="PORTFOLIO MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
