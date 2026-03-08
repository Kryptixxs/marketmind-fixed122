import { lookupSecurity } from './securityMaster';

export type FieldOverrides = Record<string, number>;

export function parseOverrides(raw: string): FieldOverrides {
  const out: FieldOverrides = {};
  for (const pair of raw.toUpperCase().split(/[,\s]+/).filter(Boolean)) {
    const [k, v] = pair.split('=');
    if (!k || !v) continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    out[k.trim()] = n;
  }
  return out;
}

export function getField(symbol: string, fieldName: string, overrides: FieldOverrides = {}): number | string | undefined {
  const field = fieldName.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(overrides, field)) return overrides[field];
  const node = lookupSecurity(symbol);
  if (!node) return undefined;

  const pxLast = (overrides.PX ?? overrides.PX_LAST ?? node.fields.PX_LAST) as number | undefined;
  if (field === 'MARKET_CAP' && pxLast != null && typeof node.fields.SHARES_OUTSTANDING === 'number') {
    return pxLast * node.fields.SHARES_OUTSTANDING;
  }
  if (field === 'PE_RATIO' && pxLast != null && typeof node.fields.PE_RATIO === 'number' && typeof node.fields.PX_LAST === 'number') {
    const scale = pxLast / node.fields.PX_LAST;
    return Number((node.fields.PE_RATIO * scale).toFixed(2));
  }

  return node.fields[field];
}

