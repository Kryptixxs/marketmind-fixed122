import type { EntityRef, EntityKind } from './types';
import type { MarketSector } from '../panelState';

// ── DrillIntent ───────────────────────────────────────────────────────────────
export type DrillIntent =
  | 'OPEN_IN_PLACE'     // default left-click: navigate current panel
  | 'OPEN_IN_NEW_PANEL' // Shift+click: send to next available panel
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

// ── Default mnemonic for each entity kind ────────────────────────────────────
const KIND_TO_MNEMONIC: Partial<Record<EntityKind, string>> = {
  SECURITY: 'DES',
  INDEX:    'DES',
  FX:       'DES',
  FUTURE:   'DES',
  OPTION:   'DES',
  ETF:      'DES',
  COMPANY:  'DES',
  SECTOR:   'RELS',
  INDUSTRY: 'RELS',
  COUNTRY:  'WEI',
  PERSON:   'MGMT',
  HOLDER:   'OWN',
  NEWS:     'TOP',
  EVENT:    'EVT',
  FIELD:    'DES',
  FUNCTION: 'DES',
  ORDER:    'BLTR',
  TRADE:    'BLTR',
};

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
export function findTargetPanel(currentPanel: number, totalPanels = 4): number {
  // Next panel clockwise
  return (currentPanel + 1) % totalPanels;
}

// ── LinkResolver — decides what happens for any entity click ─────────────────
export function resolveLink(
  entity: EntityRef,
  intent: DrillIntent,
  currentPanelIdx: number,
  currentMnemonic: string,
): DrillAction {
  // INSPECT_OVERLAY doesn't navigate, just opens inspector
  if (intent === 'INSPECT_OVERLAY') {
    return {
      panelIdx: currentPanelIdx,
      mnemonic: currentMnemonic,
      intent,
      inspectorEntity: entity,
    };
  }

  const targetPanel = intent === 'OPEN_IN_NEW_PANEL'
    ? findTargetPanel(currentPanelIdx)
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
      const mnemonic = intent === 'OPEN_IN_NEW_PANEL'
        ? 'DES'
        : getLastMnemonic(currentPanelIdx, sym, KIND_TO_MNEMONIC[entity.kind] ?? 'DES');
      return {
        panelIdx: targetPanel,
        mnemonic,
        security: sym,
        sector: inferSector(sym),
        intent,
      };
    }

    case 'SECTOR': {
      const s = entity.payload as { name: string };
      return { panelIdx: targetPanel, mnemonic: 'IMAP', security: s.name, sector: 'EQUITY', intent };
    }
    case 'INDUSTRY': {
      const s = entity.payload as { name: string };
      return { panelIdx: targetPanel, mnemonic: 'RELS', security: s.name, sector: 'EQUITY', intent };
    }
    case 'COUNTRY': {
      const c = entity.payload as { iso2: string; name: string };
      return { panelIdx: targetPanel, mnemonic: 'WEI', security: c.name, sector: 'INDEX', intent };
    }
    case 'PERSON':
      return { panelIdx: targetPanel, mnemonic: 'MGMT', intent };
    case 'HOLDER':
      return { panelIdx: targetPanel, mnemonic: 'OWN', intent };
    case 'NEWS':
      return { panelIdx: targetPanel, mnemonic: 'TOP', intent };
    case 'EVENT':
      return { panelIdx: targetPanel, mnemonic: 'EVT', intent };
    case 'FIELD':
      return { panelIdx: targetPanel, mnemonic: 'DES', intent, inspectorEntity: intent === 'INSPECT_OVERLAY' ? entity : undefined };
    case 'FUNCTION': {
      const fn = entity.payload as { code: string };
      return { panelIdx: targetPanel, mnemonic: fn.code, intent };
    }
    case 'ORDER':
    case 'TRADE':
      return { panelIdx: targetPanel, mnemonic: 'BLTR', intent };
    default:
      return { panelIdx: targetPanel, mnemonic: currentMnemonic, intent };
  }
}
