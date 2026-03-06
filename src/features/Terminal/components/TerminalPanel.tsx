'use client';

import React from 'react';

interface TerminalPanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function TerminalPanel({ title, children, actions, className = "" }: TerminalPanelProps) {
  return (
    <div className={`flex flex-col h-full w-full border-r border-border bg-background ${className}`}>
      <div className="terminal-header justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-accent text-[7px]">■</span>
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}