'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { EntityRef } from './types';
import { resolveLink, setLastMnemonic, type DrillIntent } from './linkResolver';
import { useTerminalOS } from '../TerminalOSContext';
import type { MarketSector } from '../panelState';
import { appendAuditEvent } from '../commandAuditStore';
import { intentFromMouseEvent } from '../interaction';
import { loadPolicyState } from '../policyStore';
import { guardRuntimeAction } from '../actionGuard';
import { getDockLayout, getDockPaneOrder, getNextDockPane, insertPaneRelative } from '../dockLayoutStore';

interface InspectorState {
  open: boolean;
  entity: EntityRef | null;
  panelIdx: number;
  pinned: boolean;
  history: EntityRef[];
  historyIdx: number;
}

interface DrillContextValue {
  drill: (entity: EntityRef, intent: DrillIntent, fromPanelIdx?: number) => void;
  inspector: InspectorState;
  openInspector: (entity: EntityRef, panelIdx: number) => void;
  closeInspector: () => void;
  pinInspector: (v: boolean) => void;
  inspectorBack: () => void;
  inspectorForward: () => void;
}

const DrillCtx = createContext<DrillContextValue | null>(null);

export function DrillProvider({ children }: { children: React.ReactNode }) {
  const { navigatePanel, panels, addPanel, focusedPanel } = useTerminalOS();
  const [inspector, setInspector] = useState<InspectorState>({
    open: false, entity: null, panelIdx: 0, pinned: false, history: [], historyIdx: -1,
  });

  const pushInspector = useCallback((entity: EntityRef, panelIdx: number) => {
    setInspector((s) => {
      const base = s.historyIdx >= 0 ? s.history.slice(0, s.historyIdx + 1) : s.history;
      const last = base[base.length - 1];
      const nextHistory = last?.id === entity.id && last?.kind === entity.kind ? base : [...base, entity].slice(-30);
      const nextIdx = nextHistory.length - 1;
      return { ...s, open: true, entity, panelIdx, history: nextHistory, historyIdx: nextIdx };
    });
  }, []);

  const drill = useCallback((entity: EntityRef, intent: DrillIntent, fromPanelIdx?: number) => {
    const srcPanelIdx = typeof fromPanelIdx === 'number' ? fromPanelIdx : focusedPanel;
    const normalizedIntent: DrillIntent = intent === 'OPEN_IN_NEW_PANE' ? 'OPEN_IN_NEW_PANEL' : intent;
    const policy = loadPolicyState();
    const currentPanel = panels[srcPanelIdx];
    const currentMnemonic = currentPanel?.activeMnemonic ?? 'DES';
    if (normalizedIntent === 'OPEN_IN_NEW_PANEL') {
      if (!guardRuntimeAction({
        panelIdx: srcPanelIdx,
        permission: 'SEND_TO_PANEL',
        detail: 'Blocked send-to-panel drill',
        mnemonic: currentPanel?.activeMnemonic,
        security: currentPanel?.activeSecurity,
        deniedMessage: 'Send-to-panel blocked by compliance policy.',
        deniedRecovery: 'Open COMP/POL/ENT and retry under allowed mode.',
        actorOverride: policy.activeRole,
      })) {
        return;
      }
    }

    const workspace = getDockLayout().activeWorkspace;
    const orderedPanels = getDockPaneOrder(workspace);
    let targetPanelOverride: number | undefined;
    if (normalizedIntent === 'OPEN_IN_NEW_PANEL') {
      targetPanelOverride = getNextDockPane(srcPanelIdx, workspace) ?? undefined;
      if (targetPanelOverride === undefined || targetPanelOverride === srcPanelIdx) {
        const next = addPanel(srcPanelIdx);
        insertPaneRelative(srcPanelIdx, next, 'tab', workspace);
        targetPanelOverride = next;
      }
    }
    const action = resolveLink(entity, normalizedIntent, srcPanelIdx, currentMnemonic, {
      orderedPanels,
      totalPanels: panels.length,
      targetPanelIdx: targetPanelOverride,
    });

    if (action.intent === 'INSPECT_OVERLAY' && action.inspectorEntity) {
      appendAuditEvent({
        panelIdx: srcPanelIdx,
        type: 'DRILL',
        actor: 'USER',
        detail: `${entity.kind} ${entity.display} -> INSPECT`,
        mnemonic: currentMnemonic,
        security: currentPanel?.activeSecurity,
      });
      pushInspector(action.inspectorEntity!, srcPanelIdx);
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
    appendAuditEvent({
      panelIdx: srcPanelIdx,
      type: 'DRILL',
      actor: 'USER',
      detail: `${entity.kind} ${entity.display} -> ${action.mnemonic} ${action.security ?? ''}`.trim(),
      mnemonic: action.mnemonic,
      security: action.security ?? currentPanel?.activeSecurity,
    });

  }, [panels, navigatePanel, addPanel, focusedPanel, pushInspector]);

  const openInspector = useCallback((entity: EntityRef, panelIdx: number) => {
    pushInspector(entity, panelIdx);
  }, [pushInspector]);

  const closeInspector = useCallback(() => {
    setInspector((s) => ({ ...s, open: false, entity: null }));
  }, []);

  const pinInspector = useCallback((v: boolean) => {
    setInspector((s) => ({ ...s, pinned: v }));
  }, []);

  const inspectorBack = useCallback(() => {
    setInspector((s) => {
      if (s.historyIdx <= 0) return s;
      const idx = s.historyIdx - 1;
      return { ...s, historyIdx: idx, entity: s.history[idx] ?? s.entity };
    });
  }, []);

  const inspectorForward = useCallback(() => {
    setInspector((s) => {
      if (s.historyIdx >= s.history.length - 1) return s;
      const idx = s.historyIdx + 1;
      return { ...s, historyIdx: idx, entity: s.history[idx] ?? s.entity };
    });
  }, []);

  return (
    <DrillCtx.Provider value={{ drill, inspector, openInspector, closeInspector, pinInspector, inspectorBack, inspectorForward }}>
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
    const intent: DrillIntent = intentFromMouseEvent(e);
    drill(entity, intent, fromPanelIdx);
  }, [entity, fromPanelIdx, drill]);
}
