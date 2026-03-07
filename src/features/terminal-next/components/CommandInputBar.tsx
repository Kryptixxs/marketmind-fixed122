'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

export function CommandInputBar() {
  const { state, dispatch } = useTerminalStore();
  const query = state.commandInput.trim().toUpperCase();
  const suggestions = useMemo(() => {
    if (!query || query.endsWith(' GO')) return [];
    return state.quotes
      .filter((q) => q.symbol.toUpperCase().includes(query) || q.name.toUpperCase().includes(query))
      .slice(0, 8);
  }, [query, state.quotes]);

  const applySuggestion = (symbol: string) => {
    const cmd = `${symbol} ${state.activeFunction} GO`;
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div className="border-b border-[#1a1a1a] bg-black px-1 pt-[2px] pb-[1px] relative">
      <div className="h-6 flex items-center gap-1">
        <span className="text-[10px] text-[#f4cf76] font-bold">{state.security.ticker} {state.security.market}</span>
        <span className="text-[10px] text-[#d8be8d]">&lt;{state.security.assetClass}&gt;</span>
        <span className="text-[#7a5a21]">{'>'}</span>
        <input
          id="terminal-command-input"
          value={state.commandInput}
          onChange={(e) => dispatch({ type: 'SET_COMMAND', payload: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'EXECUTE_COMMAND' })}
          spellCheck={false}
          className="flex-1 h-5 border border-[#262626] bg-[#0a0a0a] px-1 text-[10px] text-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
        <button
          onClick={() => dispatch({ type: 'EXECUTE_COMMAND' })}
          className="h-5 px-1.5 border border-[#2fd370] bg-[#0f6730] text-[#dbffe7] text-[9px] font-bold active:translate-y-px"
        >
          GO
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 border-x border-b border-[#1a1a1a] bg-[#0a0a0a] max-h-32 overflow-y-auto custom-scrollbar">
          {suggestions.map((s) => (
            <button
              key={s.symbol}
              onClick={() => applySuggestion(s.symbol)}
              className="w-full px-1 py-[2px] border-t border-[#1a1a1a] text-left text-[9px] grid grid-cols-[1fr_auto_auto] gap-1 hover:bg-[#0f0f0f]"
            >
              <span className="text-[#dbe7f7] truncate">{s.symbol}</span>
              <span className="text-[#9fb4cd] truncate">{s.name}</span>
              <span className={`font-bold ${s.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
