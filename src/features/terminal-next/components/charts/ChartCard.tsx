'use client';

import React from 'react';

/**
 * Wraps charts in a defined card container to prevent overflow/z-index nightmares.
 * Each chart gets isolated layout with padding and scroll.
 */
export function ChartCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded border border-slate-800 bg-slate-900/60 p-2 overflow-hidden isolate min-h-0 ${className}`}
      style={{ contain: 'layout' }}
    >
      <div className="w-full h-full min-h-[60px] min-w-0">
        {children}
      </div>
    </div>
  );
}
