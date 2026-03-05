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
    <div className={`terminal-panel h-full w-full flex flex-col ${className}`}>
      <div className="terminal-header flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-accent">■</span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}