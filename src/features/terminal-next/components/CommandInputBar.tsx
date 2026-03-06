'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function CommandInputBar() {
  const { state, dispatch } = useTerminalStore();

  return (
    <div className="h-7 border-b border-[#1a2433] bg-[#060c14] px-1 flex items-center gap-1">
      <span className="text-[10px] text-[#8ac5ef]">{state.security.ticker} {state.security.market}</span>
      <span className="text-[10px] text-[#7ea4d0]">&lt;{state.security.assetClass}&gt;</span>
      <span className="text-[#4b5f7e]">{'>'}</span>
      <input
        id="terminal-command-input"
        value={state.commandInput}
        onChange={(e) => dispatch({ type: 'SET_COMMAND', payload: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'EXECUTE_COMMAND' })}
        spellCheck={false}
        className="flex-1 h-5 border border-[#263247] bg-[#09111c] px-1 text-[10px] text-[#e2eaf6] outline-none focus:border-[#4a6f9c]"
      />
      <button
        onClick={() => dispatch({ type: 'EXECUTE_COMMAND' })}
        className="h-5 px-1.5 border border-[#2a779b] bg-[#123547] text-[#b6e6ff] text-[9px] font-bold"
      >
        GO
      </button>
    </div>
  );
}
