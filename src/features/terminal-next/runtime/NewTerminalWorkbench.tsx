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

function GlobalStatusBar() {
  const { panels, focusedPanel, navigatePanel } = useTerminalOS();
  const { state } = useTerminalStore();
  const p = panels[focusedPanel]!;
  const [time, setTime] = React.useState({ est: '', gmt: '' });

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const est = `${String((now.getUTCHours() - 4 + 24) % 24).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
      const gmt = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
      setTime({ est, gmt });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const alertInfo = useMemo(() => {
    const rules = loadAlertRules();
    const triggered = evaluateTriggeredRules(rules, state.quotes);
    return { total: rules.length, triggered: triggered.length };
  }, [state.tickMs]);

  const fps = state.workerAnalytics?.uiFps ?? 60;
  const latency = state.workerAnalytics?.workerLatencyMs ?? 0;

  return (
    <div
      className="flex items-center justify-between flex-none select-none"
      style={{ height: 16, background: DENSITY.bgSurface, borderTop: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily, color: DENSITY.textMuted }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: DENSITY.accentGreen }}>● B-PIPE</span>
        <span style={{ color: DENSITY.textDim }}>P{focusedPanel + 1}: {p.activeMnemonic} — {p.activeSecurity}</span>
        {p.linkGroup && <span>[LNK:{p.linkGroup.toUpperCase()}]</span>}
        {/* Alert badge */}
        {alertInfo.triggered > 0 && (
          <button type="button"
            style={{ color: '#fff', background: DENSITY.accentRed, fontSize: '8px', border: 'none', padding: '0 3px', cursor: 'pointer' }}
            onClick={() => navigatePanel(focusedPanel, 'ALRT')}>
            ● ALRT {alertInfo.triggered}/{alertInfo.total}
          </button>
        )}
        {alertInfo.triggered === 0 && alertInfo.total > 0 && (
          <span style={{ color: DENSITY.textMuted, fontSize: '8px' }}>ALRT {alertInfo.total}</span>
        )}
        {/* IB badge */}
        <button type="button"
          style={{ color: DENSITY.accentCyan, fontSize: '8px', background: 'none', border: `1px solid ${DENSITY.accentCyan}`, padding: '0 2px', cursor: 'pointer' }}
          onClick={() => navigatePanel(focusedPanel, 'IB')}>
          IB
        </button>
        {/* MON badge */}
        <button type="button"
          style={{ color: DENSITY.textDim, fontSize: '8px', background: 'none', border: `1px solid ${DENSITY.gridlineColor}`, padding: '0 2px', cursor: 'pointer' }}
          onClick={() => navigatePanel(focusedPanel, 'MON')}>
          MON
        </button>
      </div>
      <div className="flex items-center gap-3" style={{ color: DENSITY.textMuted, fontSize: '8px' }}>
        <span>Latency:{latency}ms  FPS:{fps}</span>
        <span>|</span>
        <span>F1=HELP F2=MENU Ctrl+K=SRCH Ctrl+B=BACK Shift+Click=Panel Alt+Click=Inspect</span>
        <span>|</span>
        <span>EST {time.est}</span>
        <span>GMT {time.gmt}</span>
        <span style={{ color: DENSITY.accentCyan }}>SIM</span>
      </div>
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
      <NewPanelGrid />
      <GlobalStatusBar />
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
