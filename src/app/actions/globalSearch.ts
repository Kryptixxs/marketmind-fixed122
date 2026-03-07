'use server';

import { searchDocuments } from './searchDocuments';
import { fetchEntityIntel } from './fetchEntityIntel';
import { searchSymbols } from './searchSymbols';
import type { IntelligenceEnvelope } from '@/lib/intelligence-contract';
import { emptyIntelligenceEnvelope } from '@/lib/intelligence-contract';

export type GlobalSearchEntity = {
  id: string;
  symbol: string;
  name: string;
  relationshipCount?: number;
};

export type GlobalSearchDocument = {
  id: string;
  title: string;
  published_at: string;
  source: string;
};

export type GlobalSearchSymbol = {
  symbol: string;
  name: string;
  type: string;
};

export type GlobalSearchResult = {
  entities: GlobalSearchEntity[];
  documents: GlobalSearchDocument[];
  symbols: GlobalSearchSymbol[];
  envelope: IntelligenceEnvelope;
};

/**
 * Parse query for entity + filters.
 * e.g. "palantir russia" -> entity: "palantir", country: "russia"
 * e.g. "NVDA 2019-08-09" -> entity: "NVDA", date: "2019-08-09"
 */
function parseQuery(query: string): { entity: string; country?: string; date?: string; textQuery: string } {
  const q = query.trim();
  if (!q) return { entity: '', textQuery: '' };

  const parts = q.split(/\s+/);
  const entity = parts[0] ?? '';

  let country: string | undefined;
  let date: string | undefined;

  const remaining: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
      date = p;
    } else if (/^(russia|china|us|uk|eu|germany|france|japan)/i.test(p)) {
      country = p;
    } else {
      remaining.push(p);
    }
  }

  return { entity, country, date, textQuery: [entity, ...remaining].join(' ').trim() };
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const q = query.trim();
  if (!q || q.length < 2) {
    return { entities: [], documents: [], symbols: [], envelope: emptyIntelligenceEnvelope() };
  }

  const { entity, country, date, textQuery } = parseQuery(q);

  const [docResults, entityResult, symbolResults] = await Promise.all([
    searchDocuments(textQuery || q, undefined, date ? `${date}` : undefined, date ? `${date}` : undefined),
    entity ? fetchEntityIntel(entity, { country, date }) : Promise.resolve(null),
    searchSymbols(q),
  ]);

  const entities: GlobalSearchEntity[] = [];
  const envelope: IntelligenceEnvelope = emptyIntelligenceEnvelope();
  if (entityResult) {
    const ent = entityResult.entity ?? (entityResult.supplyChain ? { id: entityResult.supplyChain.symbol, symbol: entityResult.supplyChain.symbol, name: entityResult.supplyChain.name } : null);
    if (ent) {
      const sc = entityResult.supplyChain;
      const relCount = (sc?.customers?.length ?? 0) + (sc?.suppliers?.length ?? 0) + (sc?.partners?.length ?? 0);
      entities.push({
        id: ent.id,
        symbol: ent.symbol || ent.name,
        name: ent.name,
        relationshipCount: relCount,
      });
    }
    envelope.entities = entityResult.envelope.entities;
    envelope.relationships = entityResult.envelope.relationships;
    envelope.events = entityResult.envelope.events;
  }

  const documents: GlobalSearchDocument[] = (docResults ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    published_at: d.published_at,
    source: d.source,
  }));
  envelope.documents = docResults ?? [];

  const symbols: GlobalSearchSymbol[] = (symbolResults ?? []).map((s) => ({
    symbol: s.symbol,
    name: s.name,
    type: s.type,
  }));

  return { entities, documents, symbols, envelope };
}
