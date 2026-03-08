'use client';

import React, { ReactNode } from 'react';

export interface TerminalShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * TerminalShell – 2x2 master grid of virtual monitors.
 * Contains exactly 4 TerminalPanel quadrants.
 */
export function TerminalShell({ children, className = '' }: TerminalShellProps) {
  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 gap-px flex-1 min-h-0 overflow-hidden bg-[#333] ${className}`}
      style={{
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
      }}
    >
      {children}
    </div>
  );
}
