'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

export function CommandInputBar() {
  const { state, dispatch } = useTerminalStore();
  const query = state.commandInput.trim().toUpperCase();
  const suggestions = useMemo(() => {
    if (!query || query.endsWith(' GO')) return [];
    return state.quotes
      .filter((q) => q.symbol.toUpperCase().includes(query) || q.name.toUpperCase().includes(query));
  }, [query, state.quotes]);

  const applySuggestion = (symbol: string) => {
    const cmd = `${symbol} ${state.activeFunction} GO`;
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div className="border-b border-[#111] bg-black px-[2px] pt-[1px] pb-[1px] relative font-mono tracking-tight uppercase tabular-nums">
      <div className="h-[14px] flex items-center gap-[2px]">
        <span className="text-[8px] text-[#f4cf76] font-bold">{state.security.ticker} {state.security.market}</span>
        <span className="text-[8px] text-[#d8be8d]">&lt;{state.security.assetClass}&gt;</span>
        <span className="text-[7px] text-[#7a5a21]">{'>'}</span>
        <input
          id="terminal-command-input"
          value={state.commandInput}
          onChange={(e) => dispatch({ type: 'SET_COMMAND', payload: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'EXECUTE_COMMAND' })}
          spellCheck={false}
          className="flex-1 h-[12px] border border-[#262626] bg-[#0a0a0a] px-[2px] text-[8px] text-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
        <button
          onClick={() => dispatch({ type: 'EXECUTE_COMMAND' })}
          className="h-[12px] px-[2px] border border-[#2fd370] bg-[#0f6730] text-[#dbffe7] text-[7px] font-bold leading-none active:translate-y-px"
        >
          GO
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 border-x border-b border-[#111] bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
          {suggestions.map((s) => (
            <button
              key={s.symbol}
              onClick={() => applySuggestion(s.symbol)}
              className="w-full px-[2px] py-[1px] border-t border-[#111] text-left text-[8px] grid grid-cols-[auto_1fr] gap-[2px] hover:bg-[#0f0f0f]"
            >
              <span className="text-[#dbe7f7] truncate">{s.symbol}</span>
              <span className={`font-bold text-right ${s.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{s.name} | {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
