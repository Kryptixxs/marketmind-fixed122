'use client';

import React, { Suspense } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { useTerminalLayout } from '../context/TerminalLayoutContext';
import { PanelFocusProvider } from '../context/PanelFocusContext';
import { CrosshairSyncProvider } from '../context/CrosshairSyncContext';
import { TerminalContextMenuProvider } from '../context/TerminalContextMenuContext';
import { TerminalContextMenu } from '../components/TerminalContextMenu';
import { usePanelFocus } from '../context/PanelFocusContext';
import { usePanelKeyboardShortcuts } from '../hooks/usePanelKeyboardShortcuts';
import { RouteSync } from '../components/RouteSync';
import { TopTickerBar } from '../components/TopTickerBar';
import { CommandKeyBar } from '../components/CommandKeyBar';
import { CommandInputBar } from '../components/CommandInputBar';
import { DeskStatusStrip } from '../components/DeskStatusStrip';
import { FunctionHierarchyStrip } from '../components/FunctionHierarchyStrip';
import { FunctionRouter } from '../components/FunctionRouter';
import { BlotterPanel } from '../components/BlotterPanel';
import { VisualizationDashboard } from '../components/VisualizationDashboard';
import { NewsWire } from '../components/visualizations';
import { CommandCenterBar } from '../components/CommandCenterBar';
import { TerminalShell } from '../components/TerminalShell';
import { TerminalPanel } from '../components/TerminalPanel';
import type { PanelFunction } from '../context/PanelFocusContext';
import type { TerminalFunction } from '../types';

/** Map PanelFunction (includes GP, N) to TerminalFunction for FunctionRouter */
function panelToTerminalFunction(p: PanelFunction): TerminalFunction {
  if (p === 'GP') return 'MKT';
  if (p === 'N') return 'NEWS';
  if (p === 'IMAP') return 'IMAP';
  if (p === 'ECO' || p === 'FXC' || p === 'GC' || p === 'IB') return p as TerminalFunction;
  return p as TerminalFunction;
}

function CommandCenterContent() {
  usePanelKeyboardShortcuts();
  const { state } = useTerminalStore();
  const { zoomedQuadrant } = useTerminalLayout();
  const { panelFunctions } = usePanelFocus();

  const panels = [
    <TerminalPanel key="q1" index={0} label="COMMAND">
      <div className="flex flex-col h-full gap-px p-2">
        <TopTickerBar />
        <CommandKeyBar />
        <CommandInputBar />
        <DeskStatusStrip />
        <FunctionHierarchyStrip />
      </div>
    </TerminalPanel>,
    <TerminalPanel key="q2" index={1} label={`${panelFunctions[1] ?? 'MKT'} • ${state.activeSymbol}`}>
      <div className="h-full p-2">
        <FunctionRouter
          activeFunction={panelToTerminalFunction(panelFunctions[1] ?? 'MKT')}
          panelFunction={panelFunctions[1] ?? 'MKT'}
        />
      </div>
    </TerminalPanel>,
    <TerminalPanel key="q3" index={2} label={`${panelFunctions[2] ?? 'NEWS'} • ANALYTICS`}>
      <div className="min-h-0 p-0 overflow-hidden h-full">
        <VisualizationDashboard />
      </div>
    </TerminalPanel>,
    <TerminalPanel key="q4" index={3} label={`${panelFunctions[3] ?? 'MKT'} • NEWS`}>
      <div className="flex flex-col h-full">
        <NewsWire />
        <BlotterPanel />
      </div>
    </TerminalPanel>,
  ];

  return (
    <>
      <CommandCenterBar />
      {zoomedQuadrant !== null ? (
        <div className="absolute inset-0 z-20 flex flex-col bg-[#000000]" style={{ width: '100vw', height: '100dvh' }}>
          <div className="flex-1 min-h-0 overflow-hidden">{panels[zoomedQuadrant]}</div>
          <div className="absolute top-1 right-1 text-[10px] text-[#666]">
            Alt+1-4 Zoom | Alt+0 Reset | Esc
          </div>
        </div>
      ) : (
        <TerminalShell>{panels}</TerminalShell>
      )}
    </>
  );
}

/**
 * 4-panel Command Center layout.
 * Hardware shell: 2x2 grid, per-panel function, focus system, Bloomberg palette.
 */
export function CommandCenterLayout() {
  return (
    <PanelFocusProvider>
      <CrosshairSyncProvider>
        <TerminalContextMenuProvider>
          <div
            className="bbg-terminal-root w-[100vw] h-[100dvh] overflow-hidden flex flex-col bg-[#000000] font-mono tracking-tight tabular-nums"
            style={{ fontSize: '11px', color: '#FFFFFF' }}
            onContextMenu={(e) => e.preventDefault()}
          >
        <Suspense fallback={null}>
          <RouteSync />
        </Suspense>
        <CommandCenterContent />
          <TerminalContextMenu />
      </div>
        </TerminalContextMenuProvider>
      </CrosshairSyncProvider>
    </PanelFocusProvider>
  );
}
