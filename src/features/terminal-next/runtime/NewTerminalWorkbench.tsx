'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { TerminalOSProvider, useTerminalOS } from './TerminalOSContext';
import { TerminalProvider, useTerminalStore } from '../store/TerminalStore';
import { NewPanelGrid } from './NewPanelGrid';
import { DrillProvider } from './entities/DrillContext';
import { TerminalInspector } from './ui/TerminalInspector';
import { TerminalContextMenu } from './ui/ContextMenu';
import { loadAlertRules, evaluateTriggeredRules } from '../services/alertMonitor';
import { loadPolicyState } from './policyStore';
import { listWave4Store } from './wave4Store';
import { listWorkspaces } from './workspaceManager';
import { getDockLayout, subscribeDockLayout } from './dockLayoutStore';

function SystemStrip() {
  const { panels, focusedPanel, navigatePanel } = useTerminalOS();
  const { state } = useTerminalStore();
  const p = panels[focusedPanel]!;
  const [time, setTime] = React.useState({ est: '', gmt: '', local: '' });
  const [layout, setLayout] = React.useState(() => getDockLayout());
  const [tickRate, setTickRate] = React.useState(0);
  const [droppedTicks, setDroppedTicks] = React.useState(0);
  const streamRef = React.useRef({ quotes: 0, depth: 0, execution: 0 });

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const est = `${String((now.getUTCHours() - 4 + 24) % 24).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
      const gmt = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
      const local = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setTime({ est, gmt, local });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => subscribeDockLayout(() => setLayout(getDockLayout())), []);

  React.useEffect(() => {
    streamRef.current = state.streamClock;
  }, [state.streamClock]);

  React.useEffect(() => {
    let lastQuotes = 0;
    let lastDepth = 0;
    let lastExecution = 0;
    const id = window.setInterval(() => {
      const qDelta = streamRef.current.quotes - lastQuotes;
      const dDelta = streamRef.current.depth - lastDepth;
      const eDelta = streamRef.current.execution - lastExecution;
      setTickRate(qDelta);
      setDroppedTicks((prev) => prev + Math.max(0, qDelta - dDelta - eDelta));
      lastQuotes = streamRef.current.quotes;
      lastDepth = streamRef.current.depth;
      lastExecution = streamRef.current.execution;
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const alertInfo = useMemo(() => {
    const rules = loadAlertRules();
    const triggered = evaluateTriggeredRules(rules, state.quotes);
    return { total: rules.length, triggered: triggered.length };
  }, [state.quotes]);

  const fps = state.workerAnalytics?.uiFps ?? 60;
  const latency = state.workerAnalytics?.workerLatencyMs ?? 0;
  const drops = droppedTicks;
  const policy = loadPolicyState();
  const msgCount = listWave4Store('chats').length;
  const wsName = listWorkspaces()[0]?.name ?? 'UNSAVED';

  return (
    <div
      className="flex items-stretch justify-between flex-none select-none"
      style={{ height: 20, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.borderColor}`, padding: `0 ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily, color: DENSITY.textSecondary }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: DENSITY.accentGreen }}>● B-PIPE</span>
        <div className="flex flex-col justify-center leading-[1]">
          <span style={{ color: DENSITY.textSecondary, fontSize: '8px' }}>ET {time.est}</span>
          <span style={{ color: DENSITY.textSecondary, fontSize: '8px' }}>LCL {time.local}</span>
          <span style={{ color: DENSITY.textSecondary, fontSize: '8px' }}>GMT {time.gmt}</span>
        </div>
        <span style={{ color: DENSITY.textSecondary }}>P{focusedPanel + 1}: {p.activeMnemonic}</span>
        {p.linkGroup && <span>[LNK:{p.linkGroup.toUpperCase()}]</span>}
      </div>
      <div className="flex items-center gap-2 tabular-nums" style={{ color: DENSITY.textSecondary, fontSize: '8px' }}>
        <span>{policy.mode === 'frozen' ? 'STALE' : 'SIM'} </span>
        {layout.highDensityLiveMode && <span style={{ color: DENSITY.accentAmber }}>LIVE</span>}
        <span>TPS {tickRate}</span>
        <span>LAT {latency}ms</span>
        <span>FPS {fps}</span>
        <span>DROPS {drops}</span>
        <button type="button" style={{ color: alertInfo.triggered > 0 ? DENSITY.accentRed : DENSITY.textMuted, background: 'none', border: 'none', padding: 0 }} onClick={() => navigatePanel(focusedPanel, 'ALRT')}>
          ALRT {alertInfo.triggered}/{alertInfo.total}
        </button>
        <button type="button" style={{ color: DENSITY.accentCyan, background: 'none', border: 'none', padding: 0 }} onClick={() => navigatePanel(focusedPanel, 'IB')}>
          MSG {msgCount}
        </button>
        <span>WS {wsName}</span>
      </div>
    </div>
  );
}

function CommandStateStrip() {
  const { panels, focusedPanel } = useTerminalOS();
  const p = panels[focusedPanel]!;
  return (
    <div className="flex items-center justify-between flex-none"
      style={{ height: 14, background: DENSITY.panelBg, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, fontFamily: DENSITY.fontFamily, fontSize: '8px', color: DENSITY.textSecondary }}>
      <span style={{ color: DENSITY.textPrimary }}>P{focusedPanel + 1} | {p.activeMnemonic} | {p.activeSecurity}</span>
      <span style={{ color: DENSITY.textDim }}>GO | MENU | HELP | HL</span>
    </div>
  );
}

function TerminalWorkbenchInner() {
  return (
    <div
      className="flex flex-col w-[100vw] h-[100dvh] overflow-hidden"
      style={{ background: DENSITY.bgBase, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeDefault, color: DENSITY.textPrimary }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <SystemStrip />
      <CommandStateStrip />
      <NewPanelGrid />
      <TerminalInspector />
      <TerminalContextMenu />
    </div>
  );
}

export function NewTerminalWorkbench() {
  return (
    <TerminalProvider>
      <TerminalOSProvider>
        <DrillProvider>
          <TerminalWorkbenchInner />
        </DrillProvider>
      </TerminalOSProvider>
    </TerminalProvider>
  );
}
