'use client';

import { useCallback } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { NestedModuleShell } from './NestedModuleShell';

const SUBTABS = ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Estimates'];

export function FinancialAnalysisModule() {
  const { state } = useTerminalStore();
  const buildRows = useCallback(
    (subtab: string) => {
      if (subtab === 'Income Statement') return [['Revenue', '$389.5B'], ['OpIncome', '$119.4B'], ['NetIncome', '$96.8B'], ['Margin', '30.3%']];
      if (subtab === 'Balance Sheet') return [['Assets', '$352.5B'], ['Liabilities', '$291.4B'], ['Equity', '$61.1B'], ['Leverage', '1.9x']];
      if (subtab === 'Cash Flow') return [['OCF', '$121.3B'], ['CapEx', '$10.9B'], ['FCF', '$110.4B'], ['FCFYield', '3.6%']];
      return [
        ['NextQ EPS', '6.23'],
        ['NextQ Rev', '$96.5B'],
        ['Revision', state.microstructure.orderFlowImbalance >= 0 ? 'UP' : 'DOWN'],
        ['Confidence', `${Math.round(55 + Math.abs(state.microstructure.orderFlowImbalance) * 100)}%`],
      ];
    },
    [state.microstructure.orderFlowImbalance],
  );

  return <NestedModuleShell moduleCode="FA" title="FINANCIAL ANALYSIS MODULE" subtabs={SUBTABS} buildRows={buildRows} />;
}
