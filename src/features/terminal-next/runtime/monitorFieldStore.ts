'use client';

const KEY = 'vantage-monitor-fields-v1';

const DEFAULT_FIELDS = ['PX_LAST', 'PCT_CHG', 'VOLUME', 'VWAP'];

export function loadMonitorFields(): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_FIELDS];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return parsed.length > 0 ? parsed : [...DEFAULT_FIELDS];
  } catch {
    return [...DEFAULT_FIELDS];
  }
}

export function saveMonitorFields(fields: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const normalized = Array.from(new Set(fields.map((f) => f.trim().toUpperCase()).filter(Boolean))).slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(normalized));
  } catch {
    // ignore storage failures
  }
}

export function addMonitorField(fieldId: string) {
  const next = [fieldId.toUpperCase(), ...loadMonitorFields().filter((f) => f !== fieldId.toUpperCase())];
  saveMonitorFields(next);
}

export function removeMonitorField(fieldId: string) {
  saveMonitorFields(loadMonitorFields().filter((f) => f !== fieldId.toUpperCase()));
}
