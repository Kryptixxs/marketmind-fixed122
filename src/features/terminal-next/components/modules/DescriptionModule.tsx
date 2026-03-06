'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Overview', 'Capital Structure', 'Ratings', 'Corporate Actions'];

export function DescriptionModule() {
  const { state } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const buildRows = (subtab: string) => {
    if (subtab === 'Overview') {
      return [
        ['Sector', ref?.sector ?? 'N/A'],
        ['Industry', ref?.industry ?? 'N/A'],
        ['Country', ref?.country ?? 'N/A'],
        ['Exchange', ref?.exchange ?? 'N/A'],
        ['MarketCap', `${ref?.marketCapBn ?? 0} Bn`],
        ['Float', `${ref?.floatBn ?? 0} Bn`],
      ];
    }
    if (subtab === 'Capital Structure') {
      return [
        ['DebtTier', 'Senior Unsecured'],
        ['Leverage', '1.8x'],
        ['DebtMaturity', '4.2Y'],
        ['Coverage', '12.4x'],
        ['Refreshed', new Date(state.tickMs).toISOString().slice(11, 19)],
      ];
    }
    if (subtab === 'Ratings') {
      return [
        ['S&P', ref?.ratings.sp ?? 'N/A'],
        ['Moody`s', ref?.ratings.moodys ?? 'N/A'],
        ['Fitch', ref?.ratings.fitch ?? 'N/A'],
        ['Regime', state.risk.regime],
      ];
    }
    return [
      ['NextEarnings', ref?.earningsDates[0] ?? 'N/A'],
      ['Next2Earnings', ref?.earningsDates[1] ?? 'N/A'],
      ['ActionWindow', 'Deterministic simulation'],
      ['Clock', new Date(state.tickMs).toISOString().slice(11, 19)],
    ];
  };

  return <NestedModuleShell moduleCode="DES" title="DESCRIPTION MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
