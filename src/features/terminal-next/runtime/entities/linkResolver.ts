import type { EntityRef, EntityKind } from './types';
import type { MarketSector } from '../panelState';
import { suggestMnemonicsForEntityKind } from '../../mnemonics/catalog';

// ── DrillIntent ───────────────────────────────────────────────────────────────
export type DrillIntent =
  | 'OPEN_IN_PLACE'     // default left-click: navigate current panel
  | 'OPEN_IN_NEW_PANEL' // Shift+click: send to next available panel
  | 'OPEN_IN_NEW_PANE'  // alias for OPEN_IN_NEW_PANEL
  | 'INSPECT_OVERLAY'   // Alt+click: open inspector without leaving
  | 'APPEND_TO_STACK';  // internal: push to history without visual change

// ── Resolved action from LinkResolver ────────────────────────────────────────
export interface DrillAction {
  panelIdx: number;       // which panel to act on
  mnemonic: string;       // which function to run
  security?: string;      // security string (if applicable)
  sector?: MarketSector;
  intent: DrillIntent;
  inspectorEntity?: EntityRef; // for INSPECT_OVERLAY
}

function dynamicMnemonicForEntity(kind: EntityKind, fallback: string): string {
  const suggested = suggestMnemonicsForEntityKind(kind, 1)[0];
  return suggested?.code ?? fallback;
}

// Last-used mnemonic per security per panel stored in session memory
const lastMnemonicStore = new Map<string, string>();
export function setLastMnemonic(panelIdx: number, security: string, mnemonic: string) {
  lastMnemonicStore.set(`${panelIdx}:${security}`, mnemonic);
}
export function getLastMnemonic(panelIdx: number, security: string, fallback: string): string {
  return lastMnemonicStore.get(`${panelIdx}:${security}`) ?? fallback;
}

// ── Sector inference ─────────────────────────────────────────────────────────
function inferSector(sym: string): MarketSector {
  const u = sym.toUpperCase();
  if (u.includes('CURNCY') || u.includes('FX') || u.length === 6 && /^[A-Z]{6}$/.test(u)) return 'CURNCY';
  if (u.includes('INDEX') || u.includes(' INDEX')) return 'INDEX';
  if (u.includes('COMDTY') || u.includes('CMDTY')) return 'COMDTY';
  if (u.includes('CORP') || /\d+\.\d+/.test(u)) return 'CORP';
  if (u.includes('GOVT')) return 'GOVT';
  return 'EQUITY';
}

// ── Find best free or fallback panel ─────────────────────────────────────────
export function findTargetPanel(currentPanel: number, totalPanels = 4, orderedPanels?: number[]): number {
  if (orderedPanels && orderedPanels.length > 0) {
    const at = orderedPanels.indexOf(currentPanel);
    if (at >= 0 && at < orderedPanels.length - 1) return orderedPanels[at + 1]!;
    return orderedPanels[0]!;
  }
  return (currentPanel + 1) % totalPanels;
}

// ── LinkResolver — decides what happens for any entity click ─────────────────
export function resolveLink(
  entity: EntityRef,
  intent: DrillIntent,
  currentPanelIdx: number,
  currentMnemonic: string,
  options?: { totalPanels?: number; orderedPanels?: number[]; targetPanelIdx?: number },
): DrillAction {
  const normalizedIntent: DrillIntent = intent === 'OPEN_IN_NEW_PANE' ? 'OPEN_IN_NEW_PANEL' : intent;
  // INSPECT_OVERLAY doesn't navigate, just opens inspector
  if (normalizedIntent === 'INSPECT_OVERLAY') {
    return {
      panelIdx: currentPanelIdx,
      mnemonic: currentMnemonic,
      intent: normalizedIntent,
      inspectorEntity: entity,
    };
  }

  const targetPanel = normalizedIntent === 'OPEN_IN_NEW_PANEL'
    ? (options?.targetPanelIdx ?? findTargetPanel(currentPanelIdx, options?.totalPanels ?? 4, options?.orderedPanels))
    : currentPanelIdx;

  switch (entity.kind) {
    case 'SECURITY':
    case 'INDEX':
    case 'FX':
    case 'FUTURE':
    case 'OPTION':
    case 'ETF':
    case 'COMPANY': {
      const sym = (entity.payload as { sym: string }).sym;
      const dynamicDefault = dynamicMnemonicForEntity(entity.kind, 'DES');
      const mnemonic = normalizedIntent === 'OPEN_IN_NEW_PANEL'
        ? dynamicDefault
        : getLastMnemonic(currentPanelIdx, sym, dynamicDefault);
      return {
        panelIdx: targetPanel,
        mnemonic,
        security: sym,
        sector: inferSector(sym),
        intent: normalizedIntent,
      };
    }

    case 'SECTOR': {
      const s = entity.payload as { name: string };
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('SECTOR', 'IMAP'), security: s.name, sector: 'EQUITY', intent: normalizedIntent };
    }
    case 'INDUSTRY': {
      const s = entity.payload as { name: string };
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('INDUSTRY', 'RELS'), security: s.name, sector: 'EQUITY', intent: normalizedIntent };
    }
    case 'COUNTRY': {
      const c = entity.payload as { iso2: string; name: string };
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('COUNTRY', 'CTY'), security: c.name, sector: 'INDEX', intent: normalizedIntent };
    }
    case 'PERSON':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('PERSON', 'MGMT'), intent: normalizedIntent };
    case 'HOLDER':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('HOLDER', 'OWN'), intent: normalizedIntent };
    case 'NEWS':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('NEWS', 'TOP'), intent: normalizedIntent };
    case 'EVENT':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('EVENT', 'EVT'), intent: normalizedIntent };
    case 'FIELD':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('FIELD', 'LINE'), security: (entity.payload as { fieldName: string }).fieldName, intent: normalizedIntent };
    case 'RATE':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('RATE', 'CURV'), security: (entity.payload as { fieldName: string }).fieldName, intent: normalizedIntent };
    case 'FUNCTION': {
      const fn = entity.payload as { code: string };
      return { panelIdx: targetPanel, mnemonic: fn.code, intent: normalizedIntent };
    }
    case 'MONITOR':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('MONITOR', 'MON+'), intent: normalizedIntent };
    case 'WORKSPACE':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('WORKSPACE', 'WS'), intent: normalizedIntent };
    case 'ALERT':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity('ALERT', 'ALRT+'), intent: normalizedIntent };
    case 'ORDER':
    case 'TRADE':
      return { panelIdx: targetPanel, mnemonic: dynamicMnemonicForEntity(entity.kind, 'BLTR'), intent: normalizedIntent };
    default:
      return { panelIdx: targetPanel, mnemonic: currentMnemonic, intent: normalizedIntent };
  }
}
