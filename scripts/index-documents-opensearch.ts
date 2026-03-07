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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

async function run() {
  const { data: canonicalEntities, error: entityErr } = await supabase
    .from('entities')
    .select('id')
    .limit(20000);
  if (entityErr) throw entityErr;
  const canonicalIds = new Set(
    (canonicalEntities ?? [])
      .map((row) => row.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  );

  const { data: aliases, error: aliasErr } = await supabase
    .from('entity_aliases')
    .select('entity_id, alias')
    .limit(100000);
  if (aliasErr) throw aliasErr;
  const aliasByEntity = new Map<string, string[]>();
  for (const row of aliases ?? []) {
    const arr = aliasByEntity.get(row.entity_id) ?? [];
    arr.push(row.alias);
    aliasByEntity.set(row.entity_id, arr);
  }

  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, title, body, entity_ids, country_tags, published_at, source, url')
    .order('published_at', { ascending: false })
    .limit(5000);

  if (error) throw error;

  let ok = 0;
  let failed = 0;
  let rejected = 0;
  for (const d of docs ?? []) {
    const ids: string[] = (d.entity_ids ?? []).filter((id: unknown): id is string => typeof id === 'string');
    const allCanonical = ids.every((id) => isUuid(id) && canonicalIds.has(id));
    if (!allCanonical) {
      rejected++;
      continue;
    }
    const aliasesForDoc: string[] = Array.from(new Set(ids.flatMap((id: string) => aliasByEntity.get(id) ?? [])));
    const success = await indexDocumentOpenSearch({
      id: d.id,
      title: d.title ?? '',
      body: d.body ?? '',
      entity_ids: ids,
      country_tags: d.country_tags ?? [],
      published_at: d.published_at ?? '',
      source: d.source ?? '',
      url: d.url ?? '',
      aliases: aliasesForDoc,
    });
    if (success) ok++;
    else failed++;
  }

  console.log(`Indexed ${ok} documents (${failed} failed, ${rejected} rejected by canonical gate)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
