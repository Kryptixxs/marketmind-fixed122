import React, { useState } from 'react';
import { PanelConfig, PanelType } from './types';
import { shouldPanelDefaultCollapse } from './panelRules';

export interface PanelFrameProps {
  config: PanelConfig;
  children: React.ReactNode;
  className?: string;
}

export const PanelFrame: React.FC<PanelFrameProps> = ({
  config,
  children,
  className = '',
}) => {
  const [collapsed, setCollapsed] = useState(
    shouldPanelDefaultCollapse(config.type)
  );

  const priorityBadgeClasses = () => {
    switch (config.type) {
      case PanelType.VERDICT: return 'bg-emerald-500 text-white';
      case PanelType.VULNERABILITY: return 'bg-rose-500 text-white';
      case PanelType.FLOW: return 'bg-sky-500 text-white';
      case PanelType.HISTORICAL: return 'bg-slate-500 text-white';
      default: return 'bg-slate-700 text-slate-200';
    }
  };

  return (
    <div
      className={`flex flex-col border border-slate-800 bg-slate-900 rounded-sm overflow-hidden ${className} min-h-0 min-w-0`}
      style={{
        minHeight: config.minHeightUnits ? `${config.minHeightUnits * 24}px` : undefined,
      }}
    >
      <div 
        className="flex items-center justify-between px-2 py-1 bg-slate-800/50 cursor-pointer select-none border-b border-slate-800/50 flex-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shrink-0 ${priorityBadgeClasses()}`}>
            {config.type}
          </span>
          <span className="text-xs font-semibold text-slate-300 truncate">
            {config.title}
          </span>
        </div>
        <button
          className="text-slate-500 hover:text-slate-300 ml-2 shrink-0 p-1"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 w-full min-w-0 min-h-0 overflow-auto p-2 text-sm text-slate-300">
          {children}
        </div>
      )}
    </div>
  );
};
