'use client';

export type ColumnSetName = 'default' | 'risk' | 'flow' | 'fundamental';

export interface ColumnSetState {
  activeByMnemonic: Record<string, ColumnSetName>;
  fieldsByMnemonic: Record<string, Record<ColumnSetName, string[]>>;
}

const KEY = 'vantage-column-sets-v1';

const DEFAULT_SETS: Record<ColumnSetName, string[]> = {
  default: ['PX_LAST', 'PCT_CHG', 'VOLUME'],
  risk: ['BETA', 'VWAP', 'PCT_CHG'],
  flow: ['VOLUME', 'PX_BID', 'PX_ASK'],
  fundamental: ['MARKET_CAP', 'PE_RATIO', 'EPS'],
};

const DEFAULT_STATE: ColumnSetState = {
  activeByMnemonic: {},
  fieldsByMnemonic: {},
};

export function loadColumnSetState(): ColumnSetState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ColumnSetState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveColumnSetState(state: ColumnSetState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failure.
  }
}

export function listColumnSetFields(mnemonic: string, setName: ColumnSetName): string[] {
  const code = mnemonic.toUpperCase();
  const state = loadColumnSetState();
  return state.fieldsByMnemonic[code]?.[setName] ?? DEFAULT_SETS[setName];
}

export function getActiveColumnSet(mnemonic: string): ColumnSetName {
  const state = loadColumnSetState();
  return state.activeByMnemonic[mnemonic.toUpperCase()] ?? 'default';
}

export function setActiveColumnSet(mnemonic: string, setName: ColumnSetName) {
  const code = mnemonic.toUpperCase();
  const state = loadColumnSetState();
  saveColumnSetState({
    ...state,
    activeByMnemonic: {
      ...state.activeByMnemonic,
      [code]: setName,
    },
  });
}

export function updateColumnSetFields(mnemonic: string, setName: ColumnSetName, fields: string[]) {
  const code = mnemonic.toUpperCase();
  const state = loadColumnSetState();
  const byMn = state.fieldsByMnemonic[code] ?? {
    default: DEFAULT_SETS.default,
    risk: DEFAULT_SETS.risk,
    flow: DEFAULT_SETS.flow,
    fundamental: DEFAULT_SETS.fundamental,
  };
  saveColumnSetState({
    ...state,
    fieldsByMnemonic: {
      ...state.fieldsByMnemonic,
      [code]: {
        ...byMn,
        [setName]: fields.map((f) => f.toUpperCase()),
      },
    },
  });
}
