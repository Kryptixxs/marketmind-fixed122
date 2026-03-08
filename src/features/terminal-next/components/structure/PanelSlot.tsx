'use client';

import { useMemo, useState } from 'react';
import { TerminalPanelDefinition } from '../../types';

export function PanelSlot({ panel }: { panel: TerminalPanelDefinition }) {
  const [collapsed, setCollapsed] = useState(Boolean(panel.defaultCollapsed));
  const canCollapse = Boolean(panel.collapsible);
  const label = useMemo(() => panel.type.replace('_', ' '), [panel.type]);
  return (
    <section className="min-h-0 border border-[#111] bg-black flex flex-col">
      <div className="h-[12px] px-[2px] border-b border-[#111] bg-[#0a0a0a] text-[7px] flex items-center justify-between">
        <span className="text-[#9bc3e8] font-bold">{label}</span>
        <div className="flex items-center gap-[2px]">
          <span className="text-[#8ea4bf] truncate max-w-[220px]">{panel.question}</span>
          {canCollapse ? (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="px-[2px] border border-[#262626] text-gray-400 bg-[#0a0a0a] leading-none"
            >
              {collapsed ? 'EXPAND' : 'COLLAPSE'}
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{collapsed ? null : panel.content}</div>
    </section>
  );
}
