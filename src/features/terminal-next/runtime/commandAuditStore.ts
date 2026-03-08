'use client';

export type AuditEventType =
  | 'GO'
  | 'DRILL'
  | 'EXPORT'
  | 'ALERT_CREATE'
  | 'WORKSPACE_SAVE'
  | 'WORKSPACE_LOAD'
  | 'WORKSPACE_DELETE'
  | 'NOTE_ADD'
  | 'POLICY_BLOCK'
  | 'MESSAGE'
  | 'POLICY_CHANGE'
  | 'PIN_UPDATE'
  | 'NAV_JUMP';

export interface CommandAuditEvent {
  id: string;
  ts: number;
  panelIdx: number;
  type: AuditEventType;
  actor: string;
  detail: string;
  snapshotRef?: string;
  mnemonic?: string;
  security?: string;
  policyReason?: string;
}

const KEY = 'vantage-command-audit-v1';

export function listAuditEvents(limit = 500): CommandAuditEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as CommandAuditEvent[]) : [];
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

export function appendAuditEvent(event: Omit<CommandAuditEvent, 'id' | 'ts'>) {
  if (typeof window === 'undefined') return;
  const next: CommandAuditEvent = {
    ...event,
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    snapshotRef: event.snapshotRef ?? `snap-${Date.now()}`,
  };
  try {
    const prev = listAuditEvents(2000);
    const merged = [next, ...prev].slice(0, 1000);
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage failures.
  }
}
