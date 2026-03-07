import type { IntelligenceDocument } from '@/lib/intelligence-contract';

function getConfig() {
  const endpoint = process.env.OPENSEARCH_URL;
  const username = process.env.OPENSEARCH_USERNAME;
  const password = process.env.OPENSEARCH_PASSWORD;
  const index = process.env.OPENSEARCH_DOCUMENT_INDEX ?? 'documents_index';
  return { endpoint, username, password, index };
}

function authHeader(username?: string, password?: string): string | undefined {
  if (!username || !password) return undefined;
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export function canUseOpenSearch(): boolean {
  const { endpoint } = getConfig();
  return Boolean(endpoint);
}

export async function searchDocumentsOpenSearch(params: {
  query: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  size?: number;
}): Promise<IntelligenceDocument[]> {
  const result = await searchDocumentsOpenSearchPaged({
    query: params.query,
    entityId: params.entityId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    size: params.size,
  });
  return result.items;
}

export async function searchDocumentsOpenSearchPaged(params: {
  query: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  size?: number;
  from?: number;
}): Promise<{ items: IntelligenceDocument[]; total: number }> {
  const { endpoint, username, password, index } = getConfig();
  if (!endpoint) return { items: [], total: 0 };

  const must: any[] = [];
  const filter: any[] = [];

  if (params.query.trim()) {
    must.push({
      multi_match: {
        query: params.query,
        fields: ['title^5', 'body^2', 'source^1.5', 'aliases^3'],
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  if (params.entityId) {
    filter.push({ term: { entity_ids: params.entityId } });
  }
  if (params.dateFrom || params.dateTo) {
    filter.push({
      range: {
        published_at: {
          gte: params.dateFrom,
          lte: params.dateTo,
        },
      },
    });
  }

  const res = await fetch(`${endpoint.replace(/\/+$/, '')}/${index}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader(username, password) ? { Authorization: authHeader(username, password)! } : {}),
    },
    body: JSON.stringify({
      size: params.size ?? 50,
      from: Math.max(0, params.from ?? 0),
      query: { bool: { must, filter } },
      sort: [{ _score: 'desc' }, { published_at: 'desc' }],
    }),
  });

  if (!res.ok) return { items: [], total: 0 };
  const json: any = await res.json();
  const hits = json?.hits?.hits ?? [];
  const items = hits.map((h: any) => {
    const src = h._source ?? {};
    return {
      id: src.id ?? h._id,
      title: src.title ?? '',
      body: src.body ?? '',
      entity_ids: Array.isArray(src.entity_ids) ? src.entity_ids : [],
      country_tags: Array.isArray(src.country_tags) ? src.country_tags : [],
      published_at: src.published_at ?? '',
      source: src.source ?? '',
      url: src.url ?? '',
    } as IntelligenceDocument;
  });
  const total = Number(json?.hits?.total?.value ?? items.length);
  return { items, total };
}

export async function indexDocumentOpenSearch(doc: IntelligenceDocument & { aliases?: string[] }): Promise<boolean> {
  const { endpoint, username, password, index } = getConfig();
  if (!endpoint) return false;
  const res = await fetch(`${endpoint.replace(/\/+$/, '')}/${index}/_doc/${encodeURIComponent(doc.id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader(username, password) ? { Authorization: authHeader(username, password)! } : {}),
    },
    body: JSON.stringify(doc),
  });
  return res.ok;
}
