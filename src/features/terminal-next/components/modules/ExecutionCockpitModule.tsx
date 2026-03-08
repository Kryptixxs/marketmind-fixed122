'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { BlotterPanel } from '../BlotterPanel';
import { CrossAssetMatrixPanel } from '../CrossAssetMatrixPanel';
import { ExecCenterStack } from '../ExecCenterStack';
import { FeedPanel } from '../FeedPanel';
import { MonitorPanel } from '../MonitorPanel';
import { RightRailPanel } from '../RightRailPanel';
import { SystemPulsePanel } from '../SystemPulsePanel';

const EXEC_TABS = ['PRIMARY', 'MICROSTRUCTURE', 'FACTORS', 'EVENTS', 'ESC'] as const;
type ExecTab = (typeof EXEC_TABS)[number];

export function ExecutionCockpitModule() {
  const { state, dispatch } = useTerminalStore();
  const selected: ExecTab = state.activeSubTab && EXEC_TABS.includes(state.activeSubTab as ExecTab) ? (state.activeSubTab as ExecTab) : 'PRIMARY';
  const activeOverride = state.executionControls.symbolOverrides[state.activeSymbol];
  const ttlMs = activeOverride?.isActive ? Math.max(0, activeOverride.expiresAt - state.tickMs) : 0;
  const ttlLabel = `${Math.floor(ttlMs / 60_000)
    .toString()
    .padStart(2, '0')}:${Math.floor((ttlMs % 60_000) / 1000)
    .toString()
    .padStart(2, '0')}`;
  const modeStripClass =
    selected === 'MICROSTRUCTURE'
      ? 'border-[#1a1a1a] bg-[#0a0a0a]'
      : selected === 'FACTORS'
        ? 'border-green-600/50 bg-[#0a0a0a]'
        : selected === 'EVENTS'
          ? 'border-red-600/50 bg-[#0a0a0a]'
          : selected === 'ESC'
            ? 'border-[#1a5f4b] bg-[#0a0a0a]'
          : 'border-[#1a1a1a] bg-[#0a0a0a]';

  const activate = (tab: ExecTab) => {
    dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: tab });
    if (tab === 'FACTORS') dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'FACTORS' });
    if (tab === 'EVENTS') {
      dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'EVENTS' });
      dispatch({ type: 'SET_FEED_TAB', payload: 'SYSTEM' });
      dispatch({ type: 'SET_RIGHT_TAB', payload: 'TAPE' });
    }
    if (tab === 'ESC') {
      dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'FACTORS' });
      dispatch({ type: 'SET_FEED_TAB', payload: 'SYSTEM' });
      dispatch({ type: 'SET_RIGHT_TAB', payload: 'ALERTS' });
    }
    if (tab === 'PRIMARY') {
      dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'OVERVIEW' });
      dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' });
      dispatch({ type: 'SET_RIGHT_TAB', payload: 'DEPTH' });
    }
    if (tab === 'MICROSTRUCTURE') {
      dispatch({ type: 'SET_RIGHT_TAB', payload: 'DEPTH' });
    }
  };

  return (
    <div className="flex-1 w-full min-w-0 min-h-0 flex flex-col font-mono tracking-tight uppercase">
      <div className={`h-[14px] px-[2px] border-y ${modeStripClass} flex items-center gap-[2px] text-[8px]`}>
        <span className="text-[#f4cf76] font-bold mr-[2px]">EXEC SUBMODULE</span>
        {EXEC_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => activate(tab)}
            className={`px-[2px] border text-[7px] leading-none ${selected === tab ? 'border-[#95ca2d] bg-[#2b3a07] text-[#efffc7]' : 'border-[#4f3a18] bg-[#18130a] text-[#d8be8d]'}`}
          >
            {tab}
          </button>
        ))}
        <div className={`ml-auto px-[2px] border text-[7px] leading-none ${activeOverride?.isActive ? 'border-[#7c5f16] bg-[#251d0b] text-[#ffd57d]' : 'border-[#1a5f4b] bg-[#0d2118] text-[#99f1d6]'}`}>
          {activeOverride?.isActive ? `MACRO OVERRIDE ${activeOverride.reasonCode} TTL ${ttlLabel}` : `MACRO CONTROLLED ${state.executionControls.macro.regimeState}`}
        </div>
        {activeOverride?.isActive ? (
          <button
            onClick={() => dispatch({ type: 'CANCEL_SYMBOL_OVERRIDE', payload: { symbol: state.activeSymbol, initiatedBy: 'TRADER_DESK' } })}
            className="px-[2px] border border-[#61324a] bg-[#2a1220] text-[#ffb4d0] text-[7px] leading-none"
          >
            CANCEL OVR
          </button>
        ) : (
          <button
            onClick={() =>
              dispatch({
                type: 'ACTIVATE_SYMBOL_OVERRIDE',
                payload: {
                  symbol: state.activeSymbol,
                  reasonCode: 'LIQUIDITY_WINDOW',
                  ttlMs: 10 * 60_000,
                  initiatedBy: 'TRADER_DESK',
                },
              })}
            className="px-[2px] border border-[#7c5f16] bg-[#251d0b] text-[#ffd57d] text-[7px] leading-none"
          >
            OVR 10M
          </button>
        )}
      </div>
      <div key={`exec-${selected.toLowerCase()}`} className="flex-1 min-h-0 flex gap-px bg-black">
        <aside className="flex-[1.1] min-w-0 min-h-0 flex flex-col gap-px">
          <div className="flex-1 min-h-0">
            <MonitorPanel />
          </div>
          <div className="flex-1 min-h-0">
            <CrossAssetMatrixPanel />
          </div>
        </aside>
        <div className="flex-[2.2] min-w-0 min-h-0 flex flex-col">
          <ExecCenterStack execMode={selected} />
        </div>
        <aside className="flex-[1.7] min-w-0 min-h-0 flex flex-col gap-px">
          <div className="flex-[1.3] min-h-0">
            <RightRailPanel execMode={selected} />
          </div>
          <div className="flex-1 min-h-0">
            <FeedPanel execMode={selected} />
          </div>
          <div className="flex-1 min-h-0">
            <BlotterPanel />
          </div>
          <div className="flex-1 min-h-0">
            <SystemPulsePanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
