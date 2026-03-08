'use client';

import React, { ReactNode } from 'react';

export type QuadrantSubGrid = '1x1' | '2x2' | '3x3' | '2x1' | '1x2';

export interface QuadrantContainerProps {
  id: string;
  label?: string;
  subGrid?: QuadrantSubGrid;
  children: ReactNode;
  className?: string;
}

/**
 * Smart Container: Can render as a single cell or split into sub-grid.
 * Uses fixed rem/px for terminal density - no chunky scaling on large screens.
 */
export function QuadrantContainer({
  id,
  label,
  subGrid = '1x1',
  children,
  className = '',
}: QuadrantContainerProps) {
  const subGridClass =
    subGrid === '2x2'
      ? 'grid grid-cols-2 grid-rows-2 gap-px'
      : subGrid === '3x3'
        ? 'grid grid-cols-3 grid-rows-3 gap-px'
        : subGrid === '2x1'
          ? 'grid grid-cols-2 grid-rows-1 gap-px'
          : subGrid === '1x2'
            ? 'grid grid-cols-1 grid-rows-2 gap-px'
            : '';

  return (
    <div
      id={id}
      className={`min-h-0 min-w-0 overflow-hidden flex flex-col bg-[#05080d] border border-[#111] ${className}`}
    >
      {label && (
        <div
          className="flex-none h-6 px-2 flex items-center border-b border-[#111] bg-[#0a0a0a] text-[0.65rem] font-bold uppercase tracking-wider text-[#7a90ac]"
          style={{ fontSize: '0.65rem' }}
        >
          {label}
        </div>
      )}
      <div
        className={`flex-1 min-h-0 overflow-hidden ${subGridClass || 'flex flex-col'}`}
        style={{ contain: 'layout' }}
      >
        {subGrid === '1x1' ? (
          <div className="h-full w-full min-h-0 overflow-auto custom-scrollbar terminal-scrollbar flex flex-col">
            {children}
          </div>
        ) : (
          <>
            {React.Children.map(children, (child) => (
              <div className="min-h-0 min-w-0 overflow-auto custom-scrollbar terminal-scrollbar flex flex-col">
                {child}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export interface CommandCenterGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * 4-monitor grid: 2x2 quadrants.
 * 100vh/100vw, overflow hidden, no void.
 */
export function CommandCenterGrid({ children, className = '' }: CommandCenterGridProps) {
  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 gap-px w-full h-full min-h-0 overflow-hidden bg-[#111] ${className}`}
      style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}
    >
      {children}
    </div>
  );
}
