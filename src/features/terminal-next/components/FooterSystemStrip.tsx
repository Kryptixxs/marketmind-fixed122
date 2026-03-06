'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FooterSystemStrip() {
  const { state, dispatch } = useTerminalStore();

  return (
    <div className="h-5 border-t bbg-hard-divider bg-[#07111d] px-1 flex items-center overflow-hidden text-[9px] whitespace-nowrap">
      {[...state.headlines, ...state.headlines].map((n, i) => (
        <button
          key={`${n}-${i}`}
          onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' })}
          className="mr-3"
        >
          <span className="text-[#7db0db] mr-1">{660 + (i % 30)}</span>
          <span className="text-[#d7e3f3]">{n}</span>
        </button>
      ))}
    </div>
  );
}
