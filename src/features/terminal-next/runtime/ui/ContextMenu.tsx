'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useDrill } from '../entities/DrillContext';
import { loadAlertRules, addAlertRule } from '../../services/alertMonitor';
import { useTerminalOS } from '../TerminalOSContext';
import type { EntityRef } from '../entities/types';
import { makeFunction } from '../entities/types';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import type { EntityKind } from '../entities/types';
import { addToMonitorList } from '../monitorListStore';
import { addSecurityNote } from '../securityNotesStore';
import { appendAuditEvent } from '../commandAuditStore';
import { loadPolicyState } from '../policyStore';
import { guardRuntimeAction } from '../actionGuard';

// ── Actions per entity kind ─────────────────────────────────────────────────
const KIND_ACTIONS: Partial<Record<EntityKind, string[]>> = {
  SECURITY: ['DES', 'GP', 'CN', 'HP', 'OWN', 'RELG', 'RELT', 'IMP', 'OUT', 'PATH', 'NEX', 'XDRV', 'SCN', 'SCN.R', 'FAC', 'CUST', 'SUPP', 'BETA.X', 'REGI', 'HEDGE', 'SHOCK.G', 'CMPY', 'SECT', 'INDY', 'CTY', 'CITY', 'ALRT'],
  INDEX:    ['DES', 'GP', 'WEI', 'IMAP'],
  ETF:      ['DES', 'GP', 'HP', 'OWN'],
  FX:       ['DES', 'GP', 'FXC', 'XDRV', 'BETA.X'],
  SECTOR:   ['IMAP', 'RELS', 'SECT', 'REGI', 'XDRV'],
  INDUSTRY: ['RELS', 'IMAP', 'INDY', 'SCN', 'SUPP'],
  COUNTRY:  ['WEI', 'ECO', 'RGN', 'RGN.N', 'RGN.M', 'RGN.R', 'GEO', 'GEO.R', 'GEO.M', 'GEO.A', 'CTY', 'CITY'],
  PERSON:   ['MGMT', 'OWN'],
  HOLDER:   ['OWN', 'DES'],
  NEWS:     ['TOP', 'CN', 'NMAP', 'NREL', 'NEX', 'NTIM', 'NQ'],
  FIELD:    ['DES', 'FA', 'LINE', 'FLD'],
  FUNCTION: ['DES', 'AUD', 'NAV', 'NX'],
  MONITOR:  ['MON', 'MON+', 'ALRT+'],
  WORKSPACE:['WS', 'DOCK', 'LAYOUT'],
  ALERT:    ['ALRT', 'ALRT+', 'MON+'],
  ORDER:    ['BLTR', 'ORD'],
  TRADE:    ['BLTR'],
  EVENT:    ['EVT', 'DES'],
};

function getKindActions(kind: EntityKind): string[] {
  return KIND_ACTIONS[kind] ?? ['DES'];
}

interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  entity: EntityRef | null;
  panelIdx: number;
}

// ── Global context menu state (singleton) ────────────────────────────────────
let setGlobalMenu: ((s: ContextMenuState) => void) | null = null;

export function openContextMenu(e: React.MouseEvent, entity: EntityRef, panelIdx: number) {
  e.preventDefault();
  e.stopPropagation();
  if (!setGlobalMenu) return;
  setGlobalMenu({ open: true, x: e.clientX, y: e.clientY, entity, panelIdx });
}

export function openContextMenuAt(x: number, y: number, entity: EntityRef, panelIdx: number) {
  if (!setGlobalMenu) return;
  setGlobalMenu({ open: true, x, y, entity, panelIdx });
}

// ── ContextMenu component ─────────────────────────────────────────────────────
export function TerminalContextMenu() {
  const [state, setState] = useState<ContextMenuState>({ open: false, x: 0, y: 0, entity: null, panelIdx: 0 });
  const { drill } = useDrill();
  const { panels } = useTerminalOS();
  const menuRef = useRef<HTMLDivElement>(null);

  // Register setter for external triggers
  useEffect(() => {
    setGlobalMenu = setState;
    return () => { setGlobalMenu = null; };
  }, []);

  // Close on click-outside, Escape
  useEffect(() => {
    if (!state.open) return;
    const close = () => setState((s) => ({ ...s, open: false }));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [state.open]);

  if (!state.open || !state.entity) return null;

  const entity = state.entity;
  const close = () => setState((s) => ({ ...s, open: false }));
  const sym = 'sym' in entity.payload ? (entity.payload as { sym: string }).sym : entity.display;
  const kindActions = getKindActions(entity.kind);

  const items: ContextMenuItem[] = [
    // Header (disabled, label only)
    { label: `${entity.kind}: ${entity.display.slice(0, 30)}`, action: () => {}, disabled: true },
    { label: '─────────────────', action: () => {}, disabled: true },
    // Open
    { label: '▶  Open (DES)', icon: '▶', action: () => { close(); drill(entity, 'OPEN_IN_PLACE', state.panelIdx); } },
    { label: '↗  Open in new pane', icon: '↗', action: () => { close(); drill(entity, 'OPEN_IN_NEW_PANE', state.panelIdx); } },
    { label: '🔍  Inspect (overlay)', action: () => { close(); drill(entity, 'INSPECT_OVERLAY', state.panelIdx); } },
    { label: '─────────────────', action: () => {}, disabled: true },
    // Kind-specific mnemonics
    ...kindActions.map((code) => ({
      label: `   ${code} — ${MNEMONIC_DEFS[code]?.title ?? code}`,
      action: () => {
        close();
        drill(makeFunction(code, MNEMONIC_DEFS[code]?.title), 'OPEN_IN_PLACE', state.panelIdx);
      },
    })),
    { label: '─────────────────', action: () => {}, disabled: true },
    // Utilities
    {
      label: '📋  Copy ID',
      action: () => {
        close();
        const policy = loadPolicyState();
        if (!guardRuntimeAction({
          panelIdx: state.panelIdx,
          permission: 'COPY',
          detail: 'Blocked copy symbol from context menu',
          mnemonic: panels[state.panelIdx]?.activeMnemonic,
          security: sym,
          deniedMessage: 'Copy blocked by compliance lock.',
          deniedRecovery: 'Disable no-copy mode in COMP or adjust ENT/POL.',
          actorOverride: policy.activeRole,
        })) {
          return;
        }
        void navigator.clipboard?.writeText(entity.id || sym).catch(() => {});
      },
    },
    {
      label: '★  Add to monitor',
      action: () => {
        close();
        addToMonitorList(sym);
        appendAuditEvent({ panelIdx: state.panelIdx, type: 'DRILL', actor: 'USER', detail: `Add monitor ${sym}`, mnemonic: 'MON', security: sym });
      },
    },
  ];

  if (entity.kind === 'SECURITY' || entity.kind === 'COMPANY') {
    items.push({
      label: '📝  Add note',
      action: () => {
        close();
        const text = window.prompt(`Add note for ${sym}`);
        if (!text) return;
        const note = addSecurityNote(sym, text);
        if (!note) return;
        appendAuditEvent({ panelIdx: state.panelIdx, type: 'NOTE_ADD', actor: 'USER', detail: `Note on ${sym}`, mnemonic: 'NOTES', security: sym });
      },
    });
  }

  // If numeric field, add alert action
  if (entity.kind === 'FIELD') {
    const fp = entity.payload as { fieldName: string; value?: unknown };
    if (typeof fp.value === 'number') {
      items.push({
        label: `🔔  Alert on ${fp.fieldName}`,
        action: () => {
          close();
          const policy = loadPolicyState();
          if (!guardRuntimeAction({
            panelIdx: state.panelIdx,
            permission: 'ALERT_CREATE',
            detail: `Blocked alert create for ${sym}`,
            mnemonic: 'ALRT',
            security: sym,
            deniedMessage: 'Alert creation blocked by policy/entitlement.',
            deniedRecovery: 'Review ENT/COMP/POL and retry under an allowed role.',
            actorOverride: policy.activeRole,
          })) {
            return;
          }
          const val = Number(fp.value);
          addAlertRule(`ALERT IF ${sym} > ${(val * 1.02).toFixed(2)}`);
          appendAuditEvent({ panelIdx: state.panelIdx, type: 'ALERT_CREATE', actor: 'USER', detail: `Alert ${sym} > ${(val * 1.02).toFixed(2)}`, mnemonic: 'ALRT', security: sym });
        },
      });
    }
  }

  // Clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 220;
  const menuH = Math.min(items.length * 19 + 8, 360);
  const x = state.x + menuW > vw ? state.x - menuW : state.x;
  const y = state.y + menuH > vh ? state.y - menuH : state.y;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999]"
      style={{
        left: x, top: y, width: menuW,
        background: '#080808',
        border: `1px solid ${DENSITY.borderColor}`,
        fontFamily: DENSITY.fontFamily,
        fontSize: DENSITY.fontSizeDefault,
        boxShadow: '2px 2px 8px rgba(0,0,0,0.8)',
        overflowY: 'auto',
        maxHeight: 360,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <div
          key={i}
          onClick={item.disabled ? undefined : item.action}
          style={{
            height: item.label.startsWith('──') ? 1 : 19,
            padding: item.label.startsWith('──') ? 0 : `0 ${DENSITY.pad4}px`,
            background: item.label.startsWith('──') ? DENSITY.borderColor : undefined,
            color: item.disabled ? DENSITY.textMuted : DENSITY.textPrimary,
            cursor: item.disabled ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center',
          }}
          className={item.disabled ? '' : 'hover:bg-[#1a2a3a]'}
        >
          {!item.label.startsWith('──') && item.label}
        </div>
      ))}
    </div>
  );
}
