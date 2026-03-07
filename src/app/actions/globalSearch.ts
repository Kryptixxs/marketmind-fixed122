'use server';

import { searchDocumentsPage } from './searchDocuments';
import { fetchEntityIntel } from './fetchEntityIntel';
import { searchSymbols } from './searchSymbols';
import type {
  IntelligenceEntity,
  IntelligenceEnvelope,
  IntelligenceResponse,
  IntelligenceSymbol,
  PaginatedResult,
} from '@/lib/intelligence-contract';
import { emptyIntelligenceEnvelope, emptyPaginatedResult } from '@/lib/intelligence-contract';

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

export type GlobalSearchV2Options = {
  pageSize?: number;
  cursors?: {
    entities?: string;
    documents?: string;
    relationships?: string;
    events?: string;
    symbols?: string;
  };
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

function parseOffset(cursor?: string): number {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function paginateItems<T>(items: T[], cursor?: string, pageSize = 20): PaginatedResult<T> {
  const offset = parseOffset(cursor);
  const boundedPageSize = Math.min(Math.max(pageSize, 1), 100);
  const pageItems = items.slice(offset, offset + boundedPageSize);
  const nextOffset = offset + pageItems.length;
  const nextCursor = nextOffset < items.length ? String(nextOffset) : undefined;
  return {
    items: pageItems,
    total: items.length,
    nextCursor,
  };
}

function uniqueEntities(entities: IntelligenceEntity[]): IntelligenceEntity[] {
  const byId = new Map<string, IntelligenceEntity>();
  for (const entity of entities) {
    if (!byId.has(entity.id)) {
      byId.set(entity.id, entity);
    }
  }
  return Array.from(byId.values());
}

function toGlobalSearchEntity(entity: IntelligenceEntity, relationshipCount: number): GlobalSearchEntity {
  return {
    id: entity.id,
    symbol: entity.ticker ?? entity.display_name,
    name: entity.display_name,
    relationshipCount,
  };
}

export async function globalSearchV2(query: string, options: GlobalSearchV2Options = {}): Promise<IntelligenceResponse> {
  const q = query.trim();
  if (!q || q.length < 2) {
    return {
      entities: emptyPaginatedResult(),
      documents: emptyPaginatedResult(),
      relationships: emptyPaginatedResult(),
      events: emptyPaginatedResult(),
      symbols: emptyPaginatedResult(),
      metadata: { query: q },
    };
  }

  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100);
  const { entity, country, date, textQuery } = parseQuery(q);

  const [docResults, entityResult, symbolResults] = await Promise.all([
    searchDocumentsPage(textQuery || q, {
      dateFrom: date ? `${date}` : undefined,
      dateTo: date ? `${date}` : undefined,
      limit: pageSize,
      cursor: options.cursors?.documents,
      entityId: undefined,
    }),
    entity ? fetchEntityIntel(entity, { country, date }) : Promise.resolve(null),
    searchSymbols(q),
  ]);

  const envelope: IntelligenceEnvelope = emptyIntelligenceEnvelope();
  let relationshipCount = 0;
  let canonicalEntityId: string | undefined;

  if (entityResult) {
    const ent = entityResult.entity;
    if (ent) {
      canonicalEntityId = ent.id;
    }
    const sc = entityResult.supplyChain;
    relationshipCount = (sc?.customers?.length ?? 0) + (sc?.suppliers?.length ?? 0) + (sc?.partners?.length ?? 0);
    envelope.entities = entityResult.envelope.entities;
    envelope.relationships = entityResult.envelope.relationships;
    envelope.events = entityResult.envelope.events;
  }

  envelope.documents = docResults.items ?? [];

  const symbols: IntelligenceSymbol[] = (symbolResults ?? []).map((s) => ({
    symbol: s.symbol,
    name: s.name,
    type: s.type,
  }));

  const entityItems = uniqueEntities(envelope.entities);
  const pagedEntities = paginateItems(entityItems, options.cursors?.entities, pageSize);
  const pagedRelationships = paginateItems(envelope.relationships, options.cursors?.relationships, pageSize);
  const pagedEvents = paginateItems(envelope.events, options.cursors?.events, pageSize);
  const pagedSymbols = paginateItems(symbols, options.cursors?.symbols, pageSize);
  const response: IntelligenceResponse = {
    entities: {
      items: pagedEntities.items,
      total: pagedEntities.total,
      nextCursor: pagedEntities.nextCursor,
    },
    documents: {
      items: docResults.items,
      total: docResults.total,
      nextCursor: docResults.nextCursor,
    },
    relationships: pagedRelationships,
    events: pagedEvents,
    symbols: pagedSymbols,
    metadata: {
      query: q,
      canonicalEntityId,
      filterState: { country, date },
      provisional: !canonicalEntityId,
    },
  };
  if (process.env.INTEL_TELEMETRY === '1') {
    console.info('[SEARCH_TELEMETRY]', {
      query: q,
      canonicalEntityId: response.metadata.canonicalEntityId ?? null,
      entityCount: response.entities.items.length,
      relationshipCount: response.relationships.items.length,
      documentCount: response.documents.items.length,
      filterState: response.metadata.filterState ?? {},
    });
  }
  return response;
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const response = await globalSearchV2(query, { pageSize: 20 });
  const entities: GlobalSearchEntity[] = response.entities.items.map((ent) =>
    toGlobalSearchEntity(ent, response.relationships.total ?? 0)
  );
  const documents: GlobalSearchDocument[] = response.documents.items.map((doc) => ({
    id: doc.id,
    title: doc.title,
    published_at: doc.published_at,
    source: doc.source ?? '',
  }));
  const symbols: GlobalSearchSymbol[] = (response.symbols?.items ?? []).map((s) => ({
    symbol: s.symbol,
    name: s.name,
    type: s.type,
  }));
  return {
    entities,
    documents,
    symbols,
    envelope: {
      entities: response.entities.items,
      documents: response.documents.items,
      relationships: response.relationships.items,
      events: response.events.items,
    },
  };
}
