'use server';

import { supabase } from '@/integrations/supabase/client';
import type { IntelligenceEnvelope, IntelligenceGraphEdge } from '@/lib/intelligence-contract';
import { emptyIntelligenceEnvelope } from '@/lib/intelligence-contract';
import { canUseNeo4j, traverseEntityGraphNeo4j } from '@/lib/neo4j';
import { resolveCanonicalEntity } from '@/lib/entity-resolver';

export async function fetchEntityGraph(params: {
  entity: string;
  depth?: number;
  country?: string;
  relationshipType?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<IntelligenceEnvelope> {
  const envelope: IntelligenceEnvelope = emptyIntelligenceEnvelope();
  const depth = Math.min(Math.max(params.depth ?? 1, 1), 3);
  const canonical = await resolveCanonicalEntity(params.entity);
  if (!canonical) return envelope;

  envelope.entities.push({
    id: canonical.id,
    type: (canonical.entity_type as any) ?? 'company',
    display_name: canonical.name,
    ticker: canonical.symbol ?? undefined,
    country: canonical.country ?? undefined,
    sector: canonical.sector ?? undefined,
    aliases: [canonical.name, canonical.symbol ?? ''].filter(Boolean),
  });

  if (canUseNeo4j()) {
    const graph = await traverseEntityGraphNeo4j({
      entityId: canonical.id,
      depth,
      relationshipType: params.relationshipType,
      country: params.country,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
    envelope.relationships = graph.relationships;
    for (const entity of graph.entities) {
      if (!envelope.entities.some((existing) => existing.id === entity.id)) {
        envelope.entities.push(entity);
      }
    }
    if (process.env.INTEL_TELEMETRY === '1') {
      console.info('[GRAPH_TELEMETRY]', {
        query: params.entity,
        canonicalEntityId: canonical.id,
        mode: 'neo4j',
        entityCount: envelope.entities.length,
        relationshipCount: envelope.relationships.length,
        filterState: {
          relationshipType: params.relationshipType,
          country: params.country,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          depth,
        },
      });
    }
    return envelope;
  }

  const visited = new Set<string>([canonical.id]);
  const frontier = new Set<string>([canonical.id]);
  const relMap = new Map<string, IntelligenceGraphEdge>();

  for (let step = 0; step < depth; step++) {
    if (frontier.size === 0) break;
    const ids = Array.from(frontier);
    frontier.clear();

    let relQuery = supabase
      .from('relationships')
      .select('source_entity_id, target_entity_id, relationship_type, country, created_at, weight')
      .or(`source_entity_id.in.(${ids.join(',')}),target_entity_id.in.(${ids.join(',')})`)
      .limit(2000);

    if (params.relationshipType) {
      relQuery = relQuery.eq('relationship_type', params.relationshipType);
    }
    if (params.country) {
      relQuery = relQuery.ilike('country', `%${params.country}%`);
    }
    if (params.dateFrom) {
      relQuery = relQuery.gte('created_at', params.dateFrom);
    }
    if (params.dateTo) {
      relQuery = relQuery.lte('created_at', params.dateTo);
    }

    const { data: rels } = await relQuery;
    for (const r of rels ?? []) {
      const edge: IntelligenceGraphEdge = {
        from_id: r.source_entity_id,
        to_id: r.target_entity_id,
        relationship_type: r.relationship_type,
        weight: Number(r.weight ?? 1),
        created_at: r.created_at ?? undefined,
      };
      const key = `${edge.from_id}|${edge.to_id}|${edge.relationship_type}|${edge.created_at ?? ''}`;
      relMap.set(key, edge);

      if (!visited.has(edge.from_id)) {
        visited.add(edge.from_id);
        frontier.add(edge.from_id);
      }
      if (!visited.has(edge.to_id)) {
        visited.add(edge.to_id);
        frontier.add(edge.to_id);
      }
    }
  }

  envelope.relationships = Array.from(relMap.values());

  const idsToHydrate = Array.from(
    new Set([canonical.id, ...envelope.relationships.flatMap((edge) => [edge.from_id, edge.to_id])])
  );
  if (idsToHydrate.length > 0) {
    const { data: entities } = await supabase
      .from('entities')
      .select('id, symbol, name, country, sector, entity_type')
      .in('id', idsToHydrate);
    for (const entity of entities ?? []) {
      if (envelope.entities.some((existing) => existing.id === entity.id)) continue;
      envelope.entities.push({
        id: entity.id,
        type: (entity.entity_type as any) ?? 'company',
        display_name: entity.name,
        ticker: entity.symbol ?? undefined,
        country: entity.country ?? undefined,
        sector: entity.sector ?? undefined,
        aliases: [entity.name, entity.symbol ?? ''].filter(Boolean),
      });
    }
  }

  if (process.env.INTEL_TELEMETRY === '1') {
    console.info('[GRAPH_TELEMETRY]', {
      query: params.entity,
      canonicalEntityId: canonical.id,
      mode: 'supabase_fallback',
      entityCount: envelope.entities.length,
      relationshipCount: envelope.relationships.length,
      filterState: {
        relationshipType: params.relationshipType,
        country: params.country,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        depth,
      },
    });
  }

  return envelope;
}
