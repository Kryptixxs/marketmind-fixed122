'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';

type NestedModuleShellProps = {
  moduleCode: string;
  title: string;
  subtabs: string[];
  buildRows: (subtab: string) => Array<[string, string]>;
};

export function NestedModuleShell({ moduleCode, title, subtabs, buildRows }: NestedModuleShellProps) {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && subtabs.includes(state.activeSubTab) ? state.activeSubTab : subtabs[0];
  const rows = useMemo(() => buildRows(selected), [buildRows, selected]);

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[22%_78%] gap-px bg-[#1a2433]">
      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a2433] bg-[#0b1320] text-[10px] flex items-center justify-between">
          <span className="text-[#9bc3e8] font-bold">CONTEXT</span>
          <span className="text-[#7f99ba]">{moduleCode}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          <div className="px-1 py-0.5 border-b border-[#142034] flex items-center justify-between">
            <span className="text-[#93a9c6]">Symbol</span>
            <span className="text-[#e0eaf7] font-bold">{state.activeSymbol}</span>
          </div>
          <div className="px-1 py-0.5 border-b border-[#142034] flex items-center justify-between">
            <span className="text-[#93a9c6]">Function</span>
            <span className="text-[#e0eaf7] font-bold">{state.activeFunction}</span>
          </div>
          <div className="px-1 py-0.5 border-b border-[#142034] flex items-center justify-between">
            <span className="text-[#93a9c6]">Clock</span>
            <span className="text-[#e0eaf7] font-bold">{new Date(state.tickMs).toISOString().slice(11, 19)}</span>
          </div>
          <div className="px-1 py-0.5 border-b border-[#142034] flex items-center justify-between">
            <span className="text-[#93a9c6]">Regime</span>
            <span className="text-[#e0eaf7] font-bold">{state.risk.regime}</span>
          </div>
        </div>
      </section>

      <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a2433] bg-[#0b1320] text-[10px] flex items-center justify-between">
          <span className="text-[#9bc3e8] font-bold">{title}</span>
          <div className="flex items-center gap-1">
            {subtabs.map((subtab) => (
              <button
                key={subtab}
                onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: subtab })}
                className={`px-1 border text-[9px] ${
                  selected === subtab ? 'border-[#2a7b60] text-[#99f1d6] bg-[#113328]' : 'border-[#263247] text-[#9fb4cd] bg-[#09111c]'
                }`}
              >
                {subtab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-rows-[64%_36%] gap-px bg-[#1a2433] flex-1 min-h-0">
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {rows.map(([k, v]) => (
              <div key={`${k}-${v}`} className="text-[10px] px-1 py-[2px] border-b border-[#142034] flex items-center justify-between">
                <span className="text-[#93a9c6]">{k}</span>
                <span className="text-[#e0eaf7] font-bold">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            {state.systemFeed.slice(0, 10).map((line, i) => (
              <div key={`${line}-${i}`} className="text-[9px] px-1 py-[1px] border-b border-[#142034] text-[#b7c8dd]">
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
