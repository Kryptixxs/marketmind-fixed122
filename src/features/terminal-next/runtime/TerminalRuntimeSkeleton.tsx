'use client';

import React from 'react';
import { BandLayout } from './BandLayout';

export interface TerminalRuntimeSkeletonProps {
  moduleCode: string;
  moduleTitle?: string;
  decisionPrompt?: string;
  className?: string;
  /** If true, show "Module not migrated yet" instead of placeholder labels */
  notMigrated?: boolean;
}

const PlaceholderBand = ({
  label,
  collapsed = false,
  notMigrated = false,
}: {
  label: string;
  collapsed?: boolean;
  notMigrated?: boolean;
}) => (
  <div
    className={`border border-slate-800 rounded-sm bg-slate-900/80 m-2 ${
      collapsed ? 'flex items-center justify-center min-h-[48px]' : 'p-4 min-h-[80px]'
    }`}
  >
    {notMigrated ? (
      <div className="text-slate-400 text-base font-mono py-3 text-center">
        MODULE NOT MIGRATED YET — LAYOUT ACTIVE
      </div>
    ) : (
      <span className="text-slate-500 text-sm font-mono uppercase tracking-wider">{label}</span>
    )}
  </div>
);

export const TerminalRuntimeSkeleton: React.FC<TerminalRuntimeSkeletonProps> = ({
  moduleCode,
  moduleTitle,
  decisionPrompt = 'What is the primary decision?',
  className = '',
  notMigrated = false,
}) => {
  const title = moduleTitle ?? `${moduleCode} CONTEXT`;

  return (
    <div className={`flex flex-col w-full h-full min-w-0 min-h-0 ${className}`}>
      {/* Header — single decision visible immediately */}
      <div className="flex-none shrink-0 h-9 px-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
        <h1 className="text-sm font-bold text-slate-200 uppercase tracking-wider truncate">
          {title}
        </h1>
        <div className="text-xs font-medium text-emerald-400 truncate ml-2">
          Decision: {decisionPrompt}
        </div>
      </div>

      {/* Forced 3-band grid — guaranteed height allocation */}
      <div className="flex-1 min-h-0 w-full bg-slate-950">
        <BandLayout
          primaryBand={
            <PlaceholderBand
              label="Decision / Verdict"
              notMigrated={notMigrated}
            />
          }
          secondaryBand={
            <PlaceholderBand
              label="Diagnostics"
              notMigrated={notMigrated}
            />
          }
          tertiaryBand={
            <PlaceholderBand
              label="Details (collapsed)"
              collapsed
              notMigrated={notMigrated}
            />
          }
        />
      </div>
    </div>
  );
};
