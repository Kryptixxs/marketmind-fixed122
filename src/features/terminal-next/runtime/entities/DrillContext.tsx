'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { EntityRef } from './types';
import { resolveLink, setLastMnemonic, type DrillIntent } from './linkResolver';
import { useTerminalOS } from '../TerminalOSContext';
import type { MarketSector } from '../panelState';

interface InspectorState {
  open: boolean;
  entity: EntityRef | null;
  panelIdx: number;
  pinned: boolean;
}

interface DrillContextValue {
  drill: (entity: EntityRef, intent: DrillIntent, fromPanelIdx: number) => void;
  inspector: InspectorState;
  openInspector: (entity: EntityRef, panelIdx: number) => void;
  closeInspector: () => void;
  pinInspector: (v: boolean) => void;
}

const DrillCtx = createContext<DrillContextValue | null>(null);

export function DrillProvider({ children }: { children: React.ReactNode }) {
  const { navigatePanel, setFocusedPanel, panels } = useTerminalOS();
  const [inspector, setInspector] = useState<InspectorState>({
    open: false, entity: null, panelIdx: 0, pinned: false,
  });

  const drill = useCallback((entity: EntityRef, intent: DrillIntent, fromPanelIdx: number) => {
    const currentPanel = panels[fromPanelIdx];
    const currentMnemonic = currentPanel?.activeMnemonic ?? 'DES';

    const action = resolveLink(entity, intent, fromPanelIdx, currentMnemonic);

    if (action.intent === 'INSPECT_OVERLAY' && action.inspectorEntity) {
      setInspector((s) => ({ ...s, open: true, entity: action.inspectorEntity!, panelIdx: fromPanelIdx }));
      return;
    }

    // Update last-used mnemonic for this security
    if (action.security) {
      setLastMnemonic(action.panelIdx, action.security, action.mnemonic);
    }

    navigatePanel(
      action.panelIdx,
      action.mnemonic,
      action.security,
      action.sector as MarketSector | undefined,
    );

    if (action.intent === 'OPEN_IN_NEW_PANEL') {
      setFocusedPanel(action.panelIdx);
    }
  }, [panels, navigatePanel, setFocusedPanel]);

  const openInspector = useCallback((entity: EntityRef, panelIdx: number) => {
    setInspector((s) => ({ ...s, open: true, entity, panelIdx }));
  }, []);

  const closeInspector = useCallback(() => {
    setInspector((s) => (s.pinned ? s : { ...s, open: false, entity: null }));
  }, []);

  const pinInspector = useCallback((v: boolean) => {
    setInspector((s) => ({ ...s, pinned: v }));
  }, []);

  return (
    <DrillCtx.Provider value={{ drill, inspector, openInspector, closeInspector, pinInspector }}>
      {children}
    </DrillCtx.Provider>
  );
}

export function useDrill() {
  const ctx = useContext(DrillCtx);
  if (!ctx) throw new Error('useDrill requires DrillProvider');
  return ctx;
}

// ── Helper: make mouse event handler from entity ──────────────────────────────
export function useEntityClick(entity: EntityRef | null | undefined, fromPanelIdx: number) {
  const { drill } = useDrill();
  return useCallback((e: React.MouseEvent) => {
    if (!entity) return;
    e.stopPropagation();
    let intent: DrillIntent = 'OPEN_IN_PLACE';
    if (e.shiftKey) intent = 'OPEN_IN_NEW_PANEL';
    else if (e.altKey) intent = 'INSPECT_OVERLAY';
    drill(entity, intent, fromPanelIdx);
  }, [entity, fromPanelIdx, drill]);
}
