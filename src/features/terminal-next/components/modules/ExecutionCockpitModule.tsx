'use client';

import { useTerminalStore } from '../../store/TerminalStore';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { BlotterPanel } from '../BlotterPanel';
import { CrossAssetMatrixPanel } from '../CrossAssetMatrixPanel';
import { FeedPanel } from '../FeedPanel';
import { MonitorPanel } from '../MonitorPanel';
import { RightRailPanel } from '../RightRailPanel';
import { SystemPulsePanel } from '../SystemPulsePanel';

const EXEC_TABS = ['PRIMARY', 'MICROSTRUCTURE', 'FACTORS', 'EVENTS', 'ESC'] as const;
type ExecTab = (typeof EXEC_TABS)[number];

export function ExecutionCockpitModule() {
  const { state, dispatch } = useTerminalStore();
  const selected: ExecTab = state.activeSubTab && EXEC_TABS.includes(state.activeSubTab as ExecTab) ? (state.activeSubTab as ExecTab) : 'PRIMARY';
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
    <div className="flex-1 min-h-0 flex flex-col">
      <div className={`h-5 px-1 border-y ${modeStripClass} flex items-center gap-1 text-[9px]`}>
        <span className="text-[#f4cf76] font-bold mr-1">EXEC SUBMODULE</span>
        {EXEC_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => activate(tab)}
            className={`px-1 border ${selected === tab ? 'border-[#95ca2d] bg-[#2b3a07] text-[#efffc7]' : 'border-[#4f3a18] bg-[#18130a] text-[#d8be8d]'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {selected === 'PRIMARY' && (
        <div key="exec-primary" className="flex-1 min-h-0 grid grid-cols-[22%_44%_34%] grid-rows-[minmax(0,0.48fr)_minmax(0,0.32fr)_minmax(0,0.2fr)] gap-px bg-black">
          <MonitorPanel />
          <AnalyticsPanel execMode="PRIMARY" />
          <RightRailPanel execMode="PRIMARY" />
          <CrossAssetMatrixPanel />
          <FeedPanel execMode="PRIMARY" />
          <BlotterPanel />
          <div className="col-span-3 min-h-0">
            <SystemPulsePanel />
          </div>
        </div>
      )}
      {selected === 'MICROSTRUCTURE' && (
        <div key="exec-microstructure" className="flex-1 min-h-0 grid grid-cols-[18%_32%_50%] grid-rows-[minmax(0,0.5fr)_minmax(0,0.3fr)_minmax(0,0.2fr)] gap-px bg-black">
          <MonitorPanel />
          <AnalyticsPanel execMode="MICROSTRUCTURE" />
          <div className="row-span-2 min-h-0">
            <RightRailPanel execMode="MICROSTRUCTURE" />
          </div>
          <CrossAssetMatrixPanel />
          <BlotterPanel />
          <div className="col-span-2 min-h-0">
            <FeedPanel execMode="MICROSTRUCTURE" />
          </div>
          <SystemPulsePanel />
        </div>
      )}
      {selected === 'FACTORS' && (
        <div key="exec-factors" className="flex-1 min-h-0 grid grid-cols-[20%_55%_25%] grid-rows-[minmax(0,0.45fr)_minmax(0,0.34fr)_minmax(0,0.21fr)] gap-px bg-black">
          <MonitorPanel />
          <div className="row-span-2 min-h-0">
            <AnalyticsPanel execMode="FACTORS" />
          </div>
          <RightRailPanel execMode="FACTORS" />
          <CrossAssetMatrixPanel />
          <BlotterPanel />
          <div className="col-span-2 min-h-0">
            <FeedPanel execMode="FACTORS" />
          </div>
          <SystemPulsePanel />
        </div>
      )}
      {selected === 'EVENTS' && (
        <div key="exec-events" className="flex-1 min-h-0 grid grid-cols-[20%_30%_50%] grid-rows-[minmax(0,0.42fr)_minmax(0,0.36fr)_minmax(0,0.22fr)] gap-px bg-black">
          <MonitorPanel />
          <AnalyticsPanel execMode="EVENTS" />
          <div className="row-span-2 min-h-0">
            <FeedPanel execMode="EVENTS" />
          </div>
          <CrossAssetMatrixPanel />
          <RightRailPanel execMode="EVENTS" />
          <div className="col-span-2 min-h-0">
            <BlotterPanel />
          </div>
          <SystemPulsePanel />
        </div>
      )}
      {selected === 'ESC' && (
        <div key="exec-esc" className="flex-1 min-h-0 grid grid-cols-[18%_34%_48%] grid-rows-[minmax(0,0.38fr)_minmax(0,0.38fr)_minmax(0,0.24fr)] gap-px bg-black">
          <MonitorPanel />
          <AnalyticsPanel execMode="ESC" />
          <RightRailPanel execMode="ESC" />
          <CrossAssetMatrixPanel />
          <FeedPanel execMode="ESC" />
          <BlotterPanel />
          <div className="col-span-3 min-h-0">
            <SystemPulsePanel />
          </div>
        </div>
      )}
    </div>
  );
}
