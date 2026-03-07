'use client';

import { useTerminalStore } from '../store/TerminalStore';

export function FunctionHierarchyStrip() {
  const { state } = useTerminalStore();
  const modeLabel = state.activeFunction === 'EXEC' ? 'EXECUTION_FAST_PATH' : 'NESTED_MODULE';
  return (
    <div className="h-5 border-b border-[#1a1a1a] bg-black px-1 flex items-center justify-between text-[9px] text-gray-200">
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
      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-gray-500">FIND:</span>
        <span className="text-green-500">DES→Issuer</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">FA→Financials</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">HP→Bars</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">EXEC→Depth/Tape</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">WEI→Earnings</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">YAS→Bonds</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">OVME→Options</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">PORT→Portfolio</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">NEWS→Wire</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">CAL→Events</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">SEC→Filings</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-500">MKT→Indices</span>
        <span className="text-gray-500 ml-1">|</span>
        <span className={`px-1 border font-bold ${state.activeFunction === 'EXEC' ? 'text-green-500 border-green-600 bg-[#0d1f0d]' : 'text-gray-300 border-[#262626] bg-[#1a1a1a]'}`}>MODE {modeLabel}</span>
      </div>
    </div>
  );
}
