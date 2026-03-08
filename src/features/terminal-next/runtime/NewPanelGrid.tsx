'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { NewPanelFrame } from './NewPanelFrame';
import { NewFunctionRouter } from './NewFunctionRouter';
import { useTerminalOS } from './TerminalOSContext';
import {
  getDockLayout,
  loadDockLayout,
  setDockLayout,
  subscribeDockLayout,
  type DockNode,
  setActiveDockTab,
  ensurePaneInDock,
  getDockPaneOrder,
} from './dockLayoutStore';
import { listPinItems } from './pinboardStore';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { NavTreeRail } from './NavTreeRail';

function ResizeHandle() {
  return (
    <Separator
      style={{
        background: DENSITY.groupSeparator,
        width: 2,
        height: 2,
      }}
    />
  );
}

function DockTree({
  node,
  panels,
  focusedPanel,
  setFocusedPanel,
  workspace,
}: {
  node: DockNode;
  panels: ReturnType<typeof useTerminalOS>['panels'];
  focusedPanel: number;
  setFocusedPanel: (idx: number) => void;
  workspace: 'left' | 'right';
}) {
  if (node.type === 'tabs') {
    const tabs = node.tabs.filter((idx) => panels[idx] != null);
    if (tabs.length === 0) {
      return <div className="flex-1 min-h-0" style={{ background: DENSITY.panelBg }} />;
    }
    const active = tabs.includes(node.activeTab) ? node.activeTab : tabs[0]!;
    const panel = panels[active]!;
    return (
      <div className="flex flex-col min-h-0 h-full overflow-hidden" style={{ background: DENSITY.panelBg }}>
        <div
          className="flex items-center gap-1 overflow-x-auto terminal-scrollbar flex-none"
          style={{ height: 16, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad2}px` }}
        >
          {tabs.map((idx) => {
            const p = panels[idx]!;
            const isActive = idx === active;
            const isFocused = idx === focusedPanel;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveDockTab(idx, workspace);
                  setFocusedPanel(idx);
                }}
                style={{
                  height: 13,
                  border: `1px solid ${isActive ? DENSITY.rowSelectedMarker : DENSITY.borderColor}`,
                  background: isActive ? DENSITY.rowSelectedBg : DENSITY.panelBg,
                  color: isFocused ? DENSITY.textPrimary : DENSITY.textSecondary,
                  fontSize: DENSITY.fontSizeTiny,
                  padding: '0 4px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                P{idx + 1} {p.activeMnemonic}
              </button>
            );
          })}
        </div>
        <div className="flex-1 min-h-0">
          <NewPanelFrame panelIdx={active}>
            <NewFunctionRouter panelIdx={active} />
          </NewPanelFrame>
        </div>
        <div
          className="flex items-center justify-between flex-none"
          style={{
            height: 12,
            borderTop: `1px solid ${DENSITY.gridlineColor}`,
            background: DENSITY.panelBgAlt,
            fontSize: DENSITY.fontSizeTiny,
            color: DENSITY.textDim,
            padding: `0 ${DENSITY.pad4}px`,
          }}
        >
          <span>{panel.activeMnemonic} • {panel.activeSecurity}</span>
          <span>TABS {tabs.length}</span>
        </div>
      </div>
    );
  }

  const orientation = node.direction === 'horizontal' ? 'horizontal' : 'vertical';
  return (
    <Group
      orientation={orientation}
      className="h-full min-h-0"
    >
      <Panel minSize={12} defaultSize={node.sizes[0]}>
        <DockTree node={node.children[0]} panels={panels} focusedPanel={focusedPanel} setFocusedPanel={setFocusedPanel} workspace={workspace} />
      </Panel>
      <ResizeHandle />
      <Panel minSize={12} defaultSize={node.sizes[1]}>
        <DockTree node={node.children[1]} panels={panels} focusedPanel={focusedPanel} setFocusedPanel={setFocusedPanel} workspace={workspace} />
      </Panel>
    </Group>
  );
}

export function NewPanelGrid() {
  const { panels, focusedPanel, navigatePanel, setFocusedPanel } = useTerminalOS();
  const [dockState, setDockStateLocal] = React.useState(() => loadDockLayout());
  const [pins, setPins] = React.useState(() => listPinItems(20));

  React.useEffect(() => subscribeDockLayout(() => setDockStateLocal(getDockLayout())), []);
  React.useEffect(() => {
    const id = window.setInterval(() => setPins(listPinItems(20)), 3000);
    return () => window.clearInterval(id);
  }, []);

  const panelIndices = React.useMemo(() => panels.map((_, idx) => idx), [panels]);
  React.useEffect(() => {
    const allAssigned = new Set(getDockPaneOrder('all'));
    panelIndices.forEach((idx) => {
      if (!dockState.floatingPanels.includes(idx) && !allAssigned.has(idx)) ensurePaneInDock(idx, dockState.activeWorkspace);
    });
  }, [panelIndices, dockState.floatingPanels, dockState.activeWorkspace, dockState.root, dockState.secondaryRoot]);
  const leftOrder = React.useMemo(() => getDockPaneOrder('left'), [dockState]);
  const rightOrder = React.useMemo(() => getDockPaneOrder('right'), [dockState]);
  const leftFocus = leftOrder.includes(focusedPanel);
  const rightFocus = rightOrder.includes(focusedPanel);

  return (
    <div className="relative flex flex-1 min-h-0 overflow-hidden" style={{ background: DENSITY.gridlineColor }}>
      {dockState.navtreeVisible && (
        <div
          className="flex-none flex flex-col h-full min-h-0 overflow-hidden"
          style={{ width: 232, borderRight: `1px solid ${DENSITY.borderColor}` }}
        >
          <NavTreeRail />
        </div>
      )}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {dockState.pinbarVisible && dockState.pinbarDock === 'top' && (
          <div className="flex items-center gap-1 overflow-x-auto terminal-scrollbar flex-none" style={{ height: 18, background: '#040404', borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px` }}>
            <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>PINBAR</span>
            {pins.map((pin) => (
              <button key={pin.id} type="button" style={{ border: `1px solid ${DENSITY.borderColor}`, padding: '0 3px', color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny }} onClick={() => navigatePanel(focusedPanel, pin.targetMnemonic, pin.targetSecurity)}>
                {pin.label}:{pin.value}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-hidden" style={{ background: DENSITY.gridlineColor }}>
          {dockState.focusFullscreen ? (
            <NewPanelFrame panelIdx={focusedPanel}>
              <NewFunctionRouter panelIdx={focusedPanel} />
            </NewPanelFrame>
          ) : dockState.twoUpMode && dockState.secondaryRoot ? (
            <div className="grid h-full min-h-0" style={{ gridTemplateColumns: '1fr 1fr', gap: 1, background: DENSITY.gridlineColor }}>
              <div style={{ minHeight: 0, border: `1px solid ${dockState.activeWorkspace === 'left' || leftFocus ? DENSITY.rowSelectedMarker : DENSITY.borderColor}` }}>
                <DockTree node={dockState.root} panels={panels} focusedPanel={focusedPanel} setFocusedPanel={setFocusedPanel} workspace="left" />
              </div>
              <div style={{ minHeight: 0, border: `1px solid ${dockState.activeWorkspace === 'right' || rightFocus ? DENSITY.rowSelectedMarker : DENSITY.borderColor}` }}>
                <DockTree node={dockState.secondaryRoot} panels={panels} focusedPanel={focusedPanel} setFocusedPanel={setFocusedPanel} workspace="right" />
              </div>
            </div>
          ) : (
            <DockTree node={dockState.root} panels={panels} focusedPanel={focusedPanel} setFocusedPanel={setFocusedPanel} workspace="left" />
          )}
        </div>
      </div>
      {dockState.floatingPanels.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {dockState.floatingPanels.map((idx, i) => (
            <div key={idx} className="pointer-events-auto absolute" style={{ left: 40 + i * 26, top: 40 + i * 22, width: 480, height: 320, border: `1px solid ${DENSITY.focusBorderColor}`, background: '#020202' }}>
              <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>
                <span>FLOAT P{idx + 1}</span>
                <button type="button" onClick={() => setDockLayout({ floatingPanels: dockState.floatingPanels.filter((x) => x !== idx) })}>ATTACH</button>
              </div>
              <div style={{ height: 'calc(100% - 18px)' }}>
                <NewPanelFrame panelIdx={idx}>
                  <NewFunctionRouter panelIdx={idx} />
                </NewPanelFrame>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
