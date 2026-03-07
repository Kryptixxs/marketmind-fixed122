/**
 * Seed entities, relationships, and documents from supply-chain-data.ts
 * Run: npx tsx scripts/seed-intel-data.ts
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import {
  getSupplyChain,
  SUPPLY_CHAIN_SYMBOLS,
  type SupplyChainEntry,
} from '../src/lib/supply-chain-data';
import { normalizeAlias, normalizeSymbol } from '../src/lib/entity-resolver';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? 'https://oeosfycqhpsripaihaqy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NAME_TO_SYMBOL: Record<string, string> = {
  Microsoft: 'MSFT',
  Apple: 'AAPL',
  Google: 'GOOGL',
  Amazon: 'AMZN',
  Tesla: 'TSLA',
  Meta: 'META',
  NVIDIA: 'NVDA',
  Oracle: 'ORCL',
  Samsung: 'SAMSUNG',
  Intel: 'INTC',
  AMD: 'AMD',
  OpenAI: 'OPENAI',
  SAP: 'SAP',
  Salesforce: 'CRM',
  VMware: 'VMW',
  'Red Hat': 'RHT',
  Qualcomm: 'QCOM',
  Broadcom: 'AVGO',
  Shopify: 'SHOP',
  Foxconn: 'FOXCONN',
  TSMC: 'TSM',
  Panasonic: 'PCRFY',
  BP: 'BP',
  Hertz: 'HTZ',
};

function deriveCountry(entry: SupplyChainEntry): string | null {
  if (entry.note?.toUpperCase().includes('UK')) return 'UK';
  if (entry.segment === 'Gov' && (entry.name.includes('US') || entry.name.includes('DoD') || entry.name.includes('NASA') || entry.name.includes('FDA') || entry.name.includes('CBP'))) return 'US';
  return null;
}

async function ensureEntity(symbol: string | null, name: string, sector: string | null, country: string | null): Promise<string> {
  const normalizedSymbol = symbol ? normalizeSymbol(symbol) : null;
  const displayName = name.trim();
  const aliasNorm = normalizeAlias(displayName);

  // 1) Resolve by canonical symbol first.
  if (normalizedSymbol) {
    const { data: bySymbol } = await supabase.from('entities').select('id').eq('symbol', normalizedSymbol).limit(1).single();
    if (bySymbol) return bySymbol.id;
  }

  // 2) Resolve by alias canonicalization.
  const { data: aliasHit } = await supabase
    .from('entity_aliases')
    .select('entity_id')
    .eq('alias_norm', aliasNorm)
    .limit(1)
    .maybeSingle();
  if (aliasHit?.entity_id) return aliasHit.entity_id;

  // 3) Resolve by exact name + null symbol legacy rows.
  if (symbol) {
    const { data: bySymbol } = await supabase.from('entities').select('id').eq('symbol', normalizedSymbol).limit(1).single();
    if (bySymbol) return bySymbol.id;
  } else {
    const { data: byName } = await supabase.from('entities').select('id').eq('name', name).is('symbol', null).limit(1).single();
    if (byName) return byName.id;
  }

  // 4) Upsert deterministic canonical entity.
  const { data: inserted, error } = await supabase
    .from('entities')
    .upsert(
      {
        symbol: normalizedSymbol ?? null,
        name: displayName,
        display_name: displayName,
        entity_type: 'company',
        sector,
        country,
      },
      { onConflict: normalizedSymbol ? 'symbol' : 'name' }
    )
    .select('id')
    .single();

  if (error) {
    if (symbol) {
      const { data: retry } = await supabase.from('entities').select('id').eq('symbol', symbol).limit(1).single();
      if (retry) return retry.id;
    }
    const { data: byName } = await supabase.from('entities').select('id').eq('name', name).limit(1).single();
    if (byName) return byName.id;
    throw error;
  }
  const entityId = inserted!.id;

  // 5) Ensure canonical aliases for deterministic resolution.
  await supabase.from('entity_aliases').upsert(
    [
      { entity_id: entityId, alias: displayName },
      ...(normalizedSymbol ? [{ entity_id: entityId, alias: normalizedSymbol }] : []),
    ],
    { onConflict: 'entity_id,alias_norm', ignoreDuplicates: true }
  );

  return entityId;
}

async function seed() {
  const entityIds = new Map<string, string>();

  for (const sym of SUPPLY_CHAIN_SYMBOLS) {
    const sc = getSupplyChain(sym);
    if (!sc) continue;

    const sourceId = await ensureEntity(sym, sc.name, null, 'US');
    entityIds.set(sym, sourceId);

    const allEntries = [...sc.customers, ...sc.suppliers, ...sc.partners];
    for (const entry of allEntries) {
      const targetSymbol = NAME_TO_SYMBOL[entry.name] ?? null;
      const targetId = await ensureEntity(targetSymbol, entry.name, entry.segment ?? null, deriveCountry(entry));
      entityIds.set(entry.name, targetId);

      const country = deriveCountry(entry);
      await supabase.from('relationships').upsert(
        {
          source_entity_id: sourceId,
          target_entity_id: targetId,
          relationship_type: entry.type,
          segment: entry.segment ?? null,
          note: entry.note ?? null,
          country,
          weight: 1,
        },
        { onConflict: 'source_entity_id,target_entity_id,relationship_type,segment,note', ignoreDuplicates: true }
      );
    }
  }

  const entityList = Array.from(entityIds.entries());
  const symbolToId = new Map<string, string>();
  for (const [k, v] of entityList) {
    if (SUPPLY_CHAIN_SYMBOLS.includes(k)) symbolToId.set(k, v);
  }

  const sampleNews = [
    { title: 'Palantir wins $480M Army contract for TITAN', body: 'Palantir Technologies secures major defense contract.', symbol: 'PLTR', date: '2024-03-15' },
    { title: 'Apple announces new iPhone 16 lineup', body: 'Apple Inc. unveils latest smartphone models.', symbol: 'AAPL', date: '2024-09-09' },
    { title: 'Microsoft Azure AI revenue surges', body: 'Microsoft reports strong cloud and AI growth.', symbol: 'MSFT', date: '2024-07-18' },
    { title: 'NVIDIA data center revenue hits record', body: 'NVIDIA Corp. benefits from AI chip demand.', symbol: 'NVDA', date: '2024-08-21' },
    { title: 'Palantir AIP adoption accelerates', body: 'Palantir AIP platform gains enterprise traction.', symbol: 'PLTR', date: '2019-08-09' },
    { title: 'AAPL stock rises on strong iPhone demand', body: 'Apple shares gain on earnings beat.', symbol: 'AAPL', date: '2024-01-25' },
  ];

  for (const n of sampleNews) {
    const eid = symbolToId.get(n.symbol);
    if (!eid) continue;
    const docId = `${n.symbol}-${n.date}-${n.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120);
    await supabase.from('documents').upsert(
      {
        id: docId,
        title: n.title,
        body: n.body,
        published_at: n.date,
        source: 'MarketMind Research',
        source_type: 'news',
        language: 'en',
        country_tags: [],
        entity_ids: [eid],
      },
      { onConflict: 'id' }
    );
  }

  console.log('Seeded entities:', entityIds.size, 'relationships and', sampleNews.length, 'documents');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
