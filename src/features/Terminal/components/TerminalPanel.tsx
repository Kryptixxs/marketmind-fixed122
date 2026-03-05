'use client';

import React from 'react';

interface TerminalPanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  fnKey?: string;
}

export function TerminalPanel({ title, children, actions, className = "", fnKey }: TerminalPanelProps) {
  return (
    <div className={`h-full w-full flex flex-col bg-surface border border-border overflow-hidden ${className}`}>
      {/* Bloomberg-style panel header */}
      <div className="h-[26px] min-h-[26px] flex items-center justify-between px-2 shrink-0"
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #12122a 100%)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {fnKey && (
            <span className="bb-fn-key bb-fn-key-amber shrink-0">{fnKey}</span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <span className="w-1.5 h-1.5 rounded-full bg-positive opacity-60" />
        </div>
      </div>
      {/* Panel body */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}