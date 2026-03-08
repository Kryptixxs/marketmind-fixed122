// ── Workspace persistence (localStorage + IndexedDB fallback) ─────────────────
const WS_PREFIX = 'vantage-ws2-';

export interface WorkspaceSnapshot {
  name: string;
  savedAt: number;
  panels: Array<{
    activeSecurity: string;
    activeMnemonic: string;
    marketSector: string;
    timeframe: string;
    scrollPosition: number;
    selectionCursor: number;
    historyLength: number;
  }>;
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
    return raw ? (JSON.parse(raw) as WorkspaceSnapshot) : null;
  } catch { return null; }
}

export function listWorkspaces(): WorkspaceSnapshot[] {
  if (typeof window === 'undefined') return [];
  const results: WorkspaceSnapshot[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(WS_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (raw) results.push(JSON.parse(raw) as WorkspaceSnapshot);
    }
  } catch {}
  return results.sort((a, b) => b.savedAt - a.savedAt);
}

export function deleteWorkspace(name: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(WS_PREFIX + name); } catch {}
}
