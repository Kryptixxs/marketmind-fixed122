'use client';

import React, { ReactNode } from 'react';

export type SubGridLayout = '1x1' | '1x2' | '2x1' | '2x2' | '3x3';

export interface VirtualMonitorProps {
  id: string;
  label?: string;
  subGrid?: SubGridLayout;
  children: ReactNode;
  className?: string;
}

/**
 * Virtual Monitor – one quadrant of the 4-monitor Bloomberg setup.
 * Flexible CSS Grid sub-layouts: 1x2, 2x2, 3x3.
 */
export function VirtualMonitor({
  id,
  label,
  subGrid = '1x1',
  children,
  className = '',
}: VirtualMonitorProps) {
  const gridClass =
    subGrid === '2x2'
      ? 'bbg-subgrid bbg-subgrid-2x2'
      : subGrid === '3x3'
        ? 'bbg-subgrid bbg-subgrid-3x3'
        : subGrid === '2x1'
          ? 'bbg-subgrid bbg-subgrid-2x1'
          : subGrid === '1x2'
            ? 'bbg-subgrid bbg-subgrid-1x2'
            : '';

  return (
    <div
      id={id}
      className={`bbg-virtual-monitor min-h-0 min-w-0 overflow-hidden flex flex-col bg-[#000000] border border-[#222] ${className}`}
    >
      {label && (
        <div
          className="bbg-monitor-header flex-none h-[22px] px-[4px] flex items-center border-b border-[#222] bg-[#000000] text-[11px] font-mono font-bold uppercase tracking-wider text-[#666]"
          style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}
        >
          {label}
        </div>
      )}
      <div
        className={`flex-1 min-h-0 overflow-hidden ${gridClass || 'bbg-single'}`}
        style={{ contain: 'layout' }}
      >
        {subGrid === '1x1' ? (
          <div className="bbg-cell-wrapper h-full w-full min-h-0 overflow-auto">
            {children}
          </div>
        ) : (
          <>
            {React.Children.map(children, (child) => (
              <div className="bbg-cell-wrapper min-h-0 min-w-0 overflow-auto">
                {child}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export interface BloombergMasterGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * 2x2 master grid – occupies exactly 100vh × 100vw.
 * Each quadrant behaves like an independent Virtual Monitor.
 */
export function BloombergMasterGrid({ children, className = '' }: BloombergMasterGridProps) {
  return (
    <div
      className={`bbg-master-grid grid grid-cols-2 grid-rows-2 gap-[1px] w-full flex-1 min-h-0 overflow-hidden bg-[#222] ${className}`}
      style={{
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
        fontSize: '11px',
      }}
    >
      {children}
    </div>
  );
}
