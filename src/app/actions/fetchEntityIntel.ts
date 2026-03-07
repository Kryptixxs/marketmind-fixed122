'use server';

import { supabase } from '@/integrations/supabase/client';
import { getSupplyChain } from '@/lib/supply-chain-data';
import type { SupplyChainData, SupplyChainEntry } from '@/lib/supply-chain-data';

export type EntityIntelResult = {
  entity: { id: string; symbol: string; name: string } | null;
  supplyChain: SupplyChainData | null;
  news: string[];
};

export async function fetchEntityIntel(
  entity: string,
  filters?: { country?: string; date?: string }
): Promise<EntityIntelResult> {
  const sym = entity.toUpperCase().replace(/\s+.*$/, '');

  const { data: entityRow } = await supabase
    .from('entities')
    .select('id, symbol, name')
    .or(`symbol.eq.${sym},name.ilike.%${entity}%`)
    .limit(1)
    .maybeSingle();

  if (!entityRow) {
    const fallback = getSupplyChain(sym);
    return {
      entity: null,
      supplyChain: fallback,
      news: [],
    };
  }

  let relQuery = supabase
    .from('relationships')
    .select(`
      relationship_type,
      segment,
      note,
      country,
      target:entities!target_entity_id(id, name)
    `)
    .eq('source_entity_id', entityRow.id);

  if (filters?.country) {
    relQuery = relQuery.or(
      `country.ilike.%${filters.country}%,segment.ilike.%${filters.country}%,note.ilike.%${filters.country}%`
    );
  }

  const { data: rels } = await relQuery;

  const customers: SupplyChainEntry[] = [];
  const suppliers: SupplyChainEntry[] = [];
  const partners: SupplyChainEntry[] = [];

  for (const r of rels ?? []) {
    const target = r.target as { name: string } | null;
    const entry: SupplyChainEntry = {
      name: target?.name ?? 'Unknown',
      type: r.relationship_type as 'customer' | 'supplier' | 'partner',
      segment: r.segment ?? undefined,
      note: r.note ?? undefined,
    };
    if (r.relationship_type === 'customer') customers.push(entry);
    else if (r.relationship_type === 'supplier') suppliers.push(entry);
    else partners.push(entry);
  }

  const supplyChain: SupplyChainData = {
    symbol: entityRow.symbol ?? sym,
    name: entityRow.name,
    customers,
    suppliers,
    partners,
  };

  let docQuery = supabase
    .from('documents')
    .select('title, published_at')
    .contains('entity_ids', [entityRow.id])
    .order('published_at', { ascending: false })
    .limit(80);

  if (filters?.date) {
    docQuery = docQuery.eq('published_at', filters.date);
  }

  const { data: docs } = await docQuery;
  const news = (docs ?? []).map((d) => `${d.title} (${d.published_at})`);

  return {
    entity: { id: entityRow.id, symbol: entityRow.symbol ?? '', name: entityRow.name },
    supplyChain,
    news,
  };
}
