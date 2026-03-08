import type { PanelSnapshot } from './panelState';
import type { DockLayoutState } from './dockLayoutStore';
import type { PinItem } from './pinboardStore';

// ── Workspace persistence (localStorage + IndexedDB fallback) ─────────────────
const WS_PREFIX = 'vantage-ws2-';
export interface WorkspaceSnapshot {
  version: 2 | 3;
  name: string;
  savedAt: number;
  focusedPanel: number;
  commandHistories: string[][];
  panels: PanelSnapshot[];
  dockLayout?: DockLayoutState;
  pins?: PinItem[];
}

export function saveWorkspace(name: string, snapshot: Omit<WorkspaceSnapshot, 'name' | 'savedAt'>) {
  if (typeof window === 'undefined') return;
  const full: WorkspaceSnapshot = { ...snapshot, name, savedAt: Date.now() };
  try { localStorage.setItem(WS_PREFIX + name, JSON.stringify(full)); } catch {}
}

export function loadWorkspace(name: string): WorkspaceSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WS_PREFIX + name);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSnapshot> & {
      panels?: Array<PanelSnapshot & { historyLength?: number }>;
    };
    if (parsed.version === 2 || parsed.version === 3) return parsed as WorkspaceSnapshot;
    // Backward-compat migration from v1 summary snapshots.
    return {
      version: 2,
      name,
      savedAt: parsed.savedAt ?? Date.now(),
      focusedPanel: 0,
      commandHistories: [[], [], [], []],
      panels: (parsed.panels ?? []).map((p, idx) => ({
        id: idx,
        activeSecurity: p.activeSecurity ?? 'AAPL US Equity',
        activeMnemonic: p.activeMnemonic ?? 'DES',
        marketSector: (p.marketSector as PanelSnapshot['marketSector']) ?? 'EQUITY',
        history: [{
          security: p.activeSecurity ?? 'AAPL US Equity',
          mnemonic: p.activeMnemonic ?? 'DES',
          sector: (p.marketSector as PanelSnapshot['marketSector']) ?? 'EQUITY',
          timeframe: p.timeframe ?? '1Y',
          scrollPosition: p.scrollPosition ?? 0,
          selectionIndex: p.selectionCursor ?? 0,
          ts: parsed.savedAt ?? Date.now(),
        }],
        historyIdx: 0,
        favorites: [],
        recentSecurities: [p.activeSecurity ?? 'AAPL US Equity'],
        recentMnemonics: [p.activeMnemonic ?? 'DES'],
        linkGroup: null,
        timeframe: p.timeframe ?? '1Y',
        selectionCursor: p.selectionCursor ?? 0,
        scrollPosition: p.scrollPosition ?? 0,
        commandInput: '',
        overlayMode: 'none',
        helpPressCount: 0,
      })),
    };
  } catch { return null; }
}

export function listWorkspaces(): WorkspaceSnapshot[] {
  if (typeof window === 'undefined') return [];
  const results: WorkspaceSnapshot[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(WS_PREFIX)) continue;
      const name = key.slice(WS_PREFIX.length);
      const ws = loadWorkspace(name);
      if (ws) results.push(ws);
    }
  } catch {}
  return results.sort((a, b) => b.savedAt - a.savedAt);
}

export function deleteWorkspace(name: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(WS_PREFIX + name); } catch {}
}
