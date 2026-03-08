'use client';

import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Link2 } from 'lucide-react';
import { usePanelFocus, type PanelFunction, type LinkGroupId } from '../context/PanelFocusContext';

export interface TerminalPanelProps {
  index: number;
  label?: string;
  children: ReactNode;
  className?: string;
}

const FN_LABELS: Record<PanelFunction, string> = {
  WEI: 'WEI',
  GP: 'GP',
  N: 'N',
  MKT: 'MKT',
  EXEC: 'EXEC',
  DES: 'DES',
  FA: 'FA',
  HP: 'HP',
  YAS: 'YAS',
  OVME: 'OVME',
  PORT: 'PORT',
  NEWS: 'NEWS',
  CAL: 'CAL',
  SEC: 'SEC',
  INTEL: 'INTEL',
};

export function TerminalPanel({
  index,
  label,
  children,
  className = '',
}: TerminalPanelProps) {
  const { activePanelIndex, setActivePanel, panelFunctions, panelLinkGroups, setPanelLinkGroup } = usePanelFocus();
  const isActive = activePanelIndex === index;
  const fn = panelFunctions[index] ?? 'MKT';
  const linkGroup: LinkGroupId = panelLinkGroups[index] ?? null;
  const isLinked = linkGroup !== null;

  const toggleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPanelLinkGroup(index, isLinked ? null : 'blue');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActivePanel(index)}
      onKeyDown={(e) => e.key === 'Enter' && setActivePanel(index)}
      className={clsx(
        'terminal-panel min-h-0 min-w-0 overflow-hidden flex flex-col bg-[#000000] cursor-pointer outline-none',
        isActive && 'active',
        className
      )}
    >
      {label !== undefined && (
        <div
          className="flex-none h-6 px-2 flex items-center justify-between border-b border-[#333] bg-[#0a0a0a] text-[10px] font-mono font-bold uppercase tracking-wider text-[#999]"
          style={{ borderColor: 'inherit' }}
        >
          <span>{label ?? FN_LABELS[fn]}</span>
          <button
            type="button"
            onClick={toggleLink}
            className="p-0.5 hover:bg-[#222] border-0 cursor-pointer"
            title={isLinked ? 'Unlink panel' : 'Link panel (sync ticker with linked panels)'}
            style={{ color: isLinked ? '#0068FF' : '#555' }}
          >
            <Link2 size={12} />
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">{children}</div>
    </div>
  );
}
