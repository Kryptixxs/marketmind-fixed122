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
    envelope.relationships = await traverseEntityGraphNeo4j({
      entityId: canonical.id,
      depth: params.depth,
      relationshipType: params.relationshipType,
      country: params.country,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
    return envelope;
  }

  let relQuery = supabase
    .from('relationships')
    .select('source_entity_id, target_entity_id, relationship_type, country, created_at, weight')
    .or(`source_entity_id.eq.${canonical.id},target_entity_id.eq.${canonical.id}`)
    .limit(500);

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
  envelope.relationships = (rels ?? []).map((r: any) => ({
    from_id: r.source_entity_id,
    to_id: r.target_entity_id,
    relationship_type: r.relationship_type,
    weight: Number(r.weight ?? 1),
    created_at: r.created_at ?? undefined,
  })) as IntelligenceGraphEdge[];

  return envelope;
}
