'use client';

import React from 'react';
import { Maximize2, MoreHorizontal } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Widget({ title, children, actions }: WidgetProps) {
  return (
    <div className="modern-card flex flex-col h-full w-full overflow-hidden group">
      <div className="modern-header shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--theme-accent)]" />
          <span className="text-xs font-bold tracking-tight uppercase opacity-90">{title}</span>
        </div>
        
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
          <button className="text-text-secondary hover:text-text-hi transition-colors">
            <Maximize2 size={14} />
          </button>
          <button className="text-text-secondary hover:text-text-hi transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}