'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { NewPanelFrame } from './NewPanelFrame';
import { NewFunctionRouter } from './NewFunctionRouter';
import { useTerminalOS } from './TerminalOSContext';
import { getDockLayout, loadDockLayout, setDockLayout, subscribeDockLayout } from './dockLayoutStore';
import { listPinItems } from './pinboardStore';
import { MNEMONIC_DEFS } from './MnemonicRegistry';

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
  const nonFloating = panelIndices.filter((idx) => !dockState.floatingPanels.includes(idx));
  const visible = dockState.focusFullscreen ? [focusedPanel] : nonFloating;
  const columns = Math.max(1, Math.min(4, dockState.columns));
  const gridColumns = dockState.mode === 'stack'
    ? '1fr'
    : dockState.mode === 'tab'
      ? '1fr'
      : `repeat(${columns}, minmax(0, 1fr))`;
  const categories = React.useMemo(() => {
    const groups = new Map<string, string[]>();
    Object.values(MNEMONIC_DEFS).forEach((d) => {
      const key = d.code.includes('.') ? d.code.split('.')[0]! : d.code.slice(0, 3);
      const current = groups.get(key) ?? [];
      current.push(d.code);
      groups.set(key, current);
    });
    return Array.from(groups.entries()).slice(0, 24);
  }, []);

  return (
    <div className="relative flex flex-1 min-h-0 overflow-hidden" style={{ background: DENSITY.gridlineColor }}>
      {dockState.navtreeVisible && (
        <div className="flex-none overflow-auto terminal-scrollbar" style={{ width: 220, background: '#040404', borderRight: `1px solid ${DENSITY.gridlineColor}` }}>
          <div style={{ height: DENSITY.toolbarHeightPx, display: 'flex', alignItems: 'center', padding: `0 ${DENSITY.pad4}px`, color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>
            NAVTREE
          </div>
          {categories.map(([group, codes]) => (
            <div key={group} style={{ borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `${DENSITY.pad2}px ${DENSITY.pad4}px` }}>
              <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>{group}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {codes.slice(0, 8).map((c) => (
                  <button key={c} type="button" style={{ border: `1px solid ${DENSITY.borderColor}`, padding: '0 3px', color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny }} onClick={() => navigatePanel(focusedPanel, c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
        <div className="grid flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns: gridColumns, gridAutoRows: 'minmax(0, 1fr)', gap: 0, background: DENSITY.gridlineColor }}>
          {visible.map((idx) => (
            <NewPanelFrame key={idx} panelIdx={idx}>
              <NewFunctionRouter panelIdx={idx} />
            </NewPanelFrame>
          ))}
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
