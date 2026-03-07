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

  return (
    <div className="h-screen w-full min-h-0 flex flex-col overflow-hidden bg-black text-white font-mono tracking-tight uppercase tabular-nums bbg-hard-frame">
      <Suspense fallback={null}>
        <RouteSync />
      </Suspense>
      <TopTickerBar />
      <CommandKeyBar />
      <CommandInputBar />
      <DeskStatusStrip />
      <FunctionHierarchyStrip />
      <div className="flex-1 w-full min-w-0 min-h-0 relative overflow-hidden bg-black terminal-grid-bg">
        <div className="relative z-10 min-h-0 h-full flex flex-col">
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
