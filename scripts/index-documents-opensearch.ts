/**
 * Mirror canonical documents from Supabase into OpenSearch.
 * Run: npx tsx scripts/index-documents-opensearch.ts
 */
import { createClient } from '@supabase/supabase-js';
import { indexDocumentOpenSearch } from '../src/lib/opensearch';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.OPENSEARCH_URL) {
  console.error('Missing OPENSEARCH_URL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, title, body, entity_ids, country_tags, published_at, source, url')
    .order('published_at', { ascending: false })
    .limit(5000);

  if (error) throw error;

  let ok = 0;
  let failed = 0;
  for (const d of docs ?? []) {
    const success = await indexDocumentOpenSearch({
      id: d.id,
      title: d.title ?? '',
      body: d.body ?? '',
      entity_ids: d.entity_ids ?? [],
      country_tags: d.country_tags ?? [],
      published_at: d.published_at ?? '',
      source: d.source ?? '',
      url: d.url ?? '',
      aliases: [],
    });
    if (success) ok++;
    else failed++;
  }

  console.log(`Indexed ${ok} documents (${failed} failed)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
