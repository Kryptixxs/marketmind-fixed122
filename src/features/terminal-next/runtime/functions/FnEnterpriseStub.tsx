'use client';

import React from 'react';
import { EmptyFill, PanelSubHeader, StatusBadge } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import { NextActionsStrip } from '../ui/NextActionsStrip';

export function FnEnterpriseStub({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const def = MNEMONIC_DEFS[p.activeMnemonic] ?? {
    code: p.activeMnemonic,
    title: 'Enterprise Function',
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader
        title={`${def.code} • ${def.title}`}
        right={<StatusBadge label="SIM" variant="sim" />}
      />
      <NextActionsStrip panelIdx={panelIdx} />
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar" style={{ padding: DENSITY.pad4 }}>
        <div style={{ border: `1px solid ${DENSITY.borderColor}`, padding: DENSITY.pad4, background: '#060606' }}>
          <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase' }}>
            Enterprise Scaffold
          </div>
          <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, marginTop: 2 }}>
            {def.title} is registered and routable. This panel already supports keyboard-first navigation,
            context menu, inspector drill semantics, and next-actions strip.
          </div>
          <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, marginTop: 2 }}>
            Use MENU or command line to continue workflow while this function is deepened.
          </div>
        </div>
        <EmptyFill hint={`READY FOR DEEPENING — ${def.code} ${p.activeSecurity}`} />
      </div>
    </div>
  );
}
