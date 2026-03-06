'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function CommandInputBar() {
  const { state, dispatch } = useTerminalStore();

  return (
    <div className="h-7 border-b bbg-hard-divider bg-[#050a14] px-1 flex items-center gap-1">
      <span className="text-[10px] text-[#f4cf76] font-bold">{state.security.ticker} {state.security.market}</span>
      <span className="text-[10px] text-[#d8be8d]">&lt;{state.security.assetClass}&gt;</span>
      <span className="text-[#7a5a21]">{'>'}</span>
      <input
        id="terminal-command-input"
        value={state.commandInput}
        onChange={(e) => dispatch({ type: 'SET_COMMAND', payload: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'EXECUTE_COMMAND' })}
        spellCheck={false}
        className="flex-1 h-5 border border-[#7a5a21] bg-[#090d14] px-1 text-[10px] text-[#ffd98f] outline-none focus:border-[#f4cf76] focus:bbg-command-focus"
      />
      <button
        onClick={() => dispatch({ type: 'EXECUTE_COMMAND' })}
        className="h-5 px-1.5 border border-[#2fd370] bg-[#0f6730] text-[#dbffe7] text-[9px] font-bold active:translate-y-px"
      >
        GO
      </button>
    </div>
  );
}
