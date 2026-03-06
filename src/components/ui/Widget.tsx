'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, MoreVertical } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  accent?: 'blue' | 'cyan' | 'positive' | 'negative' | 'warning';
  noPadding?: boolean;
  className?: string;
}

const ACCENT_COLORS = {
  blue: 'text-accent',
  cyan: 'text-cyan',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
};

const ACCENT_DOTS = {
  blue: 'bg-accent',
  cyan: 'bg-cyan',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-warning',
};

export function Widget({ title, children, actions, accent = 'blue', noPadding, className = '' }: WidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div className={`
      flex flex-col border border-border bg-surface overflow-hidden
      ${isMaximized ? 'fixed inset-2 z-[200] shadow-2xl glow-blue' : 'h-full w-full'}
      ${className}
    `}>
      <div className="panel-header shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full ${ACCENT_DOTS[accent]} shrink-0`} />
          <span className={`truncate text-[10px] font-bold uppercase tracking-widest ${ACCENT_COLORS[accent]}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {actions}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded hover:bg-white/5 transition-colors text-text-tertiary hover:text-text-primary"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>
      </div>
      <div className={`flex-1 relative overflow-hidden ${noPadding ? '' : ''}`}>
        {children}
      </div>
    </div>
  );
}
