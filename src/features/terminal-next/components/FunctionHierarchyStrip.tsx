'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FunctionHierarchyStrip() {
  const { state } = useTerminalStore();
  const modeLabel = state.activeFunction === 'EXEC' ? 'EXECUTION_FAST_PATH' : 'NESTED_MODULE';
  return (
    <div className="h-5 border-b bbg-hard-divider bg-[#050c16] px-1 flex items-center justify-between text-[9px]">
      <div className="flex items-center gap-2">
        <span className="text-[#7a90ac]">SECURITY</span>
        <span className="text-[#f4cf76] font-bold border border-[#7a5a21] px-1">{state.activeSymbol}</span>
        <span className="text-[#5f7694]">{'>'}</span>
        <span className="text-[#7a90ac]">FUNCTION</span>
        <span className="text-[#7dffcc] font-bold border border-[#174432] px-1">{state.activeFunction}</span>
        <span className="text-[#5f7694]">{'>'}</span>
        <span className="text-[#7a90ac]">SUBMODULE</span>
        <span className="text-[#d4efff] font-bold border border-[#274b66] px-1">{state.activeSubTab ?? 'PRIMARY'}</span>
      </div>
      <div className="flex items-center gap-2 text-[#7a90ac]">
        <span className={`px-1 border font-bold ${state.activeFunction === 'EXEC' ? 'text-[#4ce0a5] border-[#174432]' : 'text-[#e3b4ff] border-[#5a1f35]'}`}>MODE {modeLabel}</span>
      </div>
    </div>
  );
}
