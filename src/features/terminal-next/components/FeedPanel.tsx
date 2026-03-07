'use client';

import { useRef } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

export function FeedPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state, dispatch } = useTerminalStore();
  const newsRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const colsClass =
    execMode === 'EVENTS'
      ? 'grid-cols-[52%_30%_18%]'
      : execMode === 'MICROSTRUCTURE'
        ? 'grid-cols-[30%_40%_30%]'
        : execMode === 'FACTORS'
          ? 'grid-cols-[34%_46%_20%]'
          : execMode === 'ESC'
            ? 'grid-cols-[28%_47%_25%]'
          : 'grid-cols-[40%_35%_25%]';
  const title = execMode === 'EVENTS' ? 'EVENT FEED / SYSTEM / ALERT LOG' : 'NEWS / SYSTEM / ALERT LOG';
  const modeHeaderClass =
    execMode === 'MICROSTRUCTURE'
      ? 'border-[#274b66] text-[#63c8ff]'
      : execMode === 'FACTORS'
        ? 'border-[#174432] text-[#7dffcc]'
        : execMode === 'EVENTS'
          ? 'border-[#5a1f35] text-[#e3b4ff]'
          : execMode === 'ESC'
            ? 'border-[#1a5f4b] text-[#99f1d6]'
          : 'border-[#2b3f5f] text-[#f4cf76]';

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col">
      <div className={`h-5 px-1 border-b bg-[#0a0a0a] flex items-center justify-between text-[10px] ${modeHeaderClass}`}>
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
      <div className={`grid ${colsClass} gap-px bg-[#1a1a1a] flex-1 min-h-0`}>
        <div ref={newsRef} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
          {state.headlines.map((n, i) => (
            <button
              key={`${n}-${i}`}
              onClick={() => dispatch({ type: 'SET_COMMAND', payload: `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${state.security.assetClass} TOP GO` })}
              className="w-full text-left text-[9px] px-1 py-[1px] border-b border-[#1a1a1a]"
            >
              <span className="text-[#f4cf76] mr-1">BN {680 + i}</span>
              <span className="text-[#dbe7f7]">{n}</span>
            </button>
          ))}
        </div>
        <div ref={centerRef} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
          {(state.feedTab === 'SYSTEM' ? state.systemFeed : state.headlines).map((line, i) => (
            <div key={`${line}-${i}`} className="text-[9px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#aebed2]">{line}</div>
          ))}
        </div>
        <div ref={alertRef} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
          {state.alerts.map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#e3b4ff]">
              {line}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
