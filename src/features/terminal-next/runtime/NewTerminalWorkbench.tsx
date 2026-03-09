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
import { listWave4Store } from './wave4Store';
import { listWorkspaces } from './workspaceManager';
import { getDockLayout, subscribeDockLayout } from './dockLayoutStore';
import { useSettings } from '@/services/context/SettingsContext';

function SystemStrip() {
  const { focusedPanel, navigatePanel } = useTerminalOS();
  const { state } = useTerminalStore();
  const { settings } = useSettings();
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
  const msgCount = listWave4Store('chats').length;
  const wsName = listWorkspaces()[0]?.name ?? 'Unsaved';

  return (
    <div
      className="flex items-center justify-between flex-none select-none"
      style={{
        height: 24,
        background: DENSITY.bgSurface,
        borderBottom: `1px solid ${DENSITY.borderColor}`,
        padding: `0 8px`,
        fontSize: DENSITY.fontSizeTiny,
        fontFamily: DENSITY.fontFamily,
        color: DENSITY.textSecondary,
      }}
    >
      {/* Left: brand + feed + time */}
      <div className="flex items-center gap-3">
        <span style={{ color: DENSITY.accentAmber, fontWeight: 700, letterSpacing: '0.1em', fontSize: '11px' }}>MM</span>
        <span style={{ color: DENSITY.accentGreen }}>● SIM</span>
        {settings.timeDisplay === 'ET' && <span style={{ color: DENSITY.textSecondary }}>ET {time.est}</span>}
        {settings.timeDisplay === 'LOCAL' && <span style={{ color: DENSITY.textSecondary }}>Local {time.local}</span>}
        {settings.timeDisplay === 'GMT' && <span style={{ color: DENSITY.textSecondary }}>GMT {time.gmt}</span>}
        {layout.highDensityLiveMode && <span style={{ color: DENSITY.accentAmber, fontWeight: 700 }}>LIVE MODE</span>}
      </div>

      {/* Right: telemetry + nav */}
      <div className="flex items-center gap-3 tabular-nums">
        <span>TPS {tickRate}</span>
        <span>Latency {latency}ms</span>
        <span>FPS {fps}</span>
        {drops > 0 && <span style={{ color: DENSITY.accentRed }}>Drops {drops}</span>}
        <button type="button"
          style={{ color: alertInfo.triggered > 0 ? DENSITY.accentRed : DENSITY.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny, padding: 0 }}
          onClick={() => navigatePanel(focusedPanel, 'ALRT')}>
          {alertInfo.triggered > 0 ? `⚠ ${alertInfo.triggered} Alert${alertInfo.triggered > 1 ? 's' : ''}` : `Alerts ${alertInfo.total}`}
        </button>
        <button type="button"
          style={{ color: DENSITY.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny, padding: 0 }}
          onClick={() => navigatePanel(focusedPanel, 'IB')}>
          Messages {msgCount}
        </button>
        <button type="button"
          style={{ color: DENSITY.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny, padding: 0 }}
          onClick={() => navigatePanel(focusedPanel, 'PREF')}>
          ⚙ Settings
        </button>
        <span style={{ color: DENSITY.textDim }}>WS: {wsName}</span>
      </div>
    </div>
  );
}

function CommandStateStrip({ commandInputRef }: { commandInputRef: React.RefObject<HTMLInputElement | null> }) {
  const { panels, focusedPanel, dispatchPanel } = useTerminalOS();
  const p = panels[focusedPanel]!;

  React.useEffect(() => {
    const onFocus = () => {
      commandInputRef.current?.focus();
    };
    window.addEventListener('terminal-shell-focus', onFocus as EventListener);
    return () => window.removeEventListener('terminal-shell-focus', onFocus as EventListener);
  }, [commandInputRef]);

  return (
    <div className="flex items-center flex-none" style={{
      height: 28,
      background: DENSITY.bgSurfaceAlt,
      borderBottom: `2px solid ${DENSITY.borderColor}`,
      padding: `0 8px`,
      fontFamily: DENSITY.fontFamily,
      gap: 8,
    }}>
      <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, flexShrink: 0 }}>Panel {focusedPanel + 1} ›</span>
      <span style={{ color: DENSITY.textSecondary, fontSize: DENSITY.fontSizeTiny, flexShrink: 0 }}>{p.activeMnemonic}</span>
      <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, flexShrink: 0 }}>CMD</span>
      <input
        ref={commandInputRef}
        value={p.commandInput}
        onChange={(e) => dispatchPanel(focusedPanel, { type: 'SET_COMMAND_INPUT', value: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('terminal-execute-go', { detail: { panelIdx: focusedPanel } }));
          }
        }}
        placeholder="AAPL US DES GO   or   WEI GO   — F2 MENU   Ctrl+K SEARCH"
        className="flex-1 bg-transparent outline-none border-none min-w-0"
        style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }}
        autoComplete="off" spellCheck={false}
      />
      <button type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('terminal-execute-go', { detail: { panelIdx: focusedPanel } }))}
        style={{ background: DENSITY.accentAmber, color: '#000', border: 'none', padding: '2px 10px', fontWeight: 700, fontSize: DENSITY.fontSizeTiny, cursor: 'pointer', fontFamily: DENSITY.fontFamily, flexShrink: 0 }}>
        GO
      </button>
      <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, flexShrink: 0 }}>F1 Help · F2 Menu · Ctrl+K Search · Esc Clear</span>
    </div>
  );
}

function TerminalWorkbenchInner({ bootCommand }: { bootCommand?: string }) {
  const { settings } = useSettings();
  const { focusedPanel, dispatchPanel } = useTerminalOS();
  const commandInputRef = React.useRef<HTMLInputElement>(null);
  const baseFontSize = settings.fontSize === 'lg' ? '13px' : settings.fontSize === 'md' ? '12px' : '11px';
  const bg = settings.contrastMode === 'high' ? DENSITY.panelBg : DENSITY.bgBase;
  const bootedRef = React.useRef(false);

  React.useEffect(() => {
    if (bootedRef.current || !bootCommand) return;
    bootedRef.current = true;
    dispatchPanel(focusedPanel, { type: 'SET_COMMAND_INPUT', value: bootCommand });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('terminal-execute-go', { detail: { panelIdx: focusedPanel } }));
    }, 0);
  }, [bootCommand, dispatchPanel, focusedPanel]);

  React.useEffect(() => {
    const onShellCommand = (ev: Event) => {
      const detail = (ev as CustomEvent<{ command?: string }>).detail;
      const cmd = detail?.command?.trim();
      if (!cmd) return;
      dispatchPanel(focusedPanel, { type: 'SET_COMMAND_INPUT', value: cmd });
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('terminal-execute-go', { detail: { panelIdx: focusedPanel } }));
      }, 0);
      commandInputRef.current?.focus();
    };
    window.addEventListener('terminal-shell-command', onShellCommand as EventListener);
    return () => window.removeEventListener('terminal-shell-command', onShellCommand as EventListener);
  }, [dispatchPanel, focusedPanel]);

  return (
    <div
      className="flex flex-col w-[100vw] h-[100dvh] overflow-hidden"
      style={{ background: bg, fontFamily: DENSITY.fontFamily, fontSize: baseFontSize, color: DENSITY.textPrimary }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <SystemStrip />
      <CommandStateStrip commandInputRef={commandInputRef} />
      <NewPanelGrid />
      <TerminalInspector />
      <TerminalContextMenu />
    </div>
  );
}

export function NewTerminalWorkbench({ bootCommand }: { bootCommand?: string } = {}) {
  return (
    <TerminalProvider>
      <TerminalOSProvider>
        <DrillProvider>
          <TerminalWorkbenchInner bootCommand={bootCommand} />
        </DrillProvider>
      </TerminalOSProvider>
    </TerminalProvider>
  );
}
