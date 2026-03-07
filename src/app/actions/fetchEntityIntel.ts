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
  explanation?: string;
};

function pushUniqueEntity(envelope: IntelligenceEnvelope, entity: IntelligenceEnvelope['entities'][number]) {
  if (envelope.entities.some((existing) => existing.id === entity.id)) return;
  envelope.entities.push(entity);
}

function pushUniqueRelationship(envelope: IntelligenceEnvelope, edge: IntelligenceEnvelope['relationships'][number]) {
  const key = `${edge.from_id}|${edge.to_id}|${edge.relationship_type}|${edge.created_at ?? ''}`;
  const exists = envelope.relationships.some(
    (existing) =>
      `${existing.from_id}|${existing.to_id}|${existing.relationship_type}|${existing.created_at ?? ''}` === key
  );
  if (!exists) envelope.relationships.push(edge);
}

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
      explanation: 'No canonical entity resolved. Showing provisional supply-chain fallback only.',
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
    const targetRaw = Array.isArray((r as any).target) ? (r as any).target[0] : (r as any).target;
    const target = targetRaw as
      | { id: string; name: string; symbol?: string; country?: string; sector?: string; entity_type?: string }
      | null;
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
      pushUniqueEntity(envelope, {
        id: target.id,
        type: (target.entity_type as any) ?? 'company',
        display_name: target.name,
        ticker: target.symbol ?? undefined,
        country: target.country ?? undefined,
        sector: target.sector ?? undefined,
        aliases: [target.name, target.symbol ?? ''].filter(Boolean),
      });
      pushUniqueRelationship(envelope, {
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
    for (const entity of graph.entities) {
      pushUniqueEntity(envelope, entity);
    }
  }

  // Deterministic no-empty fallback chain:
  // graph traversal -> doc-linked expansion -> peer expansion -> sector expansion -> country expansion -> explicit explanation.
  let explanation: string | undefined;
  if (envelope.relationships.length === 0) {
    const { data: linkedDocs } = await supabase
      .from('documents')
      .select('id, entity_ids')
      .contains('entity_ids', [entityRow.id])
      .limit(200);
    const docLinkedEntityIds = Array.from(
      new Set(
        (linkedDocs ?? [])
          .flatMap((doc: any) => (doc.entity_ids ?? []) as string[])
          .filter((id: string) => id && id !== entityRow.id)
      )
    );
    if (docLinkedEntityIds.length > 0) {
      const { data: entities } = await supabase
        .from('entities')
        .select('id, name, symbol, country, sector, entity_type')
        .in('id', docLinkedEntityIds.slice(0, 80));
      for (const e of entities ?? []) {
        pushUniqueEntity(envelope, {
          id: e.id,
          type: (e.entity_type as any) ?? 'company',
          display_name: e.name,
          ticker: e.symbol ?? undefined,
          country: e.country ?? undefined,
          sector: e.sector ?? undefined,
          aliases: [e.name, e.symbol ?? ''].filter(Boolean),
        });
        pushUniqueRelationship(envelope, {
          from_id: entityRow.id,
          to_id: e.id,
          relationship_type: 'DOCUMENT_LINKED',
          weight: 0.4,
        });
      }
    }
  }

  if (envelope.relationships.length === 0) {
    const { data: peers } = await supabase
      .from('entities')
      .select('id, name, symbol, country, sector, entity_type')
      .eq('sector', canonical?.sector ?? '')
      .eq('country', canonical?.country ?? '')
      .neq('id', entityRow.id)
      .limit(60);
    for (const p of peers ?? []) {
      pushUniqueEntity(envelope, {
        id: p.id,
        type: (p.entity_type as any) ?? 'company',
        display_name: p.name,
        ticker: p.symbol ?? undefined,
        country: p.country ?? undefined,
        sector: p.sector ?? undefined,
        aliases: [p.name, p.symbol ?? ''].filter(Boolean),
      });
      pushUniqueRelationship(envelope, {
        from_id: entityRow.id,
        to_id: p.id,
        relationship_type: 'PEER',
        weight: 0.3,
      });
    }
  }

  if (envelope.relationships.length === 0) {
    const { data: sectorEntities } = await supabase
      .from('entities')
      .select('id, name, symbol, country, sector, entity_type')
      .eq('sector', canonical?.sector ?? '')
      .neq('id', entityRow.id)
      .limit(80);
    for (const e of sectorEntities ?? []) {
      pushUniqueEntity(envelope, {
        id: e.id,
        type: (e.entity_type as any) ?? 'company',
        display_name: e.name,
        ticker: e.symbol ?? undefined,
        country: e.country ?? undefined,
        sector: e.sector ?? undefined,
        aliases: [e.name, e.symbol ?? ''].filter(Boolean),
      });
      pushUniqueRelationship(envelope, {
        from_id: entityRow.id,
        to_id: e.id,
        relationship_type: 'SECTOR_LINK',
        weight: 0.2,
      });
    }
  }

  if (envelope.relationships.length === 0) {
    const { data: countryEntities } = await supabase
      .from('entities')
      .select('id, name, symbol, country, sector, entity_type')
      .eq('country', canonical?.country ?? '')
      .neq('id', entityRow.id)
      .limit(80);
    for (const e of countryEntities ?? []) {
      pushUniqueEntity(envelope, {
        id: e.id,
        type: (e.entity_type as any) ?? 'company',
        display_name: e.name,
        ticker: e.symbol ?? undefined,
        country: e.country ?? undefined,
        sector: e.sector ?? undefined,
        aliases: [e.name, e.symbol ?? ''].filter(Boolean),
      });
      pushUniqueRelationship(envelope, {
        from_id: entityRow.id,
        to_id: e.id,
        relationship_type: 'COUNTRY_LINK',
        weight: 0.1,
      });
    }
  }

  if (envelope.relationships.length === 0) {
    explanation = 'No linked intelligence available after graph, document, peer, sector, and country expansion for the current filters.';
    envelope.events.push({
      id: `intel-empty-${entityRow.id}`,
      label: explanation,
      entity_ids: [entityRow.id],
      occurred_at: new Date().toISOString(),
      source: 'fallback-chain',
    });
  }

  const firstDegreeNeighborIds = Array.from(
    new Set(
      envelope.relationships
        .flatMap((edge) => {
          if (edge.from_id === entityRow.id) return [edge.to_id];
          if (edge.to_id === entityRow.id) return [edge.from_id];
          return [];
        })
        .filter(Boolean)
    )
  );
  const docEntityScope = Array.from(new Set([entityRow.id, ...firstDegreeNeighborIds]));
  let docQuery = supabase
    .from('documents')
    .select('id, title, body, source, url, published_at, country_tags, entity_ids')
    .overlaps('entity_ids', docEntityScope)
    .order('published_at', { ascending: false })
    .limit(200);

  if (filters?.date) {
    docQuery = docQuery.eq('published_at', filters.date);
  }

  const { data: docs } = await docQuery;
  const neighborWeight = new Map<string, number>();
  for (const edge of envelope.relationships) {
    if (edge.from_id === entityRow.id) {
      neighborWeight.set(edge.to_id, Math.max(neighborWeight.get(edge.to_id) ?? 0, edge.weight));
    } else if (edge.to_id === entityRow.id) {
      neighborWeight.set(edge.from_id, Math.max(neighborWeight.get(edge.from_id) ?? 0, edge.weight));
    }
  }

  const rankedDocs = (docs ?? [])
    .map((d: any) => {
      const entityIds = (d.entity_ids ?? []) as string[];
      const rootHit = entityIds.includes(entityRow.id) ? 100 : 0;
      const neighborHit = entityIds.reduce((sum, id) => sum + (neighborWeight.get(id) ?? 0) * 30, 0);
      const ageDays = Math.max(
        0,
        Math.floor((Date.now() - new Date(d.published_at ?? Date.now()).getTime()) / (1000 * 60 * 60 * 24))
      );
      const recency = Math.max(0, 30 - ageDays) * 0.5;
      return { doc: d, score: rootHit + neighborHit + recency };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.doc);

  const news = rankedDocs.map((d: any) => `${d.title} (${d.published_at})`);
  envelope.documents = rankedDocs.map((d: any) => ({
    id: d.id,
    title: d.title ?? '',
    body: d.body ?? '',
    entity_ids: d.entity_ids ?? [],
    country_tags: d.country_tags ?? [],
    published_at: d.published_at ?? '',
    source: d.source ?? '',
    url: d.url ?? '',
  }));

  if (explanation) {
    news.unshift(`NOTICE: ${explanation}`);
  }

  if (process.env.INTEL_TELEMETRY === '1') {
    console.info('[INTEL_TELEMETRY]', {
      query: entity,
      canonicalEntityId: entityRow.id,
      entityCount: envelope.entities.length,
      relationshipCount: envelope.relationships.length,
      documentCount: envelope.documents.length,
      filterState: filters ?? {},
      explanation: explanation ?? null,
    });
  }

  return {
    entity: { id: entityRow.id, symbol: entityRow.symbol ?? '', name: entityRow.name },
    supplyChain,
    news,
    envelope,
    explanation,
  };
}
