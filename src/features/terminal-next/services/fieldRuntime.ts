import { getFieldDef } from './fieldCatalog';
import { makeField, type EntityRef, type FieldPayload } from '../runtime/entities/types';

export type ValueSource = 'SIM' | 'LIVE' | 'CALC';
export type ValueFreshness = 'FRESH' | 'STALE';

export interface FieldValueMeta {
  source: ValueSource;
  asOf: string;
  freshness: ValueFreshness;
  stale: boolean;
  transforms: string[];
}

const STALE_MS_BY_CADENCE: Record<string, number> = {
  tick: 60 * 1000,
  daily: 36 * 60 * 60 * 1000,
  monthly: 45 * 24 * 60 * 60 * 1000,
  quarterly: 120 * 24 * 60 * 60 * 1000,
  static: 3650 * 24 * 60 * 60 * 1000,
};

function staleThresholdMs(cadence?: string): number {
  return STALE_MS_BY_CADENCE[cadence ?? 'daily'] ?? STALE_MS_BY_CADENCE['daily'];
}

export function computeFieldMeta(fieldId: string, opts?: {
  source?: ValueSource;
  asOf?: string;
  transforms?: string[];
}): FieldValueMeta {
  const def = getFieldDef(fieldId);
  const source = opts?.source ?? def?.provenance ?? 'SIM';
  const asOf = opts?.asOf ?? new Date().toISOString();
  const ageMs = Date.now() - new Date(asOf).getTime();
  const stale = Number.isFinite(ageMs) ? ageMs > staleThresholdMs(def?.updateFreq) : false;
  return {
    source,
    asOf,
    freshness: stale ? 'STALE' : 'FRESH',
    stale,
    transforms: opts?.transforms ?? [`normalize.${fieldId.toLowerCase()}`, `guard.${fieldId.toLowerCase()}`],
  };
}

export function makeFieldValueEntity(
  fieldId: string,
  value: unknown,
  opts?: { source?: ValueSource; asOf?: string; transforms?: string[]; desc?: string },
): EntityRef<'FIELD'> {
  const meta = computeFieldMeta(fieldId, { source: opts?.source, asOf: opts?.asOf, transforms: opts?.transforms });
  return makeField(fieldId, value, opts?.desc, meta);
}

export function fieldBadgeLabel(entity: EntityRef): string {
  if (entity.kind !== 'FIELD') return '';
  const p = entity.payload as FieldPayload;
  if (p.stale || p.freshness === 'STALE') return 'STALE';
  return p.source ?? 'SIM';
}
