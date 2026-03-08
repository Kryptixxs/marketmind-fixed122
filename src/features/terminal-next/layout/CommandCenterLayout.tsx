'use client';

import React, { Suspense } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { useTerminalLayout } from '../context/TerminalLayoutContext';
import { CommandCenterGrid, QuadrantContainer } from './CommandCenterGrid';
import { SystemShellHeader, SystemShellFooter } from './SystemShell';
import { RouteSync } from '../components/RouteSync';
import { TopTickerBar } from '../components/TopTickerBar';
import { CommandKeyBar } from '../components/CommandKeyBar';
import { CommandInputBar } from '../components/CommandInputBar';
import { DeskStatusStrip } from '../components/DeskStatusStrip';
import { FunctionHierarchyStrip } from '../components/FunctionHierarchyStrip';
import { FunctionRouter } from '../components/FunctionRouter';
import { RightRailPanel } from '../components/RightRailPanel';
import { FeedPanel } from '../components/FeedPanel';
import { BlotterPanel } from '../components/BlotterPanel';
import { MonitorPanel } from '../components/MonitorPanel';
import { CandlestickMiniChart, SectorAllocationDonut, NewsWire } from '../components/visualizations';

/**
 * 4-monitor Command Center layout.
 * No-void: 100vh/100vw, overflow hidden, internal scroll per panel.
 * Fixed-fluid: rem/px fonts for terminal density.
 */
export function CommandCenterLayout() {
  const { state } = useTerminalStore();
  const { zoomedQuadrant } = useTerminalLayout();

  const quadrants = [
    <QuadrantContainer key="q1" id="q1-command" label="COMMAND" className="border-[#1a1a1a]">
      <div className="flex flex-col h-full gap-px">
        <TopTickerBar />
        <CommandKeyBar />
        <CommandInputBar />
        <DeskStatusStrip />
        <FunctionHierarchyStrip />
      </div>
    </QuadrantContainer>,
    <QuadrantContainer key="q2" id="q2-primary" label={`${state.activeFunction} • ${state.activeSymbol}`}>
      <FunctionRouter activeFunction={state.activeFunction} />
    </QuadrantContainer>,
    <QuadrantContainer key="q3" id="q3-analytics" label="ANALYTICS" subGrid="2x2">
      <div className="min-h-[60px]">
        <CandlestickMiniChart height={56} />
      </div>
      <div className="flex items-center justify-center min-h-[60px]">
        <SectorAllocationDonut size={100} />
      </div>
      <MonitorPanel />
      <RightRailPanel execMode={state.activeSubTab === 'ESC' ? 'ESC' : 'PRIMARY'} />
    </QuadrantContainer>,
    <QuadrantContainer key="q4" id="q4-feed" label="NEWS WIRE • BLOTTER" subGrid="1x2">
      <NewsWire />
      <BlotterPanel />
    </QuadrantContainer>,
  ];

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-black font-mono tracking-tight uppercase tabular-nums">
      <Suspense fallback={null}>
        <RouteSync />
      </Suspense>
      <SystemShellHeader />
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {zoomedQuadrant !== null ? (
          <div className="absolute inset-0 z-20 flex flex-col bg-[#05080d]">
            <div className="flex-1 min-h-0 overflow-hidden">
              {quadrants[zoomedQuadrant]}
            </div>
            <div className="absolute top-1 right-1 text-[10px] text-[#5a6b7a]">
              Alt+1-4 Zoom | Alt+0 Reset | Esc
            </div>
          </div>
        ) : (
          <CommandCenterGrid>{quadrants}</CommandCenterGrid>
        )}
      </div>
      <SystemShellFooter />
    </div>
  );
}
