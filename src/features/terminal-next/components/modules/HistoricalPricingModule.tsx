'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Daily', 'Intraday', 'Adjusted'];

export function HistoricalPricingModule() {
  const { state } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const buildRows = (subtab: string) => {
    if (subtab === 'Daily') {
      const latest = ref?.dailyBars[ref.dailyBars.length - 1];
      return [
        ['LastClose', latest ? `${latest.close}` : 'N/A'],
        ['Window', `${ref?.dailyBars.length ?? 0} sessions`],
        ['RealizedVol', `${state.risk.realizedVol}%`],
        ['ImpliedVol', `${state.risk.impliedVolProxy}%`],
      ];
    }
    if (subtab === 'Intraday') {
      const bars = state.barsBySymbol[state.activeSymbol] ?? [];
      const latest = bars[bars.length - 1];
      return [
        ['Open', latest ? `${latest.open.toFixed(2)}` : 'N/A'],
        ['High', latest ? `${latest.high.toFixed(2)}` : 'N/A'],
        ['Low', latest ? `${latest.low.toFixed(2)}` : 'N/A'],
        ['Close', latest ? `${latest.close.toFixed(2)}` : 'N/A'],
      ];
    }
    return [
      ['Adjustment', 'Split/dividend adjusted'],
      ['Method', 'Deterministic transform'],
      ['Beta', `${state.risk.beta}`],
      ['Correlation', `${state.risk.corrToBenchmark}`],
    ];
  };

  return <NestedModuleShell moduleCode="HP" title="HISTORICAL PRICING MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
