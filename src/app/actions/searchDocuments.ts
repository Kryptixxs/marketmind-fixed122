'use server';

import { supabase } from '@/integrations/supabase/client';
import type { IntelligenceDocument } from '@/lib/intelligence-contract';
import { canUseOpenSearch, searchDocumentsOpenSearch } from '@/lib/opensearch';

export type DocumentResult = IntelligenceDocument;

export async function searchDocuments(
  query: string,
  entityId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<DocumentResult[]> {
  // Prefer OpenSearch when configured; fallback to Postgres tsvector.
  if (canUseOpenSearch()) {
    const docs = await searchDocumentsOpenSearch({
      query,
      entityId,
      dateFrom,
      dateTo,
      size: 50,
    });
    if (docs.length > 0) return docs;
  }

  let q = supabase
    .from('documents')
    .select('id, title, body, entity_ids, country_tags, published_at, source, url')
    .order('published_at', { ascending: false })
    .limit(50);

  if (query.trim()) {
    q = q.textSearch('search_vector', query, { type: 'websearch', config: 'english' });
  }
  if (entityId) {
    q = q.contains('entity_ids', [entityId]);
  }
  if (dateFrom) {
    q = q.gte('published_at', dateFrom);
  }
  if (dateTo) {
    q = q.lte('published_at', dateTo);
  }

  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map((d: any) => ({
    id: d.id,
    title: d.title ?? '',
    body: d.body ?? '',
    entity_ids: d.entity_ids ?? [],
    country_tags: d.country_tags ?? [],
    published_at: d.published_at ?? '',
    source: d.source ?? '',
    url: d.url ?? '',
  }));
}
