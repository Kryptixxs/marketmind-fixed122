'use client';

import React, { Suspense, useEffect, useRef } from 'react';
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
import { CommandCenterBar } from '../components/CommandCenterBar';
import { TerminalStatusBar } from '../components/TerminalStatusBar';
import { TerminalShell } from '../components/TerminalShell';
import { TerminalPanel } from '../components/TerminalPanel';
import { loadRecoverySnapshot, saveRecoverySnapshot } from '../services/recoveryStore';
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
  const { zoomedQuadrant, setZoomedQuadrant, panelSizes, setPanelSizes } = useTerminalLayout();
  const { panelFunctions, setPanelFunctions, quadrantStates, setQuadrantState } = usePanelFocus();
  const recoveredRef = useRef(false);

  const panelSymbol = (idx: number) => {
    const loaded = quadrantStates[idx]?.loadedSecurity ?? `${state.security.ticker} ${state.security.market} EQUITY`;
    const [ticker, market] = loaded.split(' ');
    return `${ticker ?? state.security.ticker}${market ? ` ${market}` : ''}`.trim();
  };

  const panels = [
    <TerminalPanel key="q1" index={0} label="COMMAND">
      <div className="flex flex-col h-full gap-px p-[2px]">
        <TopTickerBar />
        <CommandKeyBar />
        <CommandInputBar />
        <DeskStatusStrip />
        <FunctionHierarchyStrip />
      </div>
    </TerminalPanel>,
    <TerminalPanel key="q2" index={1} label={`${quadrantStates[1]?.activeMnemonic ?? panelFunctions[1] ?? 'MKT'} • ${quadrantStates[1]?.loadedSecurity ?? state.activeSymbol}`}>
      <div className="h-full p-[2px]">
        <FunctionRouter
          activeFunction={panelToTerminalFunction(panelFunctions[1] ?? 'MKT')}
          panelFunction={panelFunctions[1] ?? 'MKT'}
          symbol={panelSymbol(1)}
          quadrantState={quadrantStates[1]}
          onSectorMenuSelect={(idx) => {
            const target = idx === 0 ? 'NEWS' : idx === 1 ? 'WEI' : 'DES';
            setQuadrantState(1, { ...quadrantStates[1]!, activeMnemonic: target, history: [...quadrantStates[1]!.history, quadrantStates[1]!.activeMnemonic].slice(-20) });
          }}
        />
      </div>
    </TerminalPanel>,
    <TerminalPanel key="q3" index={2} label={`${quadrantStates[2]?.activeMnemonic ?? panelFunctions[2] ?? 'NEWS'} • ${quadrantStates[2]?.loadedSecurity ?? 'ANALYTICS'}`}>
      <div className="h-full p-[2px] overflow-hidden">
        <FunctionRouter
          activeFunction={panelToTerminalFunction(panelFunctions[2] ?? 'NEWS')}
          panelFunction={panelFunctions[2] ?? 'NEWS'}
          symbol={panelSymbol(2)}
          quadrantState={quadrantStates[2]}
          onSectorMenuSelect={(idx) => {
            const target = idx === 0 ? 'NEWS' : idx === 1 ? 'WEI' : 'FA';
            setQuadrantState(2, { ...quadrantStates[2]!, activeMnemonic: target, history: [...quadrantStates[2]!.history, quadrantStates[2]!.activeMnemonic].slice(-20) });
          }}
        />
      </div>
    </TerminalPanel>,
    <TerminalPanel key="q4" index={3} label={`${quadrantStates[3]?.activeMnemonic ?? panelFunctions[3] ?? 'MKT'} • ${quadrantStates[3]?.loadedSecurity ?? 'NEWS'}`}>
      <div className="h-full p-[2px] overflow-hidden">
        <FunctionRouter
          activeFunction={panelToTerminalFunction(panelFunctions[3] ?? 'MKT')}
          panelFunction={panelFunctions[3] ?? 'MKT'}
          symbol={panelSymbol(3)}
          quadrantState={quadrantStates[3]}
          onSectorMenuSelect={(idx) => {
            const target = idx === 0 ? 'NEWS' : idx === 1 ? 'IMAP' : 'MKT';
            setQuadrantState(3, { ...quadrantStates[3]!, activeMnemonic: target, history: [...quadrantStates[3]!.history, quadrantStates[3]!.activeMnemonic].slice(-20) });
          }}
        />
      </div>
    </TerminalPanel>,
  ];

  useEffect(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    void loadRecoverySnapshot().then((snap) => {
      if (!snap) return;
      if (Date.now() - snap.ts > 24 * 60 * 60 * 1000) return;
      if (snap.panelFunctions.length === 4) setPanelFunctions(snap.panelFunctions as PanelFunction[]);
      if (snap.panelSizes.length === 4) setPanelSizes(snap.panelSizes);
      setZoomedQuadrant((snap.zoomedQuadrant ?? null) as 0 | 1 | 2 | 3 | null);
      snap.quadrantStates.slice(0, 4).forEach((q, idx) => {
        setQuadrantState(idx, {
          loadedSecurity: q.loadedSecurity,
          activeMnemonic: q.activeMnemonic,
          history: q.history ?? [],
          sector: (q.sector as 'EQUITY' | 'CORP' | 'CURNCY' | 'INDEX') ?? 'EQUITY',
        });
      });
    });
  }, [setPanelFunctions, setPanelSizes, setZoomedQuadrant, setQuadrantState]);

  useEffect(() => {
    void saveRecoverySnapshot({
      ts: Date.now(),
      panelFunctions,
      quadrantStates,
      panelSizes,
      zoomedQuadrant,
      lastCommands: [],
    });
  }, [panelFunctions, quadrantStates, panelSizes, zoomedQuadrant]);

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
        <>
          <TerminalShell>{panels}</TerminalShell>
          <TerminalStatusBar />
        </>
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
