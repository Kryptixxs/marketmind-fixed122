'use client';

import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
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
  ECO: 'ECO',
  IMAP: 'IMAP',
  FXC: 'FXC',
  GC: 'GC',
  IB: 'IB',
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
  const LINK_GROUPS: Array<LinkGroupId> = [null, 'red', 'blue', 'green', 'yellow'];
  const LINK_COLORS: Record<string, string> = {
    red: '#FF0000',
    blue: '#0068FF',
    green: '#00FF00',
    yellow: '#FFD700',
  };

  const toggleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = LINK_GROUPS.indexOf(linkGroup);
    const next = LINK_GROUPS[(idx + 1) % LINK_GROUPS.length] ?? null;
    setPanelLinkGroup(index, next);
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
          className="flex-none h-[22px] px-[2px] flex items-center justify-between border-b border-[#333] bg-[#000084] text-[10px] font-mono font-bold uppercase tracking-wider text-[#fff]"
          style={{ borderColor: 'inherit' }}
        >
          <span>{label ?? FN_LABELS[fn]}</span>
          <button
            type="button"
            onClick={toggleLink}
            className="p-0.5 hover:bg-[#222] border border-[#333] cursor-pointer flex items-center justify-center"
            title={isLinked ? `Sync group: ${linkGroup}` : 'Unlinked panel'}
          >
            <span
              className="inline-block w-[12px] h-[12px]"
              style={{ backgroundColor: isLinked ? LINK_COLORS[String(linkGroup)] : '#222' }}
            />
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">{children}</div>
    </div>
  );
}
