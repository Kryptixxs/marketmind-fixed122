'use client';

import React, { ReactNode } from 'react';

export interface BandSpec {
  primary: number;
  secondary: number;
  tertiary: number;
}

export interface BandLayoutProps {
  bandSpec?: BandSpec;
  primaryBand: ReactNode;
  secondaryBand: ReactNode;
  tertiaryBand: ReactNode;
  className?: string;
}

const DEFAULT_BAND_SPEC: BandSpec = {
  primary: 0.25,
  secondary: 0.45,
  tertiary: 0.30,
};

function BandSlot({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export const BandLayout: React.FC<BandLayoutProps> = ({
  bandSpec = DEFAULT_BAND_SPEC,
  primaryBand,
  secondaryBand,
  tertiaryBand,
  className = '',
}) => {
  const sum = bandSpec.primary + bandSpec.secondary + bandSpec.tertiary;
  const normalizedSpec = {
    primary: bandSpec.primary / sum,
    secondary: bandSpec.secondary / sum,
    tertiary: bandSpec.tertiary / sum,
  };

  const gridTemplateRows = `${normalizedSpec.primary}fr ${normalizedSpec.secondary}fr ${normalizedSpec.tertiary}fr`;

  return (
    <div
      className={`grid w-full h-full min-h-0 ${className}`}
      style={{ gridTemplateRows }}
    >
      <BandSlot>{primaryBand}</BandSlot>
      <BandSlot>{secondaryBand}</BandSlot>
      <BandSlot>{tertiaryBand}</BandSlot>
    </div>
  );
};
