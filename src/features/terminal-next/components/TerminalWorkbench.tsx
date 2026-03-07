'use client';

import React, { Suspense } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { TerminalProvider } from '../store/TerminalStore';
import { CommandInputBar } from './CommandInputBar';
import { CommandKeyBar } from './CommandKeyBar';
import { DeskStatusStrip } from './DeskStatusStrip';
import { RouteSync } from './RouteSync';
import { FooterSystemStrip } from './FooterSystemStrip';
import { FunctionRouter } from './FunctionRouter';
import { FunctionHierarchyStrip } from './FunctionHierarchyStrip';
import { TopTickerBar } from './TopTickerBar';

function TerminalWorkbenchBody() {
  const { state } = useTerminalStore();
  const telemetry = [
    `CLK ${state.tickMs}`,
    `Q${state.streamClock.quotes} D${state.streamClock.depth} E${state.streamClock.execution} F${state.streamClock.feed}`,
    `IMB ${(state.microstructure.imbalance * 100).toFixed(1)} OFI ${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}`,
    `GROSS ${state.risk.grossExposure.toFixed(1)} NET ${state.risk.netExposure.toFixed(1)} VAR ${state.risk.intradayVar.toFixed(1)}`,
  ];

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-black text-white font-mono bbg-hard-frame">
      <Suspense fallback={null}>
        <RouteSync />
      </Suspense>
      <TopTickerBar />
      <CommandKeyBar />
      <CommandInputBar />
      <DeskStatusStrip />
      <FunctionHierarchyStrip />
      <div className="flex-1 min-h-0 relative overflow-hidden bg-black terminal-grid-bg">
        <div className="relative z-10 h-full min-h-0">
          <FunctionRouter activeFunction={state.activeFunction} />
        </div>
      </div>
      <FooterSystemStrip />
    </div>
  );
}

export function TerminalWorkbench() {
  return (
    <TerminalProvider>
      <TerminalWorkbenchBody />
    </TerminalProvider>
  );
}
