'use client';

export interface SecurityNote {
  id: string;
  security: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

const KEY = 'vantage-security-notes-v1';

type SecurityNoteMap = Record<string, SecurityNote[]>;

function normalizeSecurity(security: string) {
  return security.trim().toUpperCase();
}

function loadMap(): SecurityNoteMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SecurityNoteMap) : {};
  } catch {
    return {};
  }
}

function saveMap(map: SecurityNoteMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Ignore persistence failures.
  }
}

export function listSecurityNotes(security: string): SecurityNote[] {
  const key = normalizeSecurity(security);
  return (loadMap()[key] ?? []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function addSecurityNote(security: string, text: string): SecurityNote | null {
  const clean = text.trim();
  if (!clean) return null;
  const key = normalizeSecurity(security);
  const map = loadMap();
  const now = Date.now();
  const note: SecurityNote = {
    id: `${key}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    security: key,
    text: clean,
    createdAt: now,
    updatedAt: now,
  };
  map[key] = [note, ...(map[key] ?? [])].slice(0, 200);
  saveMap(map);
  return note;
}

export function deleteSecurityNote(security: string, id: string) {
  const key = normalizeSecurity(security);
  const map = loadMap();
  map[key] = (map[key] ?? []).filter((n) => n.id !== id);
  saveMap(map);
}
