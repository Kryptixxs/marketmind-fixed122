'use server';

import { supabase } from '@/integrations/supabase/client';
import type { IntelligenceDocument } from '@/lib/intelligence-contract';
import { canUseOpenSearch, searchDocumentsOpenSearchPaged } from '@/lib/opensearch';

export type DocumentResult = IntelligenceDocument;
export type SearchDocumentsPage = {
  items: DocumentResult[];
  nextCursor?: string;
  total?: number;
};

type SearchDocumentsOptions = {
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
};

function cursorToOffset(cursor?: string): number {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toNextCursor(offset: number, limit: number, returned: number, total?: number): string | undefined {
  if (returned < limit) return undefined;
  const next = offset + returned;
  if (typeof total === 'number' && next >= total) return undefined;
  return String(next);
}

export async function searchDocuments(
  query: string,
  entityId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<DocumentResult[]> {
  const page = await searchDocumentsPage(query, {
    entityId,
    dateFrom,
    dateTo,
    limit: 50,
  });
  return page.items;
}

export async function searchDocumentsPage(query: string, options: SearchDocumentsOptions = {}): Promise<SearchDocumentsPage> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = cursorToOffset(options.cursor);

  // Prefer OpenSearch when configured; fallback to Postgres tsvector.
  if (canUseOpenSearch()) {
    const docs = await searchDocumentsOpenSearchPaged({
      query,
      entityId: options.entityId,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      size: limit,
      from: offset,
    });
    if (docs.items.length > 0) {
      return {
        items: docs.items,
        total: docs.total,
        nextCursor: toNextCursor(offset, limit, docs.items.length, docs.total),
      };
    }
  }

  let q = supabase
    .from('documents')
    .select('id, title, body, entity_ids, country_tags, published_at, source, url', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query.trim()) {
    q = q.textSearch('search_vector', query, { type: 'websearch', config: 'english' });
  }
  if (options.entityId) {
    q = q.contains('entity_ids', [options.entityId]);
  }
  if (options.dateFrom) {
    q = q.gte('published_at', options.dateFrom);
  }
  if (options.dateTo) {
    q = q.lte('published_at', options.dateTo);
  }

  const { data, error, count } = await q;
  if (error) return { items: [], total: 0 };
  const items = (data ?? []).map((d: any) => ({
    id: d.id,
    title: d.title ?? '',
    body: d.body ?? '',
    entity_ids: d.entity_ids ?? [],
    country_tags: d.country_tags ?? [],
    published_at: d.published_at ?? '',
    source: d.source ?? '',
    url: d.url ?? '',
  }));
  return {
    items,
    total: count ?? undefined,
    nextCursor: toNextCursor(offset, limit, items.length, count ?? undefined),
  };
}
