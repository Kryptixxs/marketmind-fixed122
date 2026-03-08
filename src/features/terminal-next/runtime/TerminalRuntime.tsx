import React from 'react';
import { BandLayout, BandSpec } from './BandLayout';

export interface TerminalModuleOutput {
  primaryPanels: React.ReactNode;
  secondaryPanels: React.ReactNode;
  tertiaryPanels: React.ReactNode;
}

export interface TerminalRuntimeProps {
  moduleId: string;
  title: string;
  decisionPrompt: string;
  bandSpec?: BandSpec;
  renderModule: () => TerminalModuleOutput;
  className?: string;
}

export const TerminalRuntime: React.FC<TerminalRuntimeProps> = ({
  moduleId,
  title,
  decisionPrompt,
  bandSpec,
  renderModule,
  className = '',
}) => {
  const { primaryPanels, secondaryPanels, tertiaryPanels } = renderModule();

  return (
    <div className={`flex flex-col w-full h-full min-w-0 min-h-0 ${className}`}>
      {/* Header enforcing decisionPrompt visibility */}
      <div className="flex-none px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-200 uppercase tracking-wider">
          {title}
        </h1>
        <div className="text-sm font-medium text-emerald-400">
          Decision: {decisionPrompt}
        </div>
      </div>
      
      {/* Structural layout grammar */}
      <div className="flex-1 w-full min-w-0 min-h-0 bg-slate-950">
        <BandLayout
          bandSpec={bandSpec}
          primaryBand={primaryPanels}
          secondaryBand={secondaryPanels}
          tertiaryBand={tertiaryPanels}
        />
      </div>
    </div>
  );
};
