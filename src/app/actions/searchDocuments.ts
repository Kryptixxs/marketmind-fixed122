'use server';

import { supabase } from '@/integrations/supabase/client';

export type DocumentResult = {
  id: string;
  title: string;
  body: string;
  published_at: string;
  source: string;
};

export async function searchDocuments(
  query: string,
  entityId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<DocumentResult[]> {
  let q = supabase
    .from('documents')
    .select('id, title, body, published_at, source')
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
  return (data ?? []) as DocumentResult[];
}
