'use server';

import { supabase } from '@/integrations/supabase/client';
import { getSupplyChain } from '@/lib/supply-chain-data';
import type { SupplyChainData, SupplyChainEntry } from '@/lib/supply-chain-data';
import type { IntelligenceEnvelope } from '@/lib/intelligence-contract';
import { emptyIntelligenceEnvelope } from '@/lib/intelligence-contract';
import { resolveCanonicalEntity } from '@/lib/entity-resolver';
import { fetchEntityGraph } from './fetchEntityGraph';

export type EntityIntelResult = {
  entity: { id: string; symbol: string; name: string } | null;
  supplyChain: SupplyChainData | null;
  news: string[];
  envelope: IntelligenceEnvelope;
};

export async function fetchEntityIntel(
  entity: string,
  filters?: { country?: string; date?: string }
): Promise<EntityIntelResult> {
  const sym = entity.toUpperCase().replace(/\s+.*$/, '');
  const envelope = emptyIntelligenceEnvelope();
  const canonical = await resolveCanonicalEntity(entity);

  const entityRow = canonical
    ? { id: canonical.id, symbol: canonical.symbol, name: canonical.name }
    : null;

  if (!entityRow) {
    const fallback = getSupplyChain(sym);
    return {
      entity: null,
      supplyChain: fallback,
      news: [],
      envelope,
    };
  }

  envelope.entities.push({
    id: entityRow.id,
    type: (canonical?.entity_type as any) ?? 'company',
    display_name: entityRow.name,
    ticker: entityRow.symbol ?? undefined,
    country: canonical?.country ?? undefined,
    sector: canonical?.sector ?? undefined,
    aliases: [entityRow.name, entityRow.symbol ?? ''].filter(Boolean),
  });

  let relQuery = supabase
    .from('relationships')
    .select(`
      relationship_type,
      segment,
      note,
      country,
      source_entity_id,
      target_entity_id,
      created_at,
      weight,
      target:entities!target_entity_id(id, name, symbol, country, sector, entity_type)
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
    const target = r.target as { id: string; name: string; symbol?: string; country?: string; sector?: string; entity_type?: string } | null;
    const entry: SupplyChainEntry = {
      name: target?.name ?? 'Unknown',
      type: r.relationship_type as 'customer' | 'supplier' | 'partner',
      segment: r.segment ?? undefined,
      note: r.note ?? undefined,
    };
    if (r.relationship_type === 'customer') customers.push(entry);
    else if (r.relationship_type === 'supplier') suppliers.push(entry);
    else partners.push(entry);

    if (target?.id) {
      envelope.entities.push({
        id: target.id,
        type: (target.entity_type as any) ?? 'company',
        display_name: target.name,
        ticker: target.symbol ?? undefined,
        country: target.country ?? undefined,
        sector: target.sector ?? undefined,
        aliases: [target.name, target.symbol ?? ''].filter(Boolean),
      });
      envelope.relationships.push({
        from_id: r.source_entity_id,
        to_id: r.target_entity_id,
        relationship_type: r.relationship_type,
        weight: Number(r.weight ?? 1),
        created_at: r.created_at ?? undefined,
      });
    }
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
    .select('id, title, body, source, url, published_at, country_tags, entity_ids')
    .contains('entity_ids', [entityRow.id])
    .order('published_at', { ascending: false })
    .limit(80);

  if (filters?.date) {
    docQuery = docQuery.eq('published_at', filters.date);
  }

  const { data: docs } = await docQuery;
  const news = (docs ?? []).map((d: any) => `${d.title} (${d.published_at})`);
  envelope.documents = (docs ?? []).map((d: any) => ({
    id: d.id,
    title: d.title ?? '',
    body: d.body ?? '',
    entity_ids: d.entity_ids ?? [],
    country_tags: d.country_tags ?? [],
    published_at: d.published_at ?? '',
    source: d.source ?? '',
    url: d.url ?? '',
  }));

  // If Neo4j is configured, merge traversal edges (source-agnostic envelope).
  const graph = await fetchEntityGraph({
    entity: entityRow.symbol ?? entityRow.name,
    depth: 2,
    country: filters?.country,
    dateFrom: filters?.date,
    dateTo: filters?.date,
  });
  if (graph.relationships.length > 0) {
    envelope.relationships = graph.relationships;
  }

  return {
    entity: { id: entityRow.id, symbol: entityRow.symbol ?? '', name: entityRow.name },
    supplyChain,
    news,
    envelope,
  };
}
