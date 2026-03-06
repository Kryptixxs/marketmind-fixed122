'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FeedPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' }) {
  const { state, dispatch } = useTerminalStore();
  const colsClass =
    execMode === 'EVENTS'
      ? 'grid-cols-[52%_30%_18%]'
      : execMode === 'MICROSTRUCTURE'
        ? 'grid-cols-[30%_40%_30%]'
        : execMode === 'FACTORS'
          ? 'grid-cols-[34%_46%_20%]'
          : 'grid-cols-[40%_35%_25%]';
  const newsRows = execMode === 'EVENTS' ? 30 : execMode === 'MICROSTRUCTURE' ? 14 : 18;
  const centerRows = execMode === 'EVENTS' ? 30 : 24;
  const alertRows = execMode === 'EVENTS' ? 12 : 18;
  const title = execMode === 'EVENTS' ? 'EVENT FEED / SYSTEM / ALERT LOG' : 'NEWS / SYSTEM / ALERT LOG';
  const modeHeaderClass =
    execMode === 'MICROSTRUCTURE'
      ? 'border-[#274b66] text-[#63c8ff]'
      : execMode === 'FACTORS'
        ? 'border-[#174432] text-[#7dffcc]'
        : execMode === 'EVENTS'
          ? 'border-[#5a1f35] text-[#e3b4ff]'
          : 'border-[#2b3f5f] text-[#f4cf76]';

  return (
    <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
      <div className={`h-5 px-1 border-b bg-[#0b1320] flex items-center justify-between text-[10px] ${modeHeaderClass}`}>
        <span className="font-bold">{title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' })}
            className={`px-1 border text-[9px] ${state.feedTab === 'NEWS' ? 'border-[#2a7b60] text-[#99f1d6] bg-[#113328]' : 'border-[#263247] text-[#9fb4cd] bg-[#09111c]'}`}
          >
            NEWS
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'SYSTEM' })}
            className={`px-1 border text-[9px] ${state.feedTab === 'SYSTEM' ? 'border-[#2a7b60] text-[#99f1d6] bg-[#113328]' : 'border-[#263247] text-[#9fb4cd] bg-[#09111c]'}`}
          >
            SYSTEM
          </button>
        </div>
      </div>
      <div className={`grid ${colsClass} gap-px bg-[#1a2433] flex-1 min-h-0`}>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          {state.headlines.slice(0, newsRows).map((n, i) => (
            <button
              key={`${n}-${i}`}
              onClick={() => dispatch({ type: 'SET_COMMAND', payload: `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${state.security.assetClass} TOP GO` })}
              className="w-full text-left text-[9px] px-1 py-[1px] border-b border-[#142034]"
            >
              <span className="text-[#f4cf76] mr-1">BN {680 + i}</span>
              <span className="text-[#dbe7f7]">{n}</span>
            </button>
          ))}
        </div>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          {(state.feedTab === 'SYSTEM' ? state.systemFeed : state.headlines).slice(0, centerRows).map((line, i) => (
            <div key={`${line}-${i}`} className="text-[9px] px-1 py-[1px] border-b border-[#142034] text-[#aebed2]">{line}</div>
          ))}
        </div>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          {state.alerts.slice(0, alertRows).map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#e3b4ff]">
              {line}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
