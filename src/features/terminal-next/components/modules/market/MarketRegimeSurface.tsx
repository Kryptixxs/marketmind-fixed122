'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../../../store/TerminalStore';
import { buildMarketDataModel } from '../../../modules/market/buildMarketDataModel';
import { DriverAnalysisBand } from './bands/DriverAnalysisBand';
import { FlowPositioningBand } from './bands/FlowPositioningBand';
import { RegimeSnapshotBand } from './bands/RegimeSnapshotBand';
import { MarketDeepDetailPanel } from './MarketDeepDetailPanel';
import { TerminalModuleFrame } from '../../structure/TerminalModuleFrame';
import { TerminalModuleDefinition } from '../../../types';

export function MarketRegimeSurface() {
  const { state, dispatch } = useTerminalStore();
  const model = useMemo(() => buildMarketDataModel(state), [state]);
  const activeBand = state.marketUi?.activeBand ?? 'REGIME';
  const expanded = state.marketUi?.deepDetailExpanded ?? false;
  const primaryDecision = model.table.regimeSnapshot.find((r) => r.key === 'Regime')?.value ?? 'TRANSITION';

  const definition: TerminalModuleDefinition = {
    code: 'MKT',
    primaryDecision: `SHOULD I ADD/REDUCE/HEDGE? ${primaryDecision}`,
    bands: {
      primary: {
        key: 'primary',
        panels: [
          {
            id: 'mkt-regime',
            type: 'VERDICT',
            question: 'Is risk supported right now?',
            priority: 100,
            content: (
              <div className="h-full min-h-0">
                <RegimeSnapshotBand rows={model.table.regimeSnapshot} chart={model.charts.regimeSnapshot} active={activeBand === 'REGIME'} />
              </div>
            ),
          },
        ],
      },
      secondary: {
        key: 'secondary',
        panels: [
          {
            id: 'mkt-drivers',
            type: 'DIAGNOSTIC',
            question: 'What confirms or contradicts regime?',
            priority: 90,
            content: (
              <div className="h-full min-h-0">
                <DriverAnalysisBand rows={model.table.driverAnalysis} chart={model.charts.driverAnalysis} active={activeBand === 'DRIVERS'} />
              </div>
            ),
          },
        ],
      },
      tertiary: {
        key: 'tertiary',
        panels: [
          {
            id: 'mkt-flow',
            type: 'FLOW',
            question: 'Where is positioning vulnerable?',
            priority: 80,
            content: (
              <div className="h-full min-h-0">
                <FlowPositioningBand rows={model.table.flowPositioning} chart={model.charts.flowPositioning} active={activeBand === 'FLOW'} />
              </div>
            ),
          },
          {
            id: 'mkt-deep',
            type: 'HISTORICAL',
            question: 'Deep detail and historical stress context',
            priority: 40,
            collapsible: true,
            defaultCollapsed: !expanded,
            content: <MarketDeepDetailPanel expanded rows={model.table.deepDetail} chart={model.charts.deepDetail} />,
          },
        ],
      },
    },
  };

  return (
    <div className="flex-1 w-full min-w-0 min-h-0 flex flex-col gap-px">
      <div className="h-[12px] px-[2px] border border-[#111] bg-[#0a0a0a] text-[7px] flex items-center justify-end gap-[2px]">
        <button
          onClick={() => dispatch({ type: 'SET_MARKET_ACTIVE_BAND', payload: 'REGIME' })}
          className={`px-[2px] border ${activeBand === 'REGIME' ? 'border-green-600 text-green-400 bg-[#0d1f0d]' : 'border-[#262626] text-gray-400 bg-[#0a0a0a]'}`}
        >
          1 REGIME
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_MARKET_ACTIVE_BAND', payload: 'DRIVERS' })}
          className={`px-[2px] border ${activeBand === 'DRIVERS' ? 'border-green-600 text-green-400 bg-[#0d1f0d]' : 'border-[#262626] text-gray-400 bg-[#0a0a0a]'}`}
        >
          2 DRIVERS
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_MARKET_ACTIVE_BAND', payload: 'FLOW' })}
          className={`px-[2px] border ${activeBand === 'FLOW' ? 'border-green-600 text-green-400 bg-[#0d1f0d]' : 'border-[#262626] text-gray-400 bg-[#0a0a0a]'}`}
        >
          3 FLOW
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MARKET_DEEP_DETAIL' })}
          className={`px-[2px] border ${expanded ? 'border-yellow-600 text-yellow-300 bg-[#271f09]' : 'border-[#262626] text-gray-400 bg-[#0a0a0a]'}`}
        >
          D DEEP {expanded ? 'ON' : 'OFF'}
        </button>
      </div>
      <TerminalModuleFrame definition={definition} />
    </div>
  );
}
