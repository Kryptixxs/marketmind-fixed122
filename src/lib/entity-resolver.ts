import { supabase } from '@/integrations/supabase/client';

export function normalizeAlias(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function normalizeSymbol(value: string): string {
  return value.toUpperCase().replace(/\s+.*$/, '');
}

type EntityRow = {
  id: string;
  symbol: string | null;
  name: string;
  country: string | null;
  sector: string | null;
  entity_type: string | null;
};

export async function resolveCanonicalEntity(input: string): Promise<EntityRow | null> {
  const raw = input.trim();
  if (!raw) return null;
  const symbol = normalizeSymbol(raw);
  const aliasNorm = normalizeAlias(raw);

  const { data: symbolHit } = await supabase
    .from('entities')
    .select('id, symbol, name, country, sector, entity_type')
    .eq('symbol', symbol)
    .limit(1)
    .maybeSingle();

  if (symbolHit) return symbolHit as EntityRow;

  const { data: aliasHit } = await supabase
    .from('entity_aliases')
    .select('entity:entities(id, symbol, name, country, sector, entity_type)')
    .eq('alias_norm', aliasNorm)
    .limit(1)
    .maybeSingle();

  const aliasEntity = aliasHit?.entity as EntityRow | null | undefined;
  if (aliasEntity) return aliasEntity;

  const { data: nameHit } = await supabase
    .from('entities')
    .select('id, symbol, name, country, sector, entity_type')
    .ilike('name', `%${raw}%`)
    .limit(1)
    .maybeSingle();

  return (nameHit as EntityRow | null) ?? null;
}
