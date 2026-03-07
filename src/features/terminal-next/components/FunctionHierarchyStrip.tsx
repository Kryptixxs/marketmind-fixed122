'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FunctionHierarchyStrip() {
  const { state } = useTerminalStore();
  const modeLabel = state.activeFunction === 'EXEC' ? 'EXECUTION_FAST_PATH' : 'NESTED_MODULE';
  return (
    <div className="h-[14px] border-b border-[#111] bg-black px-[2px] flex items-center justify-between text-[8px] text-gray-200 font-mono tracking-tight uppercase tabular-nums">
      <div className="flex items-center gap-[4px] min-w-0">
        <span className="text-[#7a90ac]">SECURITY</span>
        <span className="text-[#f4cf76] font-bold border border-[#7a5a21] px-[2px]">{state.activeSymbol}</span>
        <span className="text-[#5f7694]">{'>'}</span>
        <span className="text-[#7a90ac]">FUNCTION</span>
        <span className="text-[#7dffcc] font-bold border border-[#174432] px-[2px]">{state.activeFunction}</span>
        <span className="text-[#5f7694]">{'>'}</span>
        <span className="text-[#7a90ac]">SUBMODULE</span>
        <span className="text-[#d4efff] font-bold border border-[#274b66] px-[2px]">{state.activeSubTab ?? 'PRIMARY'}</span>
      </div>
      <div className="flex items-center gap-[4px] text-gray-400 overflow-x-auto custom-scrollbar">
        <span className="text-gray-500">FIND DES|FA|HP|EXEC|WEI|YAS|OVME|PORT|NEWS|CAL|SEC|MKT</span>
        <span className={`px-[2px] border font-bold whitespace-nowrap ${state.activeFunction === 'EXEC' ? 'text-green-500 border-green-600 bg-[#0d1f0d]' : 'text-gray-300 border-[#262626] bg-[#1a1a1a]'}`}>MODE {modeLabel}</span>
      </div>
    </div>
  );
}
