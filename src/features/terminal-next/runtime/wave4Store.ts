'use client';

export interface MacroItem { id: string; name: string; steps: string; lastRunTs?: number; runCount?: number; lastResult?: 'OK' | 'FAIL' }
export interface JobItem { id: string; name: string; schedule: string; status: 'IDLE' | 'OK' | 'FAIL'; lastRunTs?: number; nextRunTs?: number; runCount?: number; lastError?: string }
export interface HotkeyItem { id: string; key: string; action: string; target: string; enabled: boolean }
export interface LayoutTemplateItem { id: string; name: string; panels: Array<{ mnemonic: string; security: string; sector: string; timeframe?: string; linkGroup?: string | null }> }
export interface ReportItem { id: string; title: string; sections: string[]; createdTs: number; security?: string; bodyHtml?: string }
export interface ExportItem { id: string; kind: string; label: string; by: string; why: string; ts: number; ref?: string; status?: 'OK' | 'BLOCKED'; blockedReason?: string }
export interface ClipItem { id: string; title: string; note: string; security: string; mnemonic: string; ts: number; tags?: string[]; annotation?: string }
export interface ShareItem {
  id: string;
  kind: 'PANEL' | 'WORKSPACE';
  token: string;
  security?: string;
  mnemonic?: string;
  workspace?: string;
  panels?: Array<{ mnemonic: string; security: string; sector: string }>;
  ts: number;
  opens?: number;
}
export interface StructuredNoteItem { id: string; scope: 'SECURITY' | 'FUNCTION' | 'GLOBAL'; target: string; text: string; tags: string[]; author: string; pinned: boolean; ts: number; refs?: string[] }
export interface TaskItem { id: string; title: string; status: 'OPEN' | 'DONE'; security?: string; mnemonic?: string; dueTs?: number; priority?: 'LOW' | 'MED' | 'HIGH'; source?: string }
export interface ChatMessageItem { id: string; from: string; text: string; link: string; ts: number; to?: string }
export interface ScenarioItem { id: string; name: string; ratesBp: number; volPct: number; fxPct: number; result: string; ts: number }
export interface KillSwitchState { id: string; haltOrders: boolean; cancelWorking: boolean; freezeOps: boolean; ts: number }

const KEY = 'vantage-wave4-store-v1';

interface Wave4StoreState {
  macros: MacroItem[];
  jobs: JobItem[];
  hotkeys: HotkeyItem[];
  templates: LayoutTemplateItem[];
  reports: ReportItem[];
  exports: ExportItem[];
  clips: ClipItem[];
  shares: ShareItem[];
  notes: StructuredNoteItem[];
  tasks: TaskItem[];
  chats: ChatMessageItem[];
  scenarios: ScenarioItem[];
  kill: KillSwitchState[];
}

const DEFAULT_STATE: Wave4StoreState = {
  macros: [],
  jobs: [],
  hotkeys: [],
  templates: [],
  reports: [],
  exports: [],
  clips: [],
  shares: [],
  notes: [],
  tasks: [],
  chats: [],
  scenarios: [],
  kill: [],
};

function load(): Wave4StoreState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? ({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<Wave4StoreState>) }) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function save(state: Wave4StoreState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function listWave4Store<K extends keyof Wave4StoreState>(key: K): Wave4StoreState[K] {
  return load()[key];
}

export function appendWave4Item<K extends keyof Wave4StoreState>(
  key: K,
  item: Wave4StoreState[K] extends Array<infer T> ? Omit<T, 'id'> : never,
) {
  const state = load();
  const next = { ...(item as Record<string, unknown>), id: uid(String(key)) } as Wave4StoreState[K] extends Array<infer T> ? T : never;
  const list = [next, ...((state[key] as unknown[]) ?? [])].slice(0, 800) as Wave4StoreState[K];
  save({ ...state, [key]: list });
}

export function replaceWave4Store<K extends keyof Wave4StoreState>(key: K, value: Wave4StoreState[K]) {
  const state = load();
  save({ ...state, [key]: value });
}

