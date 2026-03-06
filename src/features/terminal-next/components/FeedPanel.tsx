'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FeedPanel() {
  const { state, dispatch } = useTerminalStore();

  return (
    <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
      <div className="h-5 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
        <span className="text-[#9bc3e8] font-bold">NEWS + COMMAND FEED</span>
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
      <div className="grid grid-rows-[55%_45%] gap-px bg-[#1a2433] flex-1 min-h-0">
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          {state.headlines.map((n, i) => (
            <button
              key={n}
              onClick={() => dispatch({ type: 'SET_COMMAND', payload: `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${state.security.assetClass} TOP GO` })}
              className="w-full text-left text-[9px] px-1 py-[1px] border-b border-[#142034]"
            >
              <span className="text-[#7db0db] mr-1">BN {680 + i}</span>
              <span className="text-[#dbe7f7]">{n}</span>
            </button>
          ))}
        </div>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          {(state.feedTab === 'SYSTEM' ? state.systemFeed : state.headlines).map((line, i) => (
            <div key={`${line}-${i}`} className="text-[9px] px-1 py-[1px] border-b border-[#142034] text-[#aebed2]">{line}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
