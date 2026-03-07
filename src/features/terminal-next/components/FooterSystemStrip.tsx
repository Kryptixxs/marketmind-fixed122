'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FooterSystemStrip() {
  const { state, dispatch } = useTerminalStore();

  return (
    <div className="h-[14px] border-t border-[#111] bg-black px-[2px] flex items-center overflow-hidden text-[8px] whitespace-nowrap font-mono tracking-tight uppercase tabular-nums">
      {[...state.headlines, ...state.headlines].map((n, i) => (
        <button
          key={`${n}-${i}`}
          onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' })}
          className="mr-[6px]"
        >
          <span className="text-[#7db0db] mr-[2px]">{660 + (i % 30)}</span>
          <span className="text-[#d7e3f3]">{n}</span>
        </button>
      ))}
    </div>
  );
}
