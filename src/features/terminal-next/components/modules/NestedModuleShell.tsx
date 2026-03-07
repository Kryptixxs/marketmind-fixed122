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
    <div className="flex-1 w-full min-w-0 min-h-0 flex gap-px bg-black font-mono tracking-tight uppercase tabular-nums">
      <section className="flex-[1] min-w-0 bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] text-[8px] flex items-center justify-between">
          <span className="text-[#9bc3e8] font-bold">CONTEXT</span>
          <span className="text-[#7f99ba]">{moduleCode}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[8px]">
          <div className="px-[2px] py-[1px] border-b border-[#111] flex items-center justify-between">
            <span className="text-[#93a9c6]">Symbol</span>
            <span className="text-[#e0eaf7] font-bold">{state.activeSymbol}</span>
          </div>
          <div className="px-[2px] py-[1px] border-b border-[#111] flex items-center justify-between">
            <span className="text-[#93a9c6]">Function</span>
            <span className="text-[#e0eaf7] font-bold">{state.activeFunction}</span>
          </div>
          <div className="px-[2px] py-[1px] border-b border-[#111] flex items-center justify-between">
            <span className="text-[#93a9c6]">Clock</span>
            <span className="text-[#e0eaf7] font-bold">{new Date(state.tickMs).toISOString().slice(11, 19)}</span>
          </div>
          <div className="px-[2px] py-[1px] border-b border-[#111] flex items-center justify-between">
            <span className="text-[#93a9c6]">Regime</span>
            <span className="text-[#e0eaf7] font-bold">{state.risk.regime}</span>
          </div>
        </div>
      </section>

      <section className="flex-[2] min-w-0 min-h-0 bg-black overflow-hidden flex flex-col">
        <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] text-[8px] flex items-center justify-between">
          <span className="text-[#9bc3e8] font-bold">{title}</span>
          <div className="flex items-center gap-[2px]">
            {subtabs.map((subtab) => (
              <button
                key={subtab}
                onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: subtab })}
                className={`px-[2px] border text-[7px] leading-none ${
                  selected === subtab ? 'border-green-600 text-green-400 bg-[#0d1f0d]' : 'border-[#262626] text-gray-400 bg-[#0a0a0a]'
                }`}
              >
                {subtab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-px bg-black flex-1 min-h-0">
          <div className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar flex-[2]">
            {rows.map(([k, v]) => (
              <div key={`${k}-${v}`} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px]">
                <span className="text-[#93a9c6]">{k}</span>
                <span className="text-[#e0eaf7] font-bold text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar flex-1">
            {state.systemFeed.map((line, i) => (
              <div key={`${line}-${i}`} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] text-[#b7c8dd]">
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
