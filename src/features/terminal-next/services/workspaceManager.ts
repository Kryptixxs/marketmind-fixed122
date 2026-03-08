/**
 * WorkspaceManager – save/recall 4-panel layouts (panelFunctions, zoomedQuadrant, panelSizes) to LocalStorage.
 * Command: W [Name] – save current layout if new, load if exists.
 */

import type { PanelFunction } from '../context/PanelFocusContext';

const WORKSPACE_PREFIX = 'vantage-workspace-';

export interface SavedWorkspace {
  panelFunctions: PanelFunction[];
  zoomedQuadrant: number | null;
  panelSizes: number[];
  savedAt: number;
}

function workspaceKey(name: string): string {
  return `${WORKSPACE_PREFIX}${name.toUpperCase().replace(/\s+/g, '_')}`;
}

export function saveWorkspace(name: string, data: Omit<SavedWorkspace, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const key = workspaceKey(name);
    const workspace: SavedWorkspace = {
      ...data,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(workspace));
  } catch {
    // ignore
  }
}

export function loadWorkspace(name: string): SavedWorkspace | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = workspaceKey(name);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedWorkspace;
  } catch {
    return null;
  }
}

export function workspaceExists(name: string): boolean {
  return loadWorkspace(name) !== null;
}

export function listWorkspaces(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(WORKSPACE_PREFIX)) {
        keys.push(k.slice(WORKSPACE_PREFIX.length).replace(/_/g, ' '));
      }
    }
    return keys;
  } catch {
    return [];
  }
}
