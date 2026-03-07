import type { IntelligenceGraphEdge } from '@/lib/intelligence-contract';

function config() {
  return {
    url: process.env.NEO4J_HTTP_URL,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
  };
}

export function canUseNeo4j(): boolean {
  return Boolean(config().url);
}

function authHeader(username?: string, password?: string): string | undefined {
  if (!username || !password) return undefined;
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export async function traverseEntityGraphNeo4j(params: {
  entityId: string;
  depth?: number;
  relationshipType?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<IntelligenceGraphEdge[]> {
  const { url, username, password } = config();
  if (!url) return [];

  const depth = Math.min(Math.max(params.depth ?? 1, 1), 3);
  const filters: string[] = [];
  if (params.relationshipType) filters.push(`toLower(type(rel)) = toLower($relationshipType)`);
  if (params.country) filters.push(`toLower(coalesce(rel.country, '')) CONTAINS toLower($country)`);
  if (params.dateFrom) filters.push(`datetime(coalesce(rel.created_at, datetime('1970-01-01T00:00:00Z'))) >= datetime($dateFrom)`);
  if (params.dateTo) filters.push(`datetime(coalesce(rel.created_at, datetime())) <= datetime($dateTo)`);
  const relFilter = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const query = `
    MATCH (src:Entity {id: $entityId})-[r*1..${depth}]-(dst:Entity)
    UNWIND r AS rel
    WITH startNode(rel) AS a, endNode(rel) AS b, rel
    ${relFilter}
    RETURN DISTINCT a.id AS from_id, b.id AS to_id, type(rel) AS relationship_type, coalesce(rel.weight, 1) AS weight, toString(rel.created_at) AS created_at
  `;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader(username, password) ? { Authorization: authHeader(username, password)! } : {}),
    },
    body: JSON.stringify({
      statements: [
        {
          statement: query,
          parameters: {
            entityId: params.entityId,
            relationshipType: params.relationshipType,
            country: params.country,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
          },
        },
      ],
    }),
  });

  if (!res.ok) return [];
  const json: any = await res.json();
  const rows = json?.results?.[0]?.data ?? [];
  return rows.map((r: any) => {
    const row = r.row ?? [];
    return {
      from_id: row[0],
      to_id: row[1],
      relationship_type: row[2] ?? 'RELATED_TO',
      weight: Number(row[3] ?? 1),
      created_at: row[4] ?? undefined,
    } as IntelligenceGraphEdge;
  });
}
