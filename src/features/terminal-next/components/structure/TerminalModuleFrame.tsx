'use client';

import { TERMINAL_STRUCTURE_POLICY } from '../../constants/layoutDensity';
import { TerminalModuleDefinition } from '../../types';
import { validateModuleDefinition } from '../../structure/validateModuleDefinition';
import { BandFrame } from './BandFrame';

export function TerminalModuleFrame({ definition }: { definition: TerminalModuleDefinition }) {
  const safe = validateModuleDefinition(definition);
  return (
    <section className="flex-1 w-full min-w-0 min-h-0 flex flex-col gap-px bg-black font-mono tracking-tight uppercase tabular-nums">
      <div className="h-[14px] px-[2px] border border-[#111] bg-[#0a0a0a] text-[8px] flex items-center justify-between">
        <span className="text-[#f4cf76] font-bold">{safe.code} DECISION</span>
        <span className="text-[#9bc3e8] font-bold">{safe.primaryDecision}</span>
      </div>
      <div className={`flex-1 w-full min-w-0 min-h-0 grid ${TERMINAL_STRUCTURE_POLICY.bandRows} gap-px bg-black`}>
        <BandFrame band={safe.bands.primary} />
        <BandFrame band={safe.bands.secondary} />
        <BandFrame band={safe.bands.tertiary} />
      </div>
    </section>
  );
}
