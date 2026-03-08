'use client';

export interface KeymapProfile {
  name: string;
  bindings: Record<string, string>;
}

const KEY = 'vantage-keymap-v1';

export const BLOOMBERG_LIKE_PROFILE: KeymapProfile = {
  name: 'Bloomberg-like default',
  bindings: {
    'Ctrl+L': 'Focus command line',
    'Ctrl+K': 'Open search',
    'Ctrl+B': 'Back',
    'Ctrl+Shift+B': 'Forward',
    'Alt+1': 'Focus pane 1',
    'Alt+2': 'Focus pane 2',
    'Alt+3': 'Focus pane 3',
    'Alt+4': 'Focus pane 4',
    'Enter': 'Open in place',
    'Shift+Enter': 'Open in new pane',
    'Alt+Enter': 'Inspect overlay',
    'F1': 'Help',
    'F2': 'Menu',
  },
};

export function loadKeymapProfile(): KeymapProfile {
  if (typeof window === 'undefined') return BLOOMBERG_LIKE_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return BLOOMBERG_LIKE_PROFILE;
    const parsed = JSON.parse(raw) as KeymapProfile;
    return {
      name: parsed.name || BLOOMBERG_LIKE_PROFILE.name,
      bindings: { ...BLOOMBERG_LIKE_PROFILE.bindings, ...(parsed.bindings ?? {}) },
    };
  } catch {
    return BLOOMBERG_LIKE_PROFILE;
  }
}

export function saveKeymapProfile(profile: KeymapProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

