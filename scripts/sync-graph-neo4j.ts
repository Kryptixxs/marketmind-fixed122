/**
 * Sync canonical entities + relationships from Supabase into Neo4j.
 * Run: npx tsx scripts/sync-graph-neo4j.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const NEO4J_URL = process.env.NEO4J_HTTP_URL ?? '';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? '';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY || !NEO4J_URL || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEO4J_HTTP_URL, NEO4J_USERNAME, NEO4J_PASSWORD');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function authHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function neo4j(statement: string, parameters: Record<string, any>) {
  const res = await fetch(NEO4J_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(NEO4J_USERNAME, NEO4J_PASSWORD),
    },
    body: JSON.stringify({
      statements: [{ statement, parameters }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neo4j error: ${res.status} ${text}`);
  }
}

async function run() {
  const { data: entities, error: entitiesErr } = await supabase
    .from('entities')
    .select('id, symbol, name, display_name, country, sector, entity_type')
    .limit(10000);
  if (entitiesErr) throw entitiesErr;

  const { data: rels, error: relsErr } = await supabase
    .from('relationships')
    .select('source_entity_id, target_entity_id, relationship_type, country, weight, created_at')
    .limit(20000);
  if (relsErr) throw relsErr;

  const { data: aliases } = await supabase
    .from('entity_aliases')
    .select('entity_id, alias')
    .limit(50000);
  const aliasMap = new Map<string, string[]>();
  for (const a of aliases ?? []) {
    const arr = aliasMap.get(a.entity_id) ?? [];
    arr.push(a.alias);
    aliasMap.set(a.entity_id, arr);
  }

  for (const e of entities ?? []) {
    await neo4j(
      `
      MERGE (n:Entity {id: $id})
      SET n.ticker = $ticker,
          n.name = $name,
          n.display_name = $display_name,
          n.country = $country,
          n.sector = $sector,
          n.entity_type = $entity_type,
          n.aliases = $aliases
      `,
      {
        id: e.id,
        ticker: e.symbol,
        name: e.name,
        display_name: e.display_name ?? e.name,
        country: e.country,
        sector: e.sector,
        entity_type: e.entity_type,
        aliases: aliasMap.get(e.id) ?? [e.name, e.symbol].filter(Boolean),
      }
    );
  }

  for (const r of rels ?? []) {
    await neo4j(
      `
      MATCH (a:Entity {id: $fromId})
      MATCH (b:Entity {id: $toId})
      MERGE (a)-[rel:RELATED_TO {relationship_type: $relationshipType}]->(b)
      SET rel.country = $country,
          rel.weight = $weight,
          rel.created_at = $createdAt
      `,
      {
        fromId: r.source_entity_id,
        toId: r.target_entity_id,
        relationshipType: r.relationship_type,
        country: r.country,
        weight: r.weight ?? 1,
        createdAt: r.created_at ?? null,
      }
    );
  }

  console.log(`Synced ${entities?.length ?? 0} entities and ${rels?.length ?? 0} relationships to Neo4j`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
