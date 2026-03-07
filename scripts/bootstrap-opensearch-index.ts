/**
 * Create/freeze OpenSearch document index mappings for intelligence search.
 * Run: npx tsx scripts/bootstrap-opensearch-index.ts
 */

const endpoint = process.env.OPENSEARCH_URL ?? '';
const username = process.env.OPENSEARCH_USERNAME;
const password = process.env.OPENSEARCH_PASSWORD;
const index = process.env.OPENSEARCH_DOCUMENT_INDEX ?? 'documents_index';

if (!endpoint) {
  console.error('Missing OPENSEARCH_URL');
  process.exit(1);
}

function authHeader(): string | undefined {
  if (!username || !password) return undefined;
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function request(path: string, method: string, body?: unknown) {
  const res = await fetch(`${endpoint.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader() ? { Authorization: authHeader()! } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function run() {
  const exists = await request(index, 'HEAD');
  if (exists.ok) {
    console.log(`Index ${index} already exists; mappings are treated as frozen.`);
    return;
  }

  const createRes = await request(index, 'PUT', {
    settings: {
      analysis: {
        normalizer: {
          lowercase_normalizer: {
            type: 'custom',
            char_filter: [],
            filter: ['lowercase', 'asciifolding'],
          },
        },
      },
    },
    mappings: {
      dynamic: false,
      properties: {
        id: { type: 'keyword' },
        title: { type: 'text' },
        body: { type: 'text' },
        source: { type: 'text' },
        source_type: { type: 'keyword' },
        language: { type: 'keyword' },
        published_at: { type: 'date' },
        url: { type: 'keyword', index: false },
        entity_ids: { type: 'keyword' },
        country_tags: { type: 'keyword', normalizer: 'lowercase_normalizer' },
        aliases: { type: 'text' },
      },
    },
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Failed to create index ${index}: ${createRes.status} ${text}`);
  }

  console.log(`Created OpenSearch index ${index} with frozen mappings.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
