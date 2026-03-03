'use client';

import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { GlobalStatus } from '@/components/workspace/GlobalStatus';
import { LeftRail } from '@/components/workspace/LeftRail';
import { RightStack } from '@/components/workspace/RightStack';
import { ExecutionStrip } from '@/components/workspace/ExecutionStrip';
import TradingViewChart from '@/components/TradingViewChart';

// Symbol mapping for TV
const TV_WIDGET_MAP: Record<string, string> = {
  'NAS100': 'PEPPERSTONE:NAS100',
  'ES': 'CME_MINI:ES1!',
  'NQ': 'CME_MINI:NQ1!',
  'CL': 'NYMEX:CL1!',
  'GC': 'COMEX:GC1!',
};

export default function WorkspacePage() {
  const [activeSymbol, setActiveSymbol] = useState("NQ");
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';
  
  const tvSymbol = TV_WIDGET_MAP[activeSymbol] || activeSymbol;

  return (
    <div 
      className="h-full w-full flex flex-col bg-background"
      style={{
        padding: 'var(--layout-pad)',
        gap: 'var(--layout-gap)'
      }}
    >
      {/* Region 5: Global Status Layer */}
      <GlobalStatus />

      {/* Core Split */}
      <div 
        className="flex-1 flex flex-row min-h-0 w-full"
        style={{ gap: 'var(--layout-gap)' }}
      >
        
        {/* Region 1: Left Control Rail */}
        <LeftRail activeSymbol={activeSymbol} setActiveSymbol={setActiveSymbol} />

        {/* Region 2: Primary Chart Field */}
        <div className="region-panel flex-1 h-full min-w-0">
          <div className="region-header">
            <span>{isTerminal ? 'PRIMARY_DISPLAY // CHART' : 'Price Action'}</span>
            <span className="text-positive font-mono text-[9px]">{isTerminal ? '[DATA: REALTIME]' : 'Live Feed'}</span>
          </div>
          <div className="flex-1 w-full bg-black relative">
            <TradingViewChart 
              symbol={tvSymbol}
              interval="15" 
              style={isTerminal ? "0" : "1"} 
            />
          </div>
        </div>

        {/* Region 3: Right Intelligence Stack */}
        <RightStack activeSymbol={activeSymbol} />

      </div>

      {/* Region 4: Bottom Execution Strip */}
      <ExecutionStrip />

    </div>
  );
}